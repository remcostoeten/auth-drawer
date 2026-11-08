import { createSignal } from "solid-js";
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  AuthProvider,
  createAdapter,
  createAuthError,
  createPushSession,
  useAuth,
  useOptionalAuth,
  type AuthAdapter,
  type AuthContextValue,
  type AuthUiError,
} from "../../src/solid";
import { SIGNED_IN, SIGNED_OUT, createTestAdapter, credentials, flush } from "./helpers";

function captureAuth(adapter: AuthAdapter, props: Partial<Parameters<typeof AuthProvider>[0]> = {}) {
  const captured: { auth?: AuthContextValue } = {};

  function Capture() {
    captured.auth = useAuth();
    return null;
  }

  const view = render(() => (
    <AuthProvider adapter={adapter} {...props}>
      <Capture />
    </AuthProvider>
  ));

  return {
    ...view,
    auth() {
      if (!captured.auth) throw new Error("AuthProvider did not render");
      return captured.auth;
    },
  };
}

describe("useAuth", () => {
  it("throws outside an AuthProvider", () => {
    function Broken() {
      useAuth();
      return null;
    }

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(() => <Broken />)).toThrow("useAuth must be used within an AuthProvider");
    spy.mockRestore();
  });

  it("useOptionalAuth returns undefined outside a provider", () => {
    let value: AuthContextValue | undefined;

    function Probe() {
      value = useOptionalAuth();
      return null;
    }

    render(() => <Probe />);
    expect(value).toBeUndefined();
  });
});

describe("session accessors", () => {
  it("expose the session of the adapter and follow its changes", () => {
    const { source, push } = createPushSession(SIGNED_OUT);
    const { auth } = captureAuth(createTestAdapter({ session: source }));

    expect(auth().user()).toBeNull();
    expect(auth().session()).toBeNull();
    expect(auth().isPending()).toBe(false);
    expect(auth().error()).toBeNull();

    push(SIGNED_IN);
    expect(auth().user()?.email).toBe("test@example.com");
    expect(auth().session()).toEqual({ id: "session_1" });

    push({ data: null, isPending: true, error: null });
    expect(auth().user()).toBeNull();
    expect(auth().isPending()).toBe(true);

    const failure = new Error("offline");
    push({ data: null, isPending: false, error: failure });
    expect(auth().error()).toBe(failure);
  });

  it("are reactive inside effects and JSX", () => {
    const { source, push } = createPushSession(SIGNED_OUT);

    function Email() {
      const auth = useAuth();
      return <p data-testid="email">{auth.user()?.email ?? "signed out"}</p>;
    }

    const { getByTestId } = render(() => (
      <AuthProvider adapter={createTestAdapter({ session: source })}>
        <Email />
      </AuthProvider>
    ));

    expect(getByTestId("email").textContent).toBe("signed out");
    push(SIGNED_IN);
    expect(getByTestId("email").textContent).toBe("test@example.com");
  });

  it("follow a replaced adapter", () => {
    const first = createPushSession(SIGNED_OUT);
    const second = createPushSession(SIGNED_IN);
    const [adapter, setAdapter] = createSignal(createTestAdapter({ session: first.source }));
    const captured: { auth?: AuthContextValue } = {};

    function Capture() {
      captured.auth = useAuth();
      return null;
    }

    render(() => (
      <AuthProvider adapter={adapter()}>
        <Capture />
      </AuthProvider>
    ));
    expect(captured.auth?.user()).toBeNull();

    setAdapter(createTestAdapter({ session: second.source }));

    expect(captured.auth?.user()?.email).toBe("test@example.com");
  });
});

describe("actions", () => {
  it("signIn runs the adapter, calls adapter and provider callbacks and returns the result", async () => {
    const result = { success: true, data: { userId: "user_1" } };
    const adapter = createTestAdapter({ signIn: vi.fn(async () => result), onSuccess: vi.fn() });
    const onSuccess = vi.fn();
    const { auth } = captureAuth(adapter, { onSuccess });

    await expect(auth().signIn(credentials)).resolves.toBe(result);

    expect(adapter.signIn).toHaveBeenCalledWith(credentials);
    expect(adapter.onSuccess).toHaveBeenCalledWith("signIn");
    expect(onSuccess).toHaveBeenCalledWith("signIn");
  });

  it("reports failures to adapter and provider error callbacks without throwing", async () => {
    const error = createAuthError("invalid_credentials", "form");
    const result = { success: false, error };
    const adapter = createTestAdapter({ signIn: vi.fn(async () => result), onError: vi.fn() });
    const onError = vi.fn();
    const { auth } = captureAuth(adapter, { onError });

    await expect(auth().signIn(credentials)).resolves.toBe(result);

    expect(adapter.onError).toHaveBeenCalledWith(error, "signIn");
    expect(onError).toHaveBeenCalledWith(error, "signIn");
  });

  it("normalizes thrown errors into a failed result", async () => {
    const rawError = new Error("network unavailable");
    const normalized: AuthUiError = createAuthError("network_error", "form", { cause: rawError });
    const adapter = createTestAdapter({
      signIn: vi.fn(async () => {
        throw rawError;
      }),
      normalizeError: vi.fn(() => normalized),
    });
    const onError = vi.fn();
    const { auth } = captureAuth(adapter, { onError });

    await expect(auth().signIn(credentials)).resolves.toEqual({ success: false, error: normalized });

    expect(adapter.normalizeError).toHaveBeenCalledWith(rawError);
    expect(onError).toHaveBeenCalledWith(normalized, "signIn");
  });

  it("uses the latest callbacks without recreating the client", async () => {
    const [handler, setHandler] = createSignal(vi.fn());
    const adapter = createTestAdapter();
    const captured: { auth?: AuthContextValue } = {};

    function Capture() {
      captured.auth = useAuth();
      return null;
    }

    render(() => (
      <AuthProvider adapter={adapter} onSuccess={(action) => handler()(action)}>
        <Capture />
      </AuthProvider>
    ));

    const next = vi.fn();
    setHandler(() => next);
    await captured.auth?.signIn(credentials);

    expect(next).toHaveBeenCalledWith("signIn");
  });

  it("exposes optional actions only when the adapter implements them", () => {
    const bare = captureAuth(createTestAdapter());
    expect(bare.auth().signUp).toBeUndefined();
    expect(bare.auth().signInWithOAuth).toBeUndefined();
    expect(bare.auth().signInWithMagicLink).toBeUndefined();
    expect(bare.auth().signInWithPasskey).toBeUndefined();
    bare.unmount();

    const full = captureAuth(
      createTestAdapter({
        signUp: vi.fn(async () => ({ success: true })),
        signInWithOAuth: vi.fn(async () => ({ success: true })),
        features: {
          magicLink: { signIn: vi.fn(async () => ({ success: true })) },
          passkey: { signIn: vi.fn(async () => ({ success: true })) },
        },
      }),
    );
    expect(full.auth().signUp).toBeTypeOf("function");
    expect(full.auth().signInWithOAuth).toBeTypeOf("function");
    expect(full.auth().signInWithMagicLink).toBeTypeOf("function");
    expect(full.auth().signInWithPasskey).toBeTypeOf("function");
  });

  it("runs OAuth, magic link and passkey through the adapter", async () => {
    const adapter = createTestAdapter({
      signInWithOAuth: vi.fn(async () => ({ success: true })),
      features: {
        magicLink: { signIn: vi.fn(async () => ({ success: true })) },
        passkey: { signIn: vi.fn(async () => ({ success: true })) },
      },
    });
    const onSuccess = vi.fn();
    const { auth } = captureAuth(adapter, { onSuccess });

    await auth().signInWithOAuth?.("github");
    await auth().signInWithMagicLink?.("ada@example.com");
    await auth().signInWithPasskey?.();

    expect(adapter.signInWithOAuth).toHaveBeenCalledWith("github");
    expect(adapter.features?.magicLink?.signIn).toHaveBeenCalledWith("ada@example.com");
    expect(adapter.features?.passkey?.signIn).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("oauth");
    expect(onSuccess).toHaveBeenCalledWith("passkey");
    expect(onSuccess).not.toHaveBeenCalledWith("signIn");
  });

  it("signOut runs the adapter and reports the signOut action", async () => {
    const adapter = createTestAdapter({ signOut: vi.fn(async () => ({ success: true })) });
    const onSuccess = vi.fn();
    const { auth } = captureAuth(adapter, { onSuccess });

    await auth().signOut();

    expect(adapter.signOut).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("signOut");
  });

  it("signs in against a session backed adapter and updates the user accessor", async () => {
    const { source, push } = createPushSession(SIGNED_OUT);
    const adapter = createAdapter({
      id: "session-backed",
      session: source,
      signIn: vi.fn(async () => {
        push(SIGNED_IN);
        return { success: true };
      }),
    });
    const { auth } = captureAuth(adapter);

    await auth().signIn(credentials);
    await flush();

    expect(auth().user()?.id).toBe("user_1");
  });
});

describe("drawer controls", () => {
  it("openDrawer and closeDrawer flip isDrawerOpen", () => {
    const { auth } = captureAuth(createTestAdapter());

    expect(auth().isDrawerOpen()).toBe(false);
    auth().openDrawer();
    expect(auth().isDrawerOpen()).toBe(true);
    auth().closeDrawer();
    expect(auth().isDrawerOpen()).toBe(false);
  });
});
