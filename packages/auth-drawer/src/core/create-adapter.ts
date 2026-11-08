import { STATIC_SESSION } from "./session";
import type { AuthAdapter, SessionSource } from "./types";

type CustomAuthAdapter = Omit<AuthAdapter, "session"> & { session?: SessionSource };

/**
 * @name createAdapter
 * @description Wraps a partial adapter with sensible defaults for missing methods. A missing
 * `session` becomes a static signed-out source and a missing `signOut` reloads the page.
 *
 * @example
 * const adapter = createAdapter({ id: "custom", signIn: async () => ({ success: true }) });
 */
export function createAdapter(partial: CustomAuthAdapter): AuthAdapter {
  return {
    ...partial,
    session: partial.session ?? STATIC_SESSION,
    signOut:
      partial.signOut ??
      (async () => {
        if (typeof window !== "undefined") window.location.reload();
        return { success: true };
      }),
    signUp: partial.signUp,
    signInWithOAuth: partial.signInWithOAuth,
    features: partial.features,
    requestPasswordReset: partial.requestPasswordReset,
    resetPassword: partial.resetPassword,
    normalizeError: partial.normalizeError,
  };
}
