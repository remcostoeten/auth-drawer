import { describe, expect, it } from "vitest";
import { createMockAdapter } from "../../src/adapters/mock";

describe("createMockAdapter", () => {
  it("exposes its id, providers, and demo credentials", () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    expect(adapter.id).toBe("mock");
    expect(adapter.providers).toContain("github");
    expect(adapter.demoCredentials).toEqual({
      email: "admin@example.com",
      password: "password",
    });
  });

  it("signs in with the configured demo credentials", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const result = await adapter.signIn({ email: "admin@example.com", password: "password", rememberMe: false });
    expect(result.success).toBe(true);
    expect(result.success && result.data?.user.email).toBe("admin@example.com");
  });

  it("rejects wrong credentials with invalid_credentials on the form", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const result = await adapter.signIn({ email: "admin@example.com", password: "wrong", rememberMe: false });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.code).toBe("invalid_credentials");
    expect(!result.success && result.error.target).toBe("form");
  });

  it("maps the spam address to a retryable rate_limited error", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const result = await adapter.signIn({ email: "spam@example.com", password: "password", rememberMe: false });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.code).toBe("rate_limited");
    expect(!result.success && result.error.retryable).toBe(true);
  });

  it("rejects sign up that reuses the demo email", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const result = await adapter.signUp({ email: "admin@example.com", password: "password", name: "Ada", rememberMe: false });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.code).toBe("email_taken");
    expect(!result.success && result.error.target).toBe("email");
  });

  it("requires an email for password reset", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const result = await adapter.requestPasswordReset?.("");
    expect(result?.success).toBe(false);
    expect(result && !result.success && result.error.code).toBe("required");
  });
});
