import type { AuthAdapter } from "./types";

/**
 * Wraps a partial adapter with sensible defaults for missing methods.
 */
export function createAdapter(partial: AuthAdapter): AuthAdapter {
  return {
    ...partial,
    signOut:
      partial.signOut ??
      (async () => {
        if (typeof window !== "undefined") window.location.reload();
        return { success: true };
      }),
    signUp: partial.signUp,
    signInWithOAuth: partial.signInWithOAuth,
    requestPasswordReset: partial.requestPasswordReset,
    resetPassword: partial.resetPassword,
    normalizeError: partial.normalizeError,
  };
}
