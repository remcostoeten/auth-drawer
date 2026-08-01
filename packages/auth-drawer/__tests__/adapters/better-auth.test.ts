import { describe, expect, it, vi } from "vitest";
import { createBetterAuthAdapter } from "../../src/adapters/better-auth";

function makeClient(overrides: Record<string, any> = {}) {
  return {
    signIn: {
      email: vi.fn(async () => ({ data: { user: { id: "1" } } })),
      social: vi.fn(async () => ({ data: { url: "https://oauth" } })),
    },
    signUp: {
      email: vi.fn(async () => ({ data: { user: { id: "1" } } })),
    },
    signOut: vi.fn(async () => ({ data: {} })),
    requestPasswordReset: vi.fn(async () => ({ data: {} })),
    ...overrides,
  };
}

describe("createBetterAuthAdapter", () => {
  it("defaults requiresName to true and derives providers", () => {
    const adapter = createBetterAuthAdapter({
      client: makeClient({ options: { socialProviders: ["github"] } }),
    });
    expect(adapter.id).toBe("better-auth");
    expect(adapter.requiresName).toBe(true);
    expect(adapter.providers).toEqual(["github"]);
  });

  it("falls back to github/google when no providers are configured", () => {
    const adapter = createBetterAuthAdapter({ client: makeClient() });
    expect(adapter.providers).toEqual(["github", "google"]);
  });

  it("does not leak a Proxy client's options into providers (regression)", () => {
    // A real Better Auth client is a Proxy where EVERY property access returns a
    // truthy nested proxy (it lazily builds RPC paths). The old code did
    // `?? client.options?.socialProviders ?? [...]`, so `providers` became a
    // proxy — and the form later crashed on `providers.length > 0`
    // ("Cannot convert object to primitive value").
    const handler: ProxyHandler<() => void> = {
      get: () => new Proxy(() => {}, handler),
    };
    const proxyClient = new Proxy(() => {}, handler) as never;

    const adapter = createBetterAuthAdapter({ client: proxyClient });
    expect(Array.isArray(adapter.providers)).toBe(true);
    expect(adapter.providers).toEqual(["github", "google"]);
    expect(() => (adapter.providers as string[]).length > 0).not.toThrow();
  });

  it("forwards credentials and rememberMe to client.signIn.email", async () => {
    const client = makeClient();
    const adapter = createBetterAuthAdapter({ client, callbackURL: "/app" });
    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: true });
    expect(result.success).toBe(true);
    expect(client.signIn.email).toHaveBeenCalledWith({
      email: "a@b.co",
      password: "pw",
      rememberMe: true,
      callbackURL: "/app",
    });
  });

  it("maps INVALID_EMAIL_OR_PASSWORD to invalid_credentials on the form", async () => {
    const client = makeClient({
      signIn: { email: vi.fn(async () => ({ error: { code: "INVALID_EMAIL_OR_PASSWORD" } })) },
    });
    const adapter = createBetterAuthAdapter({ client });
    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: false });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.code).toBe("invalid_credentials");
  });

  it("maps USER_ALREADY_EXISTS to email_taken on the email field", async () => {
    const client = makeClient({
      signUp: { email: vi.fn(async () => ({ error: { code: "USER_ALREADY_EXISTS" } })) },
    });
    const adapter = createBetterAuthAdapter({ client });
    const result = await adapter.signUp({ email: "a@b.co", password: "pw", name: "Ada", rememberMe: false });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.code).toBe("email_taken");
    expect(!result.success && result.error.target).toBe("email");
  });

  it("maps HTTP 429 to a retryable rate_limited error", async () => {
    const client = makeClient({
      signIn: { email: vi.fn(async () => ({ error: { status: 429 } })) },
    });
    const adapter = createBetterAuthAdapter({ client });
    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: false });
    expect(!result.success && result.error.code).toBe("rate_limited");
    expect(!result.success && result.error.retryable).toBe(true);
  });

  it("only advertises optional features when the client supports them", () => {
    const plain = createBetterAuthAdapter({ client: makeClient() });
    expect(plain.features).toBeUndefined();

    const rich = createBetterAuthAdapter({
      client: makeClient({
        signIn: {
          email: vi.fn(),
          social: vi.fn(),
          magicLink: vi.fn(async () => ({ data: {} })),
        },
      }),
    });
    expect(rich.features?.magicLink).toBeDefined();
  });
});
