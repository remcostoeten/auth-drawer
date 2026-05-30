"use client";

import { MessageSquare, Search } from "lucide-react";
import { useState } from "react";
import { docsCorpus, type DocsSnippet } from "@/lib/docs/docs-corpus";
import { searchDocsCorpus } from "@/lib/docs/docs-search";

type DocsChatResponse = {
  answer: string;
  sources: DocsSnippet[];
  limited?: boolean;
  retryAfterSeconds?: number;
  mode?: "mock" | "cloudflare";
};

const SUGGESTIONS = [
  "How do I install this?",
  "How do OAuth providers work?",
  "Can I open the drawer on scroll?",
];

export function DocsAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<DocsChatResponse | null>(null);
  const [matches, setMatches] = useState<DocsSnippet[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function askDocs(nextQuestion = question) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;

    const snippets = searchDocsCorpus(trimmed, docsCorpus, 5);
    setQuestion(trimmed);
    setMatches(snippets);
    setStatus("loading");
    setAnswer(null);

    try {
      const response = await fetch("/api/docs-chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          snippets,
        }),
      });

      const payload = (await response.json()) as DocsChatResponse;
      setAnswer(payload);
      setStatus(response.ok ? "idle" : "error");
    } catch {
      setStatus("error");
      setAnswer({
        answer:
          "AI answer is unavailable right now. The local docs matches below still point to the relevant sections.",
        sources: snippets,
      });
    }
  }

  return (
    <div className="mb-7 rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[5px] bg-foreground text-background">
          <MessageSquare size={15} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-xl text-foreground">Ask the docs</h3>
          <p className="mt-1 text-xs leading-5 text-foreground/48">
            Local retrieval first, server-side answer second. Cloudflare Workers
            AI can be enabled later with env vars.
          </p>
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void askDocs();
        }}
      >
        <label className="relative min-w-0 flex-1">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/34"
          />
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about install, OAuth, triggers..."
            maxLength={300}
            className="h-10 w-full rounded-[5px] border border-foreground/10 bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/24"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading" || question.trim().length === 0}
          className="h-10 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === "loading" ? "Asking" : "Ask"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => void askDocs(suggestion)}
            className="rounded-[5px] border border-foreground/8 px-2.5 py-1 text-[0.68rem] font-semibold text-foreground/48 transition-colors hover:border-foreground/18 hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {answer ? (
        <div className="mt-4 rounded-[6px] border border-foreground/8 bg-background p-3">
          <p className="text-sm leading-6 text-foreground/70">{answer.answer}</p>
          {answer.retryAfterSeconds ? (
            <p className="mt-2 text-xs text-foreground/42">
              Retry in {answer.retryAfterSeconds}s.
            </p>
          ) : null}
          {answer.mode === "mock" ? (
            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.12em] text-foreground/30">
              Mocked server answer
            </p>
          ) : null}
        </div>
      ) : null}

      {matches.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {matches.slice(0, 4).map((match) => (
            <a
              key={match.id}
              href={match.href}
              className="rounded-[5px] border border-foreground/8 bg-background p-3 transition-colors hover:border-foreground/20"
            >
              <span className="text-xs font-semibold text-foreground/72">
                {match.title}
              </span>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground/44">
                {match.body}
              </p>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
