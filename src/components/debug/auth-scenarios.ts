import type {
  AuthConfig,
  OAuthProvider,
} from "@/components/auth/auth-drawer";

export type AuthScenarioId =
  | "success"
  | "invalid_credentials"
  | "email_taken"
  | "email_not_verified"
  | "user_not_found"
  | "network_error"
  | "rate_limited"
  | "server_error"
  | "oauth_cancelled"
  | "popup_blocked"
  | "provider_unavailable";

export type AuthScenario = {
  id: AuthScenarioId;
  label: string;
  description: string;
};

export const AUTH_SCENARIOS: AuthScenario[] = [
  {
    id: "success",
    label: "Success",
    description: "All auth operations resolve and close the drawer.",
  },
  {
    id: "invalid_credentials",
    label: "Invalid credentials",
    description: "Credential submit returns a Supabase-style invalid login.",
  },
  {
    id: "email_taken",
    label: "Email taken",
    description: "Register submit returns a Better Auth-style duplicate user.",
  },
  {
    id: "email_not_verified",
    label: "Unverified email",
    description: "Sign-in requires email verification before continuing.",
  },
  {
    id: "user_not_found",
    label: "User not found",
    description: "Credential submit points the error at the email field.",
  },
  {
    id: "network_error",
    label: "Network error",
    description: "Simulates a failed request or offline auth service.",
  },
  {
    id: "rate_limited",
    label: "Rate limited",
    description: "Shows temporary lockout copy for too many attempts.",
  },
  {
    id: "server_error",
    label: "Server error",
    description: "Shows retryable auth-service failure copy.",
  },
  {
    id: "oauth_cancelled",
    label: "OAuth cancelled",
    description: "OAuth popup closes before provider authorization.",
  },
  {
    id: "popup_blocked",
    label: "Popup blocked",
    description: "Browser prevents the OAuth popup from opening.",
  },
  {
    id: "provider_unavailable",
    label: "Provider unavailable",
    description: "Selected OAuth provider is not configured or reachable.",
  },
];

function wait() {
  return new Promise((resolve) => setTimeout(resolve, 650));
}

function credentialErrorForScenario(scenario: AuthScenarioId) {
  if (scenario === "invalid_credentials") {
    return {
      code: "invalid_credentials",
      message: "Invalid login credentials",
      status: 400,
    };
  }

  if (scenario === "email_taken") {
    return {
      error: {
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
      },
    };
  }

  if (scenario === "email_not_verified") {
    return {
      code: "EMAIL_NOT_VERIFIED",
      message: "Email is not verified",
      status: 403,
    };
  }

  if (scenario === "user_not_found") {
    return {
      code: "USER_NOT_FOUND",
      message: "No user found for this email",
      status: 404,
    };
  }

  if (scenario === "network_error") {
    return new TypeError("Network request failed");
  }

  if (scenario === "rate_limited") {
    return {
      code: "too_many_requests",
      message: "Rate limit exceeded",
      status: 429,
    };
  }

  if (scenario === "server_error") {
    return {
      code: "internal_server_error",
      message: "Auth service failed",
      status: 503,
    };
  }

  return null;
}

function oauthErrorForScenario(
  scenario: AuthScenarioId,
  provider: OAuthProvider,
) {
  if (scenario === "oauth_cancelled") {
    return `Popup closed by user while signing in with ${provider}`;
  }

  if (scenario === "popup_blocked") {
    return {
      code: "popup_blocked",
      message: "Popup was blocked by the browser",
    };
  }

  if (scenario === "provider_unavailable") {
    return {
      code: "provider_unavailable",
      message: `${provider} provider is unavailable`,
      status: 503,
    };
  }

  return credentialErrorForScenario(scenario);
}

export function createScenarioHandlers(
  scenario: AuthScenarioId,
): Pick<AuthConfig, "onCredential" | "onOAuth" | "onForgotPassword"> {
  return {
    async onCredential() {
      await wait();
      const error = credentialErrorForScenario(scenario);
      if (error) throw error;
    },
    async onOAuth(provider) {
      await wait();
      const error = oauthErrorForScenario(scenario, provider);
      if (error) throw error;
    },
    async onForgotPassword() {
      await wait();
      const error = credentialErrorForScenario(scenario);
      if (error && scenario !== "invalid_credentials") throw error;
    },
  };
}

