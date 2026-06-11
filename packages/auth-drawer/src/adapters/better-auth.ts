import type { AuthAdapter, AuthResult, CredentialAuthInput, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

type BetterAuthClient = {
  options?: { socialProviders?: OAuthProvider[] };
  signIn?: {
    email?: (input: {
      email: string;
      password: string;
      rememberMe?: boolean;
      callbackURL?: string;
    }) => Promise<{ data?: unknown; error?: unknown }>;
    social?: (input: {
      provider: string;
      callbackURL?: string;
      newUserCallbackURL?: string;
    }) => Promise<{ data?: unknown; error?: unknown }>;
    magicLink?: (input: {
      email: string;
      callbackURL?: string;
      newUserCallbackURL?: string;
    }) => Promise<{ data?: unknown; error?: unknown }>;
    emailOtp?: (input: {
      email: string;
      otp: string;
      callbackURL?: string;
    }) => Promise<{ data?: unknown; error?: unknown }>;
    anonymous?: () => Promise<{ data?: unknown; error?: unknown }>;
  };
  signUp?: {
    email?: (input: {
      email: string;
      password: string;
      name: string;
      callbackURL?: string;
    }) => Promise<{ data?: unknown; error?: unknown }>;
  };
  signOut?: () => Promise<{ data?: unknown; error?: unknown }>;
  requestPasswordReset?: (input: {
    email: string;
    redirectTo?: string;
  }) => Promise<{ data?: unknown; error?: unknown }>;
  emailOtp?: {
    sendVerificationOtp?: (input: {
      email: string;
      type: "sign-in";
    }) => Promise<{ data?: unknown; error?: unknown }>;
  };
  useSession?: () => { data?: any; isPending?: boolean; error?: unknown };
};

export interface BetterAuthAdapterOptions<TClient extends BetterAuthClient = BetterAuthClient> {
  client: TClient;
  callbackURL?: string;
  newUserCallbackURL?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
  passwordResetRedirectTo?: string;
}

function readCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const record = error as { code?: unknown; status?: unknown; message?: unknown };
  return String(record.code ?? record.message ?? "").toUpperCase();
}

function mapBetterAuthError(error: unknown) {
  const code = readCode(error);
  const status = typeof (error as { status?: unknown })?.status === "number"
    ? (error as { status: number }).status
    : undefined;

  if (code.includes("INVALID_EMAIL_OR_PASSWORD")) {
    return createAdapterError("invalid_credentials", "form", error);
  }
  if (code.includes("USER_ALREADY_EXISTS") || code.includes("SOCIAL_ACCOUNT_ALREADY_LINKED")) {
    return createAdapterError("email_taken", "email", error);
  }
  if (code.includes("INVALID_EMAIL")) return createAdapterError("invalid_email", "email", error);
  if (code.includes("INVALID_PASSWORD")) return createAdapterError("weak_password", "password", error);
  if (code.includes("EMAIL_NOT_VERIFIED")) {
    return createAdapterError("email_not_verified", "form", error);
  }
  if (code.includes("USER_NOT_FOUND")) return createAdapterError("user_not_found", "email", error);
  if (code.includes("TOO_MANY_REQUESTS") || status === 429) {
    return createAdapterError("rate_limited", "form", error);
  }
  if (status && status >= 500) return createAdapterError("server_error", "form", error);
  if (code.includes("NETWORK") || code.includes("FETCH")) {
    return createAdapterError("network_error", "form", error);
  }

  return createAdapterError("unknown", "form", error);
}

function result(data: unknown, error: unknown): AuthResult {
  if (error) return { success: false, error: mapBetterAuthError(error) };
  return { success: true, data };
}

/** Default OAuth providers when none are configured explicitly. */
const DEFAULT_OAUTH_PROVIDERS: OAuthProvider[] = ["github", "google"];

export function createBetterAuthAdapter(options: BetterAuthAdapterOptions): AuthAdapter {
  const { client, callbackURL = "/", newUserCallbackURL, passwordResetRedirectTo } = options;
  // A real Better Auth client is a Proxy: every property access (including
  // `client.options.socialProviders`) returns a truthy proxy that lazily builds
  // an RPC path, so it can NOT be used with `??` to detect "unset" — it would
  // poison `providers` with a non-array value that crashes ("Cannot convert
  // object to primitive value") the first time the UI evaluates
  // `providers.length`. Only trust it when it's an actual array.
  const clientProviders = client.options?.socialProviders;
  const providers =
    options.providers ??
    (Array.isArray(clientProviders) ? clientProviders : DEFAULT_OAUTH_PROVIDERS);

  const adapter: AuthAdapter = {
    id: "better-auth",
    providers,
    requiresName: options.requireName ?? true,
    async signIn(input: CredentialAuthInput) {
      const response = await client.signIn?.email?.({
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe,
        callbackURL,
      });
      return result(response?.data, response?.error);
    },
    async signUp(input) {
      const response = await client.signUp?.email?.({
        email: input.email,
        password: input.password,
        name: input.name,
        callbackURL: newUserCallbackURL ?? callbackURL,
      });
      return result(response?.data, response?.error);
    },
    async signOut() {
      const response = await client.signOut?.();
      return result(response?.data, response?.error);
    },
    async requestPasswordReset(email) {
      const redirectTo =
        passwordResetRedirectTo ??
        (typeof window !== "undefined" ? `${window.location.origin}/reset-password` : "/reset-password");
      const response = await client.requestPasswordReset?.({ email, redirectTo });
      return result(response?.data, response?.error);
    },
    async signInWithOAuth(provider) {
      const response = await client.signIn?.social?.({
        provider,
        callbackURL,
        newUserCallbackURL: newUserCallbackURL ?? callbackURL,
      });
      return result(response?.data, response?.error);
    },
    useSession: () => {
      const session = client.useSession?.();
      return {
        data: session?.data
          ? { user: session.data.user ?? null, session: session.data.session ?? session.data }
          : null,
        isPending: Boolean(session?.isPending),
        error: session?.error ?? null,
      };
    },
    normalizeError: mapBetterAuthError,
  };

  const features: NonNullable<AuthAdapter["features"]> = {};

  if (typeof client.signIn?.magicLink === "function") {
    features.magicLink = {
      signIn: async (email) => {
        const response = await client.signIn?.magicLink?.({
          email,
          callbackURL,
          newUserCallbackURL,
        });
        return result(response?.data, response?.error);
      },
    };
  }

  if (typeof client.emailOtp?.sendVerificationOtp === "function" && typeof client.signIn?.emailOtp === "function") {
    features.emailOtp = {
      sendVerificationOtp: async (email) => {
        const response = await client.emailOtp?.sendVerificationOtp?.({ email, type: "sign-in" });
        return result(response?.data, response?.error);
      },
      signIn: async (email, otp) => {
        const response = await client.signIn?.emailOtp?.({ email, otp, callbackURL });
        return result(response?.data, response?.error);
      },
    };
  }

  if (typeof client.signIn?.anonymous === "function") {
    features.anonymous = {
      signIn: async () => {
        const response = await client.signIn?.anonymous?.();
        return result(response?.data, response?.error);
      },
    };
  }

  if (Object.keys(features).length > 0) adapter.features = features;

  return adapter;
}
