import type { AuthAdapter } from "./types";

type CustomAuthAdapter = Omit<AuthAdapter, "useSession"> & Partial<Pick<AuthAdapter, "useSession">>;

/**
 * Wraps a partial adapter with sensible defaults for missing methods.
 */
export function createAdapter(partial: CustomAuthAdapter): AuthAdapter {
  return {
    ...partial,
    useSession:
      partial.useSession ??
      (() => ({
        data: null,
        isPending: false,
        error: null,
      })),
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
