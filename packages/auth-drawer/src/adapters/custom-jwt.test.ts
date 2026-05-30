import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomJwtAdapter } from "./custom-jwt";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createCustomJwtAdapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts credentials to the login url and persists the token", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ token: "jwt-123", user: { id: "1" } }));
    const adapter = createCustomJwtAdapter({ baseUrl: "https://api.test", fetcher });

    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: false });

    expect(result.success).toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.test/login",
      expect.objectContaining({ method: "POST" }),
    );
    expect(localStorage.getItem("auth_token")).toBe("jwt-123");
  });

  it("attaches the stored bearer token to authenticated requests", async () => {
    localStorage.setItem("auth_token", "existing-token");
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => jsonResponse({}));
    const adapter = createCustomJwtAdapter({ baseUrl: "https://api.test", fetcher });

    await adapter.signOut();

    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer existing-token");
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("maps a 401 to invalid_credentials", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ message: "nope" }, 401));
    const adapter = createCustomJwtAdapter({ baseUrl: "https://api.test", fetcher });
    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: false });
    expect(!result.success && result.error.code).toBe("invalid_credentials");
  });

  it("maps a 409 to email_taken on the email field", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ message: "exists" }, 409));
    const adapter = createCustomJwtAdapter({ baseUrl: "https://api.test", fetcher });
    const result = await adapter.signUp({ email: "a@b.co", password: "pw", name: "Ada", rememberMe: false });
    expect(!result.success && result.error.code).toBe("email_taken");
    expect(!result.success && result.error.target).toBe("email");
  });

  it("maps a thrown network error to network_error", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const adapter = createCustomJwtAdapter({ baseUrl: "https://api.test", fetcher });
    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: false });
    expect(!result.success && result.error.code).toBe("network_error");
    expect(!result.success && result.error.retryable).toBe(true);
  });
});
