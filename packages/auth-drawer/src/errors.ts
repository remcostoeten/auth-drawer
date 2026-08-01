import { createAuthError } from "./auth-errors";
import type { AuthErrorCode, AuthErrorTarget, AuthUiError } from "./auth-errors";

/**
 * Helper to construct unified AuthUiError payloads. Falls back to the
 * per-code default copy when the raw error carries no message, so
 * adapter-returned errors stay distinguishable in the UI.
 */
export function createAdapterError(
  code: AuthErrorCode,
  target: AuthErrorTarget,
  rawError?: any,
): AuthUiError {
  return createAuthError(code, target, {
    message: rawError?.message,
    cause: rawError,
    retryable: code === "network_error" || code === "server_error" || code === "rate_limited",
  });
}
