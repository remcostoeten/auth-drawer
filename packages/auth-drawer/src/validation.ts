import { type AuthErrorState, createAuthError, hasAuthErrors } from "./auth-errors";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function getPasswordMatchFeedback(input: Pick<CredentialInput, "mode" | "password" | "confirmPassword">): PasswordMatchFeedback {
  if (input.mode !== "register") return null;
  if (!input.password || !input.confirmPassword) return null;

  if (input.password === input.confirmPassword) {
    return {
      tone: "success",
      message: "Passwords match.",
    };
  }

  return {
    tone: "error",
    message: "Passwords do not match.",
  };
}

export function validateCredentials(input: CredentialInput): AuthErrorState {
  const errors: AuthErrorState = { fields: {} };
  const email = input.email.trim();

  if (!email) {
    errors.fields.email = createAuthError("required", "email", {
      message: "Enter your email address.",
    });
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.fields.email = createAuthError("invalid_email", "email");
  }

  if (!input.password) {
    errors.fields.password = createAuthError("required", "password", {
      message: "Enter your password.",
    });
  } else if (input.mode === "register" && input.password.length < MIN_PASSWORD_LENGTH) {
    errors.fields.password = createAuthError("weak_password", "password");
  }

  if (input.mode === "register") {
    if (!input.confirmPassword) {
      errors.fields.confirmPassword = createAuthError("required", "confirmPassword", {
        message: "Confirm your password.",
      });
    } else if (input.password !== input.confirmPassword) {
      errors.fields.confirmPassword = createAuthError("password_mismatch", "confirmPassword");
    }
  }

  return hasAuthErrors(errors) ? errors : { fields: {} };
}
