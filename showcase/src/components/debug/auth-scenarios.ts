import type { AuthAdapter, OAuthProvider } from "@/components/auth/auth-drawer";
import type {
  AuthErrorCode,
  AuthErrorTarget,
  AuthUiError,
} from "../../../../packages/auth-drawer/src/auth-errors";

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

function adapterError(
  code: AuthErrorCode,
  target: AuthErrorTarget,
  message: string,
): AuthUiError {
  return {
    code,
    target,
    message,
    retryable: code === "network_error" || code === "server_error" || code === "rate_limited",
  };
}

function credentialErrorForScenario(scenario: AuthScenarioId) {
  if (scenario === "invalid_credentials") {
    return adapterError("invalid_credentials", "form", "Invalid login credentials");
  }

  if (scenario === "email_taken") {
    return adapterError("email_taken", "email", "User already exists");
  }

  if (scenario === "email_not_verified") {
    return adapterError("email_not_verified", "form", "Email is not verified");
  }

  if (scenario === "user_not_found") {
    return adapterError("user_not_found", "email", "No user found for this email");
  }

  if (scenario === "network_error") {
    return adapterError("network_error", "form", "Network request failed");
  }

  if (scenario === "rate_limited") {
    return adapterError("rate_limited", "form", "Rate limit exceeded");
  }

  if (scenario === "server_error") {
    return adapterError("server_error", "form", "Auth service failed");
  }

  return null;
}

function oauthErrorForScenario(scenario: AuthScenarioId, provider: OAuthProvider) {
  if (scenario === "oauth_cancelled") {
    return adapterError(
      "oauth_cancelled",
      "oauth",
      `Popup closed by user while signing in with ${provider}`,
    );
  }

  if (scenario === "popup_blocked") {
    return adapterError("popup_blocked", "oauth", "Popup was blocked by the browser");
  }

  if (scenario === "provider_unavailable") {
    return adapterError("provider_unavailable", "oauth", `${provider} provider is unavailable`);
  }

  return credentialErrorForScenario(scenario);
}

export function createScenarioAdapter(scenario: AuthScenarioId): AuthAdapter {
  return {
    id: "scenario",
    providers: ["github", "google", "discord"],
    requiresName: false,
    async signIn() {
      await wait();
      const error = credentialErrorForScenario(scenario);
      if (error) return { success: false, error };
      return { success: true, data: null };
    },
    async signUp() {
      await wait();
      const error = credentialErrorForScenario(scenario);
      if (error) return { success: false, error };
      return { success: true, data: null };
    },
    async signInWithOAuth(provider) {
      await wait();
      const error = oauthErrorForScenario(scenario, provider as OAuthProvider);
      if (error) return { success: false, error };
      return { success: true, data: null };
    },
    async requestPasswordReset() {
      await wait();
      const error = credentialErrorForScenario(scenario);
      if (error && scenario !== "invalid_credentials") return { success: false, error };
      return { success: true, data: null };
    },
    useSession() {
      return { data: null, isPending: false, error: null };
    },
  };
}
