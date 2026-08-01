import { describe, expect, it, vi } from "vitest";
import { createSupabaseAdapter } from "../../src/adapters/supabase";

function makeSupabase(overrides: Record<string, any> = {}) {
  return {
    auth: {
      signInWithPassword: vi.fn(async () => ({ data: { user: { id: "1" } } })),
      signUp: vi.fn(async () => ({ data: { user: { id: "1" } } })),
      signOut: vi.fn(async () => ({})),
      resetPasswordForEmail: vi.fn(async () => ({ data: {} })),
      updateUser: vi.fn(async () => ({ data: {} })),
      signInWithOAuth: vi.fn(async () => ({ data: {} })),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      ...overrides,
    },
  };
}

describe("createSupabaseAdapter", () => {
  it("defaults providers to github and google", () => {
    const adapter = createSupabaseAdapter({ supabase: makeSupabase(), redirectTo: "https://app" });
    expect(adapter.id).toBe("supabase");
    expect(adapter.providers).toEqual(["github", "google"]);
  });

  it("passes the name through sign up options metadata", async () => {
    const supabase = makeSupabase();
    const adapter = createSupabaseAdapter({ supabase, redirectTo: "https://app" });
    await adapter.signUp({ email: "a@b.co", password: "pw", name: "Ada", rememberMe: false });
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "a@b.co",
      password: "pw",
      options: { data: { name: "Ada" }, emailRedirectTo: "https://app" },
    });
  });

  it("maps invalid_credentials errors to the form", async () => {
    const supabase = makeSupabase({
      signInWithPassword: vi.fn(async () => ({ error: { code: "invalid_credentials" } })),
    });
    const adapter = createSupabaseAdapter({ supabase, redirectTo: "https://app" });
    const result = await adapter.signIn({ email: "a@b.co", password: "pw", rememberMe: false });
    expect(!result.success && result.error.code).toBe("invalid_credentials");
  });

  it("maps email_exists errors to email_taken on the email field", async () => {
    const supabase = makeSupabase({
      signUp: vi.fn(async () => ({ error: { code: "email_exists" } })),
    });
    const adapter = createSupabaseAdapter({ supabase, redirectTo: "https://app" });
    const result = await adapter.signUp({ email: "a@b.co", password: "pw", name: "Ada", rememberMe: false });
    expect(!result.success && result.error.code).toBe("email_taken");
    expect(!result.success && result.error.target).toBe("email");
  });

  it("only advertises magic link when signInWithOtp exists", () => {
    expect(createSupabaseAdapter({ supabase: makeSupabase(), redirectTo: "https://app" }).features)
      .toBeUndefined();

    const withOtp = makeSupabase({ signInWithOtp: vi.fn(async () => ({ data: {} })) });
    expect(createSupabaseAdapter({ supabase: withOtp, redirectTo: "https://app" }).features?.magicLink)
      .toBeDefined();
  });
});
