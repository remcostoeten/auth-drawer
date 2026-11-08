import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthClient, createPushSession, type AuthClient } from "../../../src/core";
import { CREDENTIALS, SIGNED_IN, SIGNED_OUT, fail, makeAdapter, ok } from "../helpers";

const live: AuthClient[] = [];

function setup(overrides = {}, options: { subscribe?: boolean } = {}) {
  const session = createPushSession(SIGNED_OUT);
  const adapter = makeAdapter({ session: session.source, ...overrides });
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const client = createAuthClient({ adapter, onSuccess, onError });
  if (options.subscribe !== false) client.subscribe(() => undefined);
  live.push(client);

  return { adapter, client, session, onSuccess, onError };
}

describe("createAuthClient", () => {
  afterEach(() => {
    live.splice(0).forEach((client) => client.destroy());
  });

  describe("state", () => {
    it("mirrors the adapter session", () => {
      const { client, session } = setup();
      expect(client.getState()).toEqual({
        user: null,
        session: null,
        isPending: false,
        error: null,
        isDrawerOpen: false,
      });

      session.push(SIGNED_IN);

      const state = client.getState();
      expect(state.user?.id).toBe("1");
      expect(state.session).toEqual({ id: "s1" });
    });

    it("notifies subscribers when the session changes", () => {
      const { client, session } = setup({}, { subscribe: false });
      const listener = vi.fn();
      client.subscribe(listener);

      session.push(SIGNED_IN);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("stays readable without subscribers", () => {
      const { client, session } = setup({}, { subscribe: false });

      session.push({ ...SIGNED_OUT, isPending: true });

      expect(client.getState().isPending).toBe(true);
    });

    it("keeps the same state object while nothing changes", () => {
      const { client } = setup();

      expect(client.getState()).toBe(client.getState());
    });

    it("tolerates adapters written without a session", () => {
      const adapter = makeAdapter();
      delete (adapter as { session?: unknown }).session;
      const client = createAuthClient({ adapter });

      expect(client.getState().user).toBeNull();
    });
  });

  describe("drawer", () => {
    it("opens and closes with a notification only on change", () => {
      const { client } = setup();
      const listener = vi.fn();
      client.subscribe(listener);

      client.openDrawer();
      client.openDrawer();
      expect(client.getState().isDrawerOpen).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);

      client.closeDrawer();
      expect(client.getState().isDrawerOpen).toBe(false);
    });
  });

  describe("runAction", () => {
    it("runs sign in and reports success to the adapter and the callback", async () => {
      const onSuccess = vi.fn();
      const { client, adapter, onSuccess: provided } = setup({ onSuccess });

      const result = await client.signIn(CREDENTIALS);

      expect(result.success).toBe(true);
      expect(adapter.signIn).toHaveBeenCalledWith(CREDENTIALS);
      expect(onSuccess).toHaveBeenCalledWith("signIn");
      expect(provided).toHaveBeenCalledWith("signIn");
    });

    it("returns the adapter error and reports it when the call fails", async () => {
      const onError = vi.fn();
      const failure = fail("invalid_credentials", "form");
      const { client, onError: provided } = setup({ signIn: vi.fn(async () => failure), onError });

      const result = await client.signIn(CREDENTIALS);

      expect(result).toBe(failure);
      expect(onError).toHaveBeenCalledWith(failure.error, "signIn");
      expect(provided).toHaveBeenCalledWith(failure.error, "signIn");
    });

    it("builds an error when a failed result carries none", async () => {
      const { client, onError } = setup({ signIn: vi.fn(async () => ({ success: false })) });

      const result = await client.signIn(CREDENTIALS);

      expect(result.success).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ target: "form" }), "signIn");
    });

    it("normalizes a thrown error with the adapter normalizer", async () => {
      const normalized = fail("rate_limited", "form").error;
      const normalizeError = vi.fn(() => normalized);
      const { client, onError } = setup({
        signIn: vi.fn(async () => {
          throw new Error("boom");
        }),
        normalizeError,
      });

      const result = await client.signIn(CREDENTIALS);

      expect(result).toEqual({ success: false, error: normalized });
      expect(onError).toHaveBeenCalledWith(normalized, "signIn");
    });

    it("falls back to the built-in normalizer with the oauth target for OAuth", async () => {
      const { client } = setup({
        signInWithOAuth: vi.fn(async () => {
          throw new Error("nope");
        }),
      });

      const result = await client.signInWithOAuth("github");

      expect(result.error?.target).toBe("oauth");
    });

    it("resolves with an unavailable error when the adapter lacks the method", async () => {
      const { client, onError, onSuccess } = setup({ signUp: undefined, signOut: undefined });

      const signUp = await client.signUp({ ...CREDENTIALS, name: "Ada" });
      const signOut = await client.signOut();

      expect(signUp.success).toBe(false);
      expect(signUp.error?.message).toBeTruthy();
      expect(signOut.success).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.anything(), "signUp");
      expect(onError).toHaveBeenCalledWith(expect.anything(), "signOut");
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("runs sign up, OAuth and sign out through the matching actions", async () => {
      const { client, adapter, onSuccess } = setup();

      await client.signUp({ ...CREDENTIALS, name: "Ada" });
      await client.signInWithOAuth("google");
      await client.signOut();

      expect(adapter.signUp).toHaveBeenCalled();
      expect(adapter.signInWithOAuth).toHaveBeenCalledWith("google");
      expect(adapter.signOut).toHaveBeenCalled();
      expect(onSuccess.mock.calls.map(([action]) => action)).toEqual([
        "signUp",
        "oauth",
        "signOut",
      ]);
    });

    it("runs passkey sign in through runAction", async () => {
      const signIn = vi.fn(async () => ok());
      const { client, onSuccess } = setup({ features: { passkey: { signIn } } });

      await client.signInWithPasskey();

      expect(signIn).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith("passkey");
    });

    it("reports passkey as unavailable without the feature", async () => {
      const { client, onError } = setup();

      const result = await client.signInWithPasskey();

      expect(result.success).toBe(false);
      expect(onError).toHaveBeenCalledWith(expect.anything(), "passkey");
    });
  });

  describe("magic link", () => {
    it("returns the adapter result without announcing a sign in", async () => {
      const signIn = vi.fn(async () => ok());
      const { client, onSuccess } = setup({ features: { magicLink: { signIn } } });

      const result = await client.signInWithMagicLink("ada@example.com");

      expect(result.success).toBe(true);
      expect(signIn).toHaveBeenCalledWith("ada@example.com");
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("returns an unavailable error without the feature", async () => {
      const { client, onError } = setup();

      const result = await client.signInWithMagicLink("ada@example.com");

      expect(result.success).toBe(false);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("updateInputs", () => {
    it("switches to a new adapter and its session", () => {
      const { client } = setup();
      const next = createPushSession(SIGNED_IN);

      client.updateInputs({ adapter: makeAdapter({ session: next.source }) });

      expect(client.getState().user?.id).toBe("1");
    });

    it("uses updated callbacks for later actions", async () => {
      const { client, onSuccess } = setup();
      const replacement = vi.fn();

      client.updateInputs({ onSuccess: replacement });
      await client.signIn(CREDENTIALS);

      expect(replacement).toHaveBeenCalledWith("signIn");
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
