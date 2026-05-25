import { type AuthErrorState, createAuthError, hasAuthErrors } from "./auth-errors";
import type { ResolvedAuthCopyConfig } from "./copy";
import type { FormMode } from "./types";

export type CredentialInput = {
  mode: FormMode;
  email: string;
  password: string;
  confirmPassword?: string;
};

export type PasswordMatchFeedback = {
  message: string;
  tone: "error" | "success";
} | null;

type ValidationCopy = Pick<ResolvedAuthCopyConfig, "validation" | "errors">;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function getPasswordMatchFeedback(
  input: Pick<CredentialInput, "mode" | "password" | "confirmPassword">,
  copy: Pick<ResolvedAuthCopyConfig, "validation">,
): PasswordMatchFeedback {
  if (input.mode !== "register" && input.mode !== "resetPassword") return null;
  if (!input.password || !input.confirmPassword) return null;

  if (input.password === input.confirmPassword) {
    return {
      tone: "success",
      message: copy.validation.passwordsMatch,
    };
  }

  return {
    tone: "error",
    message: copy.validation.passwordsMismatch,
  };
}

export function validateCredentials(
  input: CredentialInput,
  copy: ValidationCopy,
): AuthErrorState {
  const errors: AuthErrorState = { fields: {} };
  const email = input.email ? input.email.trim() : "";

  // Email validation is not required in resetPassword mode since we only collect password/confirm
  if (input.mode !== "resetPassword") {
    if (!email) {
      errors.fields.email = createAuthError("required", "email", {
        message: copy.validation.emailRequired,
      });
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.fields.email = createAuthError("invalid_email", "email", {
        message: copy.errors.invalid_email,
      });
    }
  }

  if (!input.password) {
    errors.fields.password = createAuthError("required", "password", {
      message: copy.validation.passwordRequired,
    });
  } else if (
    (input.mode === "register" || input.mode === "resetPassword") &&
    input.password.length < MIN_PASSWORD_LENGTH
  ) {
    errors.fields.password = createAuthError("weak_password", "password", {
      message: copy.errors.weak_password,
    });
  }

  if (input.mode === "register" || input.mode === "resetPassword") {
    if (!input.confirmPassword) {
      errors.fields.confirmPassword = createAuthError("required", "confirmPassword", {
        message: copy.validation.confirmRequired,
      });
    } else if (input.password !== input.confirmPassword) {
      errors.fields.confirmPassword = createAuthError("password_mismatch", "confirmPassword", {
        message: copy.errors.password_mismatch,
      });
    }
  }

  return hasAuthErrors(errors) ? errors : { fields: {} };
}
