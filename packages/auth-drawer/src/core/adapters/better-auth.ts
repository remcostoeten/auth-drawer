import type {
  AuthAdapter,
  AuthResult,
  CredentialAuthInput,
  OAuthProvider,
  AuthSessionState,
} from "../types";
import { createAdapterError } from "../errors";
import { STATIC_SESSION, createSessionStore } from "../session";

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
    passkey?: (input?: { autoFill?: boolean }) => Promise<{ data?: unknown; error?: unknown }>;
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
  getSession?: () => Promise<{ data?: any; error?: unknown }>;
  useSession?: () => { data?: any; isPending?: boolean; error?: unknown };
};

/**
 * Optional Better Auth plugins the adapter should expose to the drawer. A real Better Auth client
 * is a Proxy that returns a function for every property, so plugin support cannot be detected
 * from the client and has to be declared here.
 */
export type BetterAuthFeature = "magicLink" | "emailOtp" | "anonymous" | "passkey";

export interface BetterAuthAdapterOptions<TClient extends BetterAuthClient = BetterAuthClient> {
  client: TClient;
  callbackURL?: string;
  newUserCallbackURL?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
  passwordResetRedirectTo?: string;
  /** Plugins installed on the client. Defaults to none. */
  features?: BetterAuthFeature[];
}

function readCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const record = error as { code?: unknown; status?: unknown; message?: unknown };
  return String(record.code ?? record.message ?? "").toUpperCase();
}

function mapBetterAuthError(error: unknown) {
  const code = readCode(error);
  const status =
    typeof (error as { status?: unknown })?.status === "number"
      ? (error as { status: number }).status
      : undefined;

  if (code.includes("INVALID_EMAIL_OR_PASSWORD")) {
    return createAdapterError("invalid_credentials", "form", error);
  }
  if (code.includes("USER_ALREADY_EXISTS") || code.includes("SOCIAL_ACCOUNT_ALREADY_LINKED")) {
    return createAdapterError("email_taken", "email", error);
  }
  if (code.includes("INVALID_EMAIL")) return createAdapterError("invalid_email", "email", error);
  if (code.includes("INVALID_PASSWORD"))
    return createAdapterError("weak_password", "password", error);
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

/** Better Auth names the X provider `twitter`. */
function betterAuthProviderId(provider: string) {
  return provider === "x" ? "twitter" : provider;
}

/** Default OAuth providers when none are configured explicitly. */
const DEFAULT_OAUTH_PROVIDERS: OAuthProvider[] = ["github", "google"];

type SessionPayload = { user?: unknown; session?: unknown } | null | undefined;

/**
 * @name mapBetterAuthSession
 * @description Maps a Better Auth session payload to the neutral session state. Shared with the React
 * wrapper so the client hook and the session store produce the same shape.
 *
 * @example
 * mapBetterAuthSession({ user, session })?.user;
 */
export function mapBetterAuthSession(payload: SessionPayload) {
  if (!payload) return null;
  return {
    user: (payload.user ?? null) as AuthSessionState["user"],
    session: payload.session ?? payload,
  };
}

function noop() {
  return undefined;
}

function createBetterAuthSession(client: BetterAuthClient) {
  if (typeof client.getSession !== "function") return { source: STATIC_SESSION, refresh: noop };

  return createSessionStore(async () => {
    try {
      const response = await client.getSession?.();
      return { data: mapBetterAuthSession(response?.data), error: response?.error ?? null };
    } catch (error) {
      return { data: null, error };
    }
  });
}

/**
 * @name createBetterAuthAdapter
 * @description Builds an adapter for a Better Auth client. The neutral `session` source is backed
 * by `client.getSession()` and refreshes after sign in, sign up, sign out and passkey sign in.
 *
 * @example
 * const adapter = createBetterAuthAdapter({ client: authClient, features: ["magicLink"] });
 */
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

  const { source, refresh } = createBetterAuthSession(client);

  function refreshAfter(response: { data?: unknown; error?: unknown } | undefined) {
    if (!response?.error) refresh();
    return result(response?.data, response?.error);
  }

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
      return refreshAfter(response);
    },
    async signUp(input) {
      const response = await client.signUp?.email?.({
        email: input.email,
        password: input.password,
        name: input.name,
        callbackURL: newUserCallbackURL ?? callbackURL,
      });
      return refreshAfter(response);
    },
    async signOut() {
      const response = await client.signOut?.();
      return refreshAfter(response);
    },
    async requestPasswordReset(email) {
      const redirectTo =
        passwordResetRedirectTo ??
        (typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "/reset-password");
      const response = await client.requestPasswordReset?.({ email, redirectTo });
      return result(response?.data, response?.error);
    },
    async signInWithOAuth(provider) {
      const response = await client.signIn?.social?.({
        provider: betterAuthProviderId(provider),
        callbackURL,
        newUserCallbackURL: newUserCallbackURL ?? callbackURL,
      });
      return result(response?.data, response?.error);
    },
    session: source,
    normalizeError: mapBetterAuthError,
  };

  const features: NonNullable<AuthAdapter["features"]> = {};
  const wanted = new Set<BetterAuthFeature>(options.features ?? []);

  if (wanted.has("magicLink")) {
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

  if (wanted.has("emailOtp")) {
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

  if (wanted.has("anonymous")) {
    features.anonymous = {
      signIn: async () => {
        const response = await client.signIn?.anonymous?.();
        return result(response?.data, response?.error);
      },
    };
  }

  if (wanted.has("passkey")) {
    features.passkey = {
      signIn: async () => {
        const response = await client.signIn?.passkey?.();
        return refreshAfter(response);
      },
    };
  }

  if (Object.keys(features).length > 0) adapter.features = features;

  return adapter;
}
