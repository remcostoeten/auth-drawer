import type { AuthAdapter, AuthResult, AuthSessionState, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

type NextAuthSignIn = (
  provider: string,
  options?: Record<string, unknown>,
) => Promise<{ error?: string | null; ok?: boolean; url?: string | null } | undefined>;

type NextAuthClient = {
  signIn: NextAuthSignIn;
  signOut?: (options?: Record<string, unknown>) => Promise<unknown>;
  useSession?: () => { data?: any; status?: "loading" | "authenticated" | "unauthenticated" };
};

export interface NextAuthAdapterOptions {
  client: NextAuthClient;
  callbackURL?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
}

function mapNextAuthError(error: unknown) {
  const message = typeof error === "string" ? error : (error as { message?: string })?.message;
  if (message === "CredentialsSignin" || message?.toLowerCase().includes("credential")) {
    return createAdapterError("invalid_credentials", "form", { message });
  }
  if (message?.toLowerCase().includes("network")) {
    return createAdapterError("network_error", "form", { message });
  }
  return createAdapterError("unknown", "form", { message });
}

function mapSession(session: any): AuthSessionState | null {
  if (!session?.user) return null;
  return {
    user: {
      id: session.user.id ?? session.user.email ?? "next-auth-user",
      email: session.user.email ?? "",
      name: session.user.name,
      image: session.user.image,
    },
    session,
  };
}

export function createNextAuthAdapter(options: NextAuthAdapterOptions): AuthAdapter {
  const { client, callbackURL = "/", providers = ["github", "google"] } = options;

  return {
    id: "next-auth",
    providers,
    requiresName: options.requireName,
    async signIn(input) {
      const response = await client.signIn("credentials", {
        redirect: false,
        email: input.email,
        password: input.password,
        callbackUrl: callbackURL,
      });
      if (!response) return { success: false, error: mapNextAuthError("No response received.") };
      if (response.error) return { success: false, error: mapNextAuthError(response.error) };
      return { success: true, data: response };
    },
    async signOut() {
      await client.signOut?.({ redirect: false });
      return { success: true };
    },
    async signInWithOAuth(provider) {
      const response = await client.signIn(provider, { callbackUrl: callbackURL });
      if (response?.error) return { success: false, error: mapNextAuthError(response.error) };
      return new Promise<AuthResult>(() => undefined);
    },
    useSession: client.useSession
      ? () => {
          const session = client.useSession?.();
          return {
            data: mapSession(session?.data),
            isPending: session?.status === "loading",
            error: null,
          };
        }
      : undefined,
    normalizeError: mapNextAuthError,
  };
}
