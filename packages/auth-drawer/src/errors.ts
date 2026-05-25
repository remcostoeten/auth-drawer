import type { AuthErrorCode, AuthErrorTarget, AuthUiError } from "./auth-errors";

/**
 * Helper to construct unified AuthUiError payloads.
 */
export function createAdapterError(
  code: AuthErrorCode,
  target: AuthErrorTarget,
  rawError?: any,
): AuthUiError {
  return {
    code,
    target,
    message: rawError?.message ?? "Authentication request failed.",
    cause: rawError,
    retryable: code === "network_error" || code === "server_error" || code === "rate_limited",
  };
}
