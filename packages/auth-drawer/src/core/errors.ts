import { createAuthError } from "./auth-errors";
import type { AuthErrorCode, AuthErrorTarget, AuthUiError } from "./auth-errors";

/**
 * @name createAdapterError
 * @description Builds an `AuthUiError` for adapter failures. Falls back to the per-code default message
 * when the raw error carries none, so adapter-returned errors stay distinguishable in the UI.
 *
 * @example
 * createAdapterError("invalid_credentials", "form", response);
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
