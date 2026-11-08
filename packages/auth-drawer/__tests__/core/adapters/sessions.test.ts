import { beforeEach, describe, expect, it, vi } from "vitest";
import { STATIC_SESSION } from "../../../src/core";
import { createBetterAuthAdapter } from "../../../src/core/adapters/better-auth";
import { createClerkAdapter, mapClerkUser } from "../../../src/core/adapters/clerk";
import { createCustomJwtAdapter } from "../../../src/core/adapters/custom-jwt";
import { createFirebaseAdapter } from "../../../src/core/adapters/firebase";
import { createMockAdapter } from "../../../src/core/adapters/mock";
import { createNextAuthAdapter, mapNextAuthSession } from "../../../src/core/adapters/next-auth";
import { createPassportAdapter } from "../../../src/core/adapters/passport";
import { createSupabaseAdapter } from "../../../src/core/adapters/supabase";

async function flush() {
  for (let index = 0; index < 5; index++) await Promise.resolve();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CREDENTIALS = { email: "a@b.co", password: "pw", rememberMe: false };

describe("custom-jwt session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetches the profile on subscribe and refreshes after sign in and sign out", async () => {
    let signedIn = false;
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith("/me")) return signedIn ? json({ id: 7, email: "a@b.co" }) : json({}, 401);
      signedIn = url.endsWith("/login");
      return json({ token: "jwt" });
    });
    const adapter = createCustomJwtAdapter({ baseUrl: "https://api.test", fetcher });
    adapter.session.subscribe(() => undefined);
    await flush();
    expect(adapter.session.getSnapshot()).toMatchObject({ data: null, isPending: false });

    await adapter.signIn?.(CREDENTIALS);
    await flush();
    expect(adapter.session.getSnapshot().data?.user?.id).toBe("7");

    await adapter.signOut?.();
    await flush();
    expect(adapter.session.getSnapshot().data).toBeNull();
  });

  it("does not fetch the profile until someone subscribes", () => {
    const fetcher = vi.fn(async () => json({}, 401));
    createCustomJwtAdapter({ fetcher });

    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("passport session", () => {
  it("reads the user and refreshes after sign in", async () => {
    let signedIn = false;
    const fetcher = vi.fn(async (url: string) => {
      if (url === "/user") return signedIn ? json({ id: 1, email: "a@b.co" }) : json({}, 401);
      signedIn = true;
      return json({});
    });
    const adapter = createPassportAdapter({ fetcher });
    adapter.session.subscribe(() => undefined);
    await flush();
    expect(adapter.session.getSnapshot().data).toBeNull();

    await adapter.signIn?.(CREDENTIALS);
    await flush();

    expect(adapter.session.getSnapshot().data?.user?.id).toBe("1");
  });
});

describe("supabase session", () => {
  function makeSupabase(session: unknown) {
    let notify: (event: string, session: unknown) => void = () => undefined;
    const unsubscribe = vi.fn();
    const auth = {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      onAuthStateChange: vi.fn((callback: typeof notify) => {
        notify = callback;
        return { data: { subscription: { unsubscribe } } };
      }),
    };
    return { auth, unsubscribe, emit: (next: unknown) => notify("SIGNED_IN", next) };
  }

  it("starts pending, resolves from getSession and follows auth state changes", async () => {
    const supabase = makeSupabase({ user: { id: "u1", email: "a@b.co" } });
    const adapter = createSupabaseAdapter({ supabase, redirectTo: "https://app" });
    expect(adapter.session.getSnapshot().isPending).toBe(true);
    expect(supabase.auth.getSession).not.toHaveBeenCalled();

    const stop = adapter.session.subscribe(() => undefined);
    await flush();
    expect(adapter.session.getSnapshot().data?.user?.id).toBe("u1");
    expect(adapter.session.getSnapshot().isPending).toBe(false);

    supabase.emit(null);
    expect(adapter.session.getSnapshot().data).toBeNull();

    stop();
    expect(supabase.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("surfaces a getSession error", async () => {
    const supabase = makeSupabase(null);
    const failure = new Error("nope");
    supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: failure });
    const adapter = createSupabaseAdapter({ supabase, redirectTo: "https://app" });
    adapter.session.subscribe(() => undefined);
    await flush();

    expect(adapter.session.getSnapshot().error).toBe(failure);
  });
});

describe("firebase session", () => {
  function makeFirebase(currentUser: unknown = null) {
    let onUser: (user: unknown) => void = () => undefined;
    let onError: (error: unknown) => void = () => undefined;
    const unsubscribe = vi.fn();
    const auth = {
      currentUser,
      onAuthStateChanged: vi.fn((next: typeof onUser, error?: typeof onError) => {
        onUser = next;
        onError = error ?? onError;
        return unsubscribe;
      }),
    };
    const adapter = createFirebaseAdapter({
      auth,
      createUserWithEmailAndPassword: vi.fn(),
      signInWithEmailAndPassword: vi.fn(),
      signOut: vi.fn(),
    });
    return {
      adapter,
      unsubscribe,
      emitUser: (user: unknown) => onUser(user),
      emitError: (e: unknown) => onError(e),
    };
  }

  it("seeds from currentUser and follows onAuthStateChanged", () => {
    const { adapter, emitUser, unsubscribe } = makeFirebase({ uid: "f1", email: "a@b.co" });
    expect(adapter.session.getSnapshot()).toMatchObject({ isPending: true });
    expect(adapter.session.getSnapshot().data?.user?.id).toBe("f1");

    const stop = adapter.session.subscribe(() => undefined);
    emitUser({ uid: "f2", email: "c@d.co" });
    expect(adapter.session.getSnapshot().data?.user?.id).toBe("f2");
    expect(adapter.session.getSnapshot().isPending).toBe(false);

    emitUser(null);
    expect(adapter.session.getSnapshot().data).toBeNull();

    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("reports an auth state error", () => {
    const { adapter, emitError } = makeFirebase();
    adapter.session.subscribe(() => undefined);
    const failure = new Error("denied");

    emitError(failure);

    expect(adapter.session.getSnapshot().error).toBe(failure);
    expect(adapter.session.getSnapshot().isPending).toBe(false);
  });

  it("is not pending when the SDK cannot report changes", () => {
    const adapter = createFirebaseAdapter({
      auth: {},
      createUserWithEmailAndPassword: vi.fn(),
      signInWithEmailAndPassword: vi.fn(),
      signOut: vi.fn(),
    });

    expect(adapter.session.getSnapshot().isPending).toBe(false);
  });
});

describe("mock session", () => {
  it("follows sign in and sign out for every adapter instance", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const listener = vi.fn();
    adapter.session.subscribe(listener);
    const signedOut = adapter.session.getSnapshot();
    expect(signedOut.data).toBeNull();
    expect(adapter.session.getSnapshot()).toBe(signedOut);

    await adapter.signIn?.({ email: "admin@example.com", password: "password", rememberMe: false });
    expect(adapter.session.getSnapshot().data?.user?.email).toBe("admin@example.com");
    expect(listener).toHaveBeenCalledTimes(1);

    await adapter.signOut?.();
    expect(adapter.session.getSnapshot().data).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("better-auth session", () => {
  it("reads client.getSession and refreshes after sign in and sign out", async () => {
    let user: { id: string } | null = null;
    const client = {
      signIn: {
        email: vi.fn(async () => {
          user = { id: "b1" };
          return { data: {} };
        }),
      },
      signOut: vi.fn(async () => {
        user = null;
        return { data: {} };
      }),
      getSession: vi.fn(async () => ({ data: user ? { user, session: { id: "s" } } : null })),
    };
    const adapter = createBetterAuthAdapter({ client });
    adapter.session.subscribe(() => undefined);
    await flush();
    expect(adapter.session.getSnapshot()).toMatchObject({ data: null, isPending: false });

    await adapter.signIn?.(CREDENTIALS);
    await flush();
    expect(adapter.session.getSnapshot().data?.user?.id).toBe("b1");
    expect(adapter.session.getSnapshot().data?.session).toEqual({ id: "s" });

    await adapter.signOut?.();
    await flush();
    expect(adapter.session.getSnapshot().data).toBeNull();
  });

  it("does not refresh after a failed sign in", async () => {
    const client = {
      signIn: { email: vi.fn(async () => ({ error: { code: "INVALID_EMAIL_OR_PASSWORD" } })) },
      getSession: vi.fn(async () => ({ data: null })),
    };
    const adapter = createBetterAuthAdapter({ client });
    adapter.session.subscribe(() => undefined);
    await flush();

    await adapter.signIn?.(CREDENTIALS);
    await flush();

    expect(client.getSession).toHaveBeenCalledTimes(1);
  });

  it("falls back to a static session when the client has no getSession", () => {
    expect(createBetterAuthAdapter({ client: {} }).session).toBe(STATIC_SESSION);
  });

  it("captures a getSession failure as session error", async () => {
    const failure = new Error("network");
    const adapter = createBetterAuthAdapter({
      client: {
        getSession: vi.fn(async () => {
          throw failure;
        }),
      },
    });
    adapter.session.subscribe(() => undefined);
    await flush();

    expect(adapter.session.getSnapshot().error).toBe(failure);
  });
});

describe("hook-driven adapters", () => {
  it("expose a static session and ship the mappers for the renderer", () => {
    expect(createClerkAdapter({ client: {} }).session).toBe(STATIC_SESSION);
    expect(createNextAuthAdapter({ client: { signIn: vi.fn() } }).session).toBe(STATIC_SESSION);

    expect(mapClerkUser(null)).toBeNull();
    expect(
      mapClerkUser({ id: "c1", primaryEmailAddress: { emailAddress: "a@b.co" }, fullName: "Ada" }),
    ).toMatchObject({
      user: { id: "c1", email: "a@b.co", name: "Ada" },
    });
    expect(mapNextAuthSession(null)).toBeNull();
    expect(mapNextAuthSession({ user: { email: "a@b.co" } })?.user?.id).toBe("a@b.co");
  });
});
