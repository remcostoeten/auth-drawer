import { describe, expect, it } from "vitest";
import * as betterAuth from "../../src/solid/adapters/better-auth";
import * as clerk from "../../src/solid/adapters/clerk";
import * as customJwt from "../../src/solid/adapters/custom-jwt";
import * as firebase from "../../src/solid/adapters/firebase";
import * as mock from "../../src/solid/adapters/mock";
import * as nextAuth from "../../src/solid/adapters/next-auth";
import * as passport from "../../src/solid/adapters/passport";
import * as supabase from "../../src/solid/adapters/supabase";

describe("adapter entry points", () => {
  it("re-export the core adapter factories", () => {
    expect(betterAuth.createBetterAuthAdapter).toBeTypeOf("function");
    expect(supabase.createSupabaseAdapter).toBeTypeOf("function");
    expect(nextAuth.createNextAuthAdapter).toBeTypeOf("function");
    expect(clerk.createClerkAdapter).toBeTypeOf("function");
    expect(firebase.createFirebaseAdapter).toBeTypeOf("function");
    expect(customJwt.createCustomJwtAdapter).toBeTypeOf("function");
    expect(passport.createPassportAdapter).toBeTypeOf("function");
    expect(mock.createMockAdapter).toBeTypeOf("function");
  });

  it("re-export the session mappers used with bindSolidSession", () => {
    expect(betterAuth.mapBetterAuthSession).toBeTypeOf("function");
    expect(clerk.mapClerkUser).toBeTypeOf("function");
    expect(nextAuth.mapNextAuthSession).toBeTypeOf("function");
  });

  it("builds a mock adapter with a neutral session source", () => {
    const adapter = mock.createMockAdapter({ latencyMs: 0 });

    expect(adapter.id).toBe("mock");
    expect(adapter.session.getSnapshot().isPending).toBe(false);
  });
});
