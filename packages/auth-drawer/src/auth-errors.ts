import type { OAuthProvider } from "./types";

export type AuthErrorTarget = "email" | "password" | "confirmPassword" | "form" | "oauth";

export type AuthErrorCode =
  | "required"
  | "invalid_email"
  | "weak_password"
  | "password_mismatch"
  | "invalid_credentials"
  | "email_not_verified"
  | "email_taken"
  | "user_not_found"
  | "provider_unavailable"
  | "oauth_cancelled"
  | "popup_blocked"
  | "rate_limited"
  | "network_error"
  | "server_error"
  | "unknown";

export type AuthUiError = {
  code: AuthErrorCode;
  message: string;
  target: AuthErrorTarget;
  provider?: OAuthProvider;
  retryable?: boolean;
  cause?: unknown;
};

export type AuthFieldErrors = Partial<
  Record<"email" | "password" | "confirmPassword", AuthUiError>
>;

export type AuthErrorState = {
  fields: AuthFieldErrors;
  form?: AuthUiError;
  oauth?: AuthUiError;
};

type ErrorLike = {
  code?: unknown;
  status?: unknown;
  message?: unknown;
  error?: unknown;
};

export const EMPTY_AUTH_ERRORS: AuthErrorState = {
  fields: {},
};

const AUTH_ERROR_COPY: Record<AuthErrorCode, string> = {
  required: "This field is required.",
  invalid_email: "Enter a valid email address.",
  weak_password: "Use at least 8 characters.",
  password_mismatch: "Passwords do not match.",
  invalid_credentials: "Email or password is incorrect.",
  email_not_verified: "Verify your email before signing in.",
  email_taken: "An account with this email already exists.",
  user_not_found: "No account exists for this email.",
  provider_unavailable: "This sign-in provider is unavailable.",
  oauth_cancelled: "Sign-in was cancelled.",
  popup_blocked: "Allow popups and try again.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
  network_error: "Could not connect. Check your connection and try again.",
  server_error: "The auth service is unavailable. Try again shortly.",
  unknown: "Something went wrong. Try again.",
};

export function createAuthError(
  code: AuthErrorCode,
  target: AuthErrorTarget,
  options: Partial<Omit<AuthUiError, "code" | "target">> = {},
): AuthUiError {
  return {
    code,
    target,
    message: options.message ?? AUTH_ERROR_COPY[code],
    provider: options.provider,
    retryable: options.retryable,
    cause: options.cause,
  };
}

export function hasAuthErrors(errors: AuthErrorState) {
  return Boolean(
    errors.form ||
    errors.oauth ||
    errors.fields.email ||
    errors.fields.password ||
    errors.fields.confirmPassword,
  );
}

export function mergeAuthErrors(...items: Array<AuthErrorState | undefined>): AuthErrorState {
  return items.reduce<AuthErrorState>(
    (result, item) => {
      if (!item) return result;

      return {
        fields: {
          ...result.fields,
          ...item.fields,
        },
        form: item.form ?? result.form,
        oauth: item.oauth ?? result.oauth,
      };
    },
    { fields: {} },
  );
}

function asRecord(value: unknown): ErrorLike | null {
  return value && typeof value === "object" ? (value as ErrorLike) : null;
}

function readNestedError(value: unknown): ErrorLike | null {
  const record = asRecord(value);
  if (!record) return null;

  return asRecord(record.error) ?? record;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readCode(value: ErrorLike | null) {
  return readString(value?.code)?.toLowerCase().split("-").join("_");
}

function readStatus(value: ErrorLike | null) {
  return typeof value?.status === "number" ? value.status : undefined;
}

function readMessage(error: unknown, value: ErrorLike | null) {
  if (typeof error === "string") return error;
  return readString(value?.message);
}

function inferCode(rawCode: string | undefined, message: string, status?: number) {
  const haystack = `${rawCode ?? ""} ${message}`.toLowerCase();

  if (status === 429 || haystack.includes("rate limit")) return "rate_limited";
  if (status && status >= 500) return "server_error";
  if (haystack.includes("network") || haystack.includes("fetch")) {
    return "network_error";
  }
  if (haystack.includes("cancel") || haystack.includes("closed")) {
    return "oauth_cancelled";
  }
  if (haystack.includes("popup")) return "popup_blocked";
  if (haystack.includes("email") && haystack.includes("verified")) {
    return "email_not_verified";
  }
  if (haystack.includes("already") || haystack.includes("exists") || haystack.includes("taken")) {
    return "email_taken";
  }
  if (haystack.includes("not found") || haystack.includes("no user")) {
    return "user_not_found";
  }
  if (
    haystack.includes("invalid_credentials") ||
    haystack.includes("invalid login") ||
    haystack.includes("invalid credential") ||
    haystack.includes("incorrect")
  ) {
    return "invalid_credentials";
  }
  if (haystack.includes("provider")) return "provider_unavailable";

  return "unknown";
}

function targetForCode(code: AuthErrorCode, provider?: OAuthProvider) {
  if (provider) return "oauth";

  if (code === "invalid_email" || code === "email_taken" || code === "user_not_found") {
    return "email";
  }

  if (code === "weak_password") return "password";

  return "form";
}

export function normalizeAuthError(
  error: unknown,
  context: { provider?: OAuthProvider; fallbackTarget?: AuthErrorTarget } = {},
): AuthUiError {
  if (asRecord(error) && "code" in (error as Record<string, unknown>)) {
    const known = error as AuthUiError;
    if (known.message && known.target) return known;
  }

  const value = readNestedError(error);
  const rawCode = readCode(value);
  const status = readStatus(value);
  const message = readMessage(error, value) ?? "";
  const code = inferCode(rawCode, message, status);
  const target = context.fallbackTarget ?? targetForCode(code, context.provider);

  return createAuthError(code, target, {
    provider: context.provider,
    message: code === "unknown" && message ? message : undefined,
    retryable: code === "network_error" || code === "server_error" || code === "rate_limited",
    cause: error,
  });
}
