import { NextResponse } from "next/server";
import type { DocsSnippet } from "@/lib/docs/docs-corpus";

export const runtime = "nodejs";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

type RateLimitBackend =
  | {
      kind: "redis-rest";
      url: string;
      token: string;
    }
  | {
      kind: "cloudflare-kv";
      accountId: string;
      namespaceId: string;
      apiToken: string;
    }
  | {
      kind: "memory";
    };

type DocsChatRequest = {
  question?: unknown;
  snippets?: unknown;
};

declare global {
  // Development-safe rate limiter. Production should swap this for Redis,
  // Durable Objects, or another shared atomic store.
  var __docsChatRateLimit: RateLimitStore | undefined;
}

const rateLimitStore = globalThis.__docsChatRateLimit ?? new Map();
globalThis.__docsChatRateLimit = rateLimitStore;

const LIMITS = [
  { name: "minute", windowMs: 60_000, max: 5 },
  { name: "hour", windowMs: 60 * 60_000, max: 30 },
  { name: "day", windowMs: 24 * 60 * 60_000, max: 100 },
] as const;

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 80) ?? "unknown";
  return `${ip}:${userAgent}`;
}

function createRateLimitKey(kind: (typeof LIMITS)[number]["name"], key: string) {
  return `docs-chat:rate-limit:${kind}:${key}`;
}

function getRateLimitBackend() {
  const redisUrl =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    return {
      kind: "redis-rest" as const,
      url: redisUrl.replace(/\/$/, ""),
      token: redisToken,
    };
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
  const apiToken =
    process.env.CLOUDFLARE_KV_API_TOKEN ?? process.env.CLOUDFLARE_AI_API_TOKEN;

  if (accountId && namespaceId && apiToken) {
    return {
      kind: "cloudflare-kv" as const,
      accountId,
      namespaceId,
      apiToken,
    };
  }

  return {
    kind: "memory" as const,
  };
}

async function readBucketFromKv(
  backend: Extract<RateLimitBackend, { kind: "cloudflare-kv" }>,
  key: string,
) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${backend.accountId}/storage/kv/namespaces/${backend.namespaceId}/values/${encodeURIComponent(key)}`,
    {
      headers: {
        authorization: `Bearer ${backend.apiToken}`,
      },
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to read KV key ${key}: ${response.status}`);
  }

  const value = (await response.text()).trim();
  if (!value) return null;
  try {
    return JSON.parse(value) as RateLimitBucket;
  } catch {
    return null;
  }
}

async function writeBucketToKv(
  backend: Extract<RateLimitBackend, { kind: "cloudflare-kv" }>,
  key: string,
  bucket: RateLimitBucket,
  ttlSeconds: number,
) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${backend.accountId}/storage/kv/namespaces/${backend.namespaceId}/values/${encodeURIComponent(key)}?expiration_ttl=${ttlSeconds}`,
    {
      method: "PUT",
      headers: {
        authorization: `Bearer ${backend.apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(bucket),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to write KV key ${key}: ${response.status}`);
  }
}

async function incrementRedisBucket(
  backend: Extract<RateLimitBackend, { kind: "redis-rest" }>,
  key: string,
  windowMs: number,
) {
  const response = await fetch(`${backend.url}/multi-exec`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${backend.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, windowMs, "NX"],
      ["PTTL", key],
    ]),
  });

  if (!response.ok) {
    throw new Error(`Failed to update Redis rate limit key ${key}: ${response.status}`);
  }

  const result = (await response.json()) as Array<{
    result?: unknown;
    error?: string;
  }>;

  const error = result.find((item) => item.error)?.error;
  if (error) throw new Error(`Redis rate limit transaction failed: ${error}`);

  const count = Number(result[0]?.result);
  const ttlMs = Number(result[2]?.result);

  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error(`Redis rate limit transaction returned invalid data for ${key}`);
  }

  return {
    count,
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
  };
}

async function checkRateLimit(key: string) {
  const now = Date.now();
  const backend = getRateLimitBackend();

  for (const limit of LIMITS) {
    const bucketKey = createRateLimitKey(limit.name, key);

    if (backend.kind === "redis-rest") {
      const bucket = await incrementRedisBucket(
        backend,
        bucketKey,
        limit.windowMs,
      );

      if (bucket.count > limit.max) {
        return {
          limited: true,
          retryAfterSeconds: bucket.retryAfterSeconds,
        };
      }

      continue;
    }

    const existingBucket =
      backend.kind === "cloudflare-kv"
        ? await readBucketFromKv(backend, bucketKey)
        : rateLimitStore.get(bucketKey);

    const nextBucket =
      !existingBucket || existingBucket.resetAt <= now
        ? {
            count: 1,
            resetAt: now + limit.windowMs,
          }
        : {
            count: existingBucket.count + 1,
            resetAt: existingBucket.resetAt,
          };

    if (existingBucket && existingBucket.resetAt > now && existingBucket.count >= limit.max) {
      return {
        limited: true,
        retryAfterSeconds: Math.ceil((existingBucket.resetAt - now) / 1000),
      };
    }

    if (backend.kind === "cloudflare-kv") {
      const ttlSeconds = Math.max(1, Math.ceil((nextBucket.resetAt - now) / 1000));
      await writeBucketToKv(backend, bucketKey, nextBucket, ttlSeconds);
    } else {
      rateLimitStore.set(bucketKey, nextBucket);
    }
  }

  return {
    limited: false,
    retryAfterSeconds: 0,
  };
}

function isDocsSnippet(value: unknown): value is DocsSnippet {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.href === "string" &&
    typeof candidate.body === "string"
  );
}

function validatePayload(payload: DocsChatRequest) {
  if (typeof payload.question !== "string") {
    return { error: "Question is required." };
  }

  const question = payload.question.trim();
  if (question.length < 2) return { error: "Question is too short." };
  if (question.length > 300) return { error: "Question is too long." };

  if (!Array.isArray(payload.snippets)) {
    return { error: "Docs snippets are required." };
  }

  const snippets = payload.snippets.filter(isDocsSnippet).slice(0, 5).map((snippet) => ({
    ...snippet,
    title: snippet.title.slice(0, 120),
    href: snippet.href.slice(0, 160),
    body: snippet.body.slice(0, 1200),
  }));

  if (snippets.length === 0) return { error: "No matching docs context." };

  return { question, snippets };
}

function buildPrompt(question: string, snippets: DocsSnippet[]) {
  const context = snippets
    .map(
      (snippet, index) =>
        `Source ${index + 1}: ${snippet.title}\nURL: ${snippet.href}\n${snippet.body}`,
    )
    .join("\n\n");

  return {
    system:
      "You answer questions about Auth Drawer only. Use only the provided docs context. If the answer is not in the context, say you do not know. Keep the answer under 180 words and mention relevant section links.",
    user: `Docs context:\n${context}\n\nQuestion:\n${question}`,
  };
}

async function callCloudflareAI(question: string, snippets: DocsSnippet[]) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN;
  const model =
    process.env.CLOUDFLARE_AI_MODEL ?? "@cf/meta/llama-3.2-3b-instruct";

  if (!accountId || !apiToken) return null;

  const prompt = buildPrompt(question, snippets);
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        max_tokens: 220,
      }),
    },
  );

  if (!response.ok) {
    if (process.env.DOCS_CHAT_REQUIRE_AI === "true") {
      throw new Error(`Cloudflare Workers AI failed: ${response.status}`);
    }
    return null;
  }

  const payload = (await response.json()) as {
    result?: {
      response?: string;
    };
  };

  return payload.result?.response?.trim() || null;
}

function createMockAnswer(question: string, snippets: DocsSnippet[]) {
  const top = snippets[0];
  const sourceList = snippets
    .slice(0, 3)
    .map((snippet) => `${snippet.title} (${snippet.href})`)
    .join(", ");

  return `Based on the current docs, ${top.body} Relevant sections: ${sourceList}. Question received: "${question}".`;
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(getClientKey(request));
  if (rateLimit.limited) {
    return NextResponse.json(
      {
        answer:
          "Docs chat is rate limited for this browser. Local search still works.",
        sources: [],
        limited: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "retry-after": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let body: DocsChatRequest;
  try {
    body = (await request.json()) as DocsChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const validated = validatePayload(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const cloudflareAnswer = await callCloudflareAI(
    validated.question,
    validated.snippets,
  );

  return NextResponse.json({
    answer:
      cloudflareAnswer ??
      createMockAnswer(validated.question, validated.snippets),
    sources: validated.snippets,
    mode: cloudflareAnswer ? "cloudflare" : "mock",
  });
}
