import { normalizeAuthError, type AuthUiError } from "../auth-errors";
import { sessionOf } from "../session";
import { createSubscribers, type Controller } from "../store";
import type {
  AuthAction,
  AuthAdapter,
  AuthResult,
  AuthSessionState,
  CredentialAuthInput,
} from "../types";

export type AuthClientOptions = {
  adapter: AuthAdapter;
  onSuccess?: (action: AuthAction) => void;
  onError?: (error: AuthUiError, action: AuthAction) => void;
};

export type AuthClientState = {
  user: AuthSessionState["user"];
  session: AuthSessionState["session"];
  isPending: boolean;
  error: unknown;
  isDrawerOpen: boolean;
};

export type AuthClient = Controller<AuthClientState> & {
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp: (input: CredentialAuthInput & { name: string }) => Promise<AuthResult>;
  signInWithOAuth: (provider: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signInWithPasskey: () => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  openDrawer: () => void;
  closeDrawer: () => void;
  updateInputs: (inputs: Partial<AuthClientOptions>) => void;
};

function unavailableError(action: AuthAction) {
  return new Error(`${action} is unavailable for this auth adapter.`);
}

function normalizeProviderError(
  adapter: AuthAdapter,
  error: unknown,
  action: AuthAction,
): AuthUiError {
  return (
    adapter.normalizeError?.(error) ??
    normalizeAuthError(error, {
      fallbackTarget: action === "oauth" ? "oauth" : "form",
    })
  );
}

/**
 * @name createAuthClient
 * @description Framework-free session and action client behind `AuthProvider`. State mirrors
 * `adapter.session` plus the drawer-open flag. Each action method runs the adapter call, reports
 * to `adapter.onSuccess`/`onError` and the option callbacks, and resolves with an `AuthResult`
 * instead of throwing. Actions the adapter does not implement resolve with an "unavailable" error.
 * `signInWithMagicLink` skips the success callbacks because a sent link is not a session yet.
 * The session subscription is active only while the client has a subscriber.
 *
 * @example
 * const client = createAuthClient({ adapter });
 * client.subscribe(() => render(client.getState()));
 * await client.signIn({ email, password, rememberMe: false });
 */
export function createAuthClient(options: AuthClientOptions): AuthClient {
  let inputs = options;
  let isDrawerOpen = false;
  let stopSession: (() => void) | null = null;
  let state = buildState();

  const subscribers = createSubscribers({
    onActive() {
      stopSession = sessionOf(inputs.adapter).subscribe(handleSessionChange);
      refresh();

      return () => {
        stopSession?.();
        stopSession = null;
      };
    },
  });

  function buildState(): AuthClientState {
    const { data, isPending, error } = sessionOf(inputs.adapter).getSnapshot();

    return {
      user: data?.user ?? null,
      session: data?.session ?? null,
      isPending,
      error,
      isDrawerOpen,
    };
  }

  function refresh() {
    const next = buildState();
    const unchanged =
      next.user === state.user &&
      next.session === state.session &&
      next.isPending === state.isPending &&
      next.error === state.error &&
      next.isDrawerOpen === state.isDrawerOpen;
    if (!unchanged) state = next;
  }

  function publish() {
    refresh();
    subscribers.emit();
  }

  function handleSessionChange() {
    publish();
  }

  function getState() {
    refresh();
    return state;
  }

  function handleSuccess(action: AuthAction) {
    inputs.adapter.onSuccess?.(action);
    inputs.onSuccess?.(action);
  }

  function handleError(error: AuthUiError, action: AuthAction) {
    inputs.adapter.onError?.(error, action);
    inputs.onError?.(error, action);
  }

  async function runAction(
    action: AuthAction,
    runner: (() => Promise<AuthResult>) | undefined,
  ): Promise<AuthResult> {
    const { adapter } = inputs;

    if (!runner) {
      const authError = normalizeProviderError(adapter, unavailableError(action), action);
      handleError(authError, action);
      return { success: false, error: authError };
    }

    try {
      const result = await runner();

      if (result.success) {
        handleSuccess(action);
        return result;
      }

      const authError =
        result.error ?? normalizeProviderError(adapter, unavailableError(action), action);
      handleError(authError, action);
      return result;
    } catch (error) {
      const authError = normalizeProviderError(adapter, error, action);
      handleError(authError, action);
      return { success: false, error: authError };
    }
  }

  function signIn(input: CredentialAuthInput) {
    const { adapter } = inputs;
    return runAction("signIn", adapter.signIn ? () => adapter.signIn!(input) : undefined);
  }

  function signUp(input: CredentialAuthInput & { name: string }) {
    const { adapter } = inputs;
    return runAction("signUp", adapter.signUp ? () => adapter.signUp!(input) : undefined);
  }

  function signInWithOAuth(provider: string) {
    const { adapter } = inputs;
    return runAction(
      "oauth",
      adapter.signInWithOAuth ? () => adapter.signInWithOAuth!(provider) : undefined,
    );
  }

  async function signInWithMagicLink(email: string): Promise<AuthResult> {
    const { adapter } = inputs;
    const magicLink = adapter.features?.magicLink;

    if (!magicLink) {
      const error = normalizeProviderError(adapter, unavailableError("signIn"), "signIn");
      return { success: false, error };
    }

    return magicLink.signIn(email);
  }

  function signInWithPasskey() {
    const { adapter } = inputs;
    const passkey = adapter.features?.passkey;
    return runAction("passkey", passkey ? () => passkey.signIn() : undefined);
  }

  function signOut() {
    const { adapter } = inputs;
    return runAction("signOut", adapter.signOut ? () => adapter.signOut!() : undefined);
  }

  function setDrawerOpen(next: boolean) {
    if (isDrawerOpen === next) return;
    isDrawerOpen = next;
    publish();
  }

  function updateInputs(next: Partial<AuthClientOptions>) {
    if (subscribers.isDestroyed()) return;

    const previousAdapter = inputs.adapter;
    inputs = { ...inputs, ...next };

    if (inputs.adapter === previousAdapter) return;

    if (stopSession) {
      stopSession();
      stopSession = sessionOf(inputs.adapter).subscribe(handleSessionChange);
    }
    publish();
  }

  return {
    getState,
    subscribe: subscribers.subscribe,
    destroy: subscribers.destroy,
    signIn,
    signUp,
    signInWithOAuth,
    signInWithMagicLink,
    signInWithPasskey,
    signOut,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    updateInputs,
  };
}
