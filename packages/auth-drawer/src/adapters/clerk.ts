import type { AuthAdapter, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

type ClerkClient = {
  signIn?: {
    create?: (input: { identifier: string; password: string }) => Promise<any>;
    authenticateWithRedirect?: (input: {
      strategy: string;
      redirectUrl: string;
      redirectUrlComplete: string;
    }) => Promise<unknown>;
  };
  signUp?: {
    create?: (input: {
      emailAddress: string;
      password: string;
      firstName?: string;
    }) => Promise<any>;
  };
  signOut?: () => Promise<unknown>;
  useUser?: () => { user?: any; isLoaded?: boolean };
};

export interface ClerkAdapterOptions<TClient = unknown> {
  client: TClient;
  callbackURL?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
}

function mapClerkError(error: unknown) {
  const clerkError = (error as { errors?: Array<{ code?: string; message?: string }> })?.errors?.[0];
  const code = String(clerkError?.code ?? (error as { code?: string })?.code ?? "").toLowerCase();
  if (code.includes("password") && code.includes("incorrect")) {
    return createAdapterError("invalid_credentials", "form", error);
  }
  if (code.includes("identifier") && code.includes("not_found")) {
    return createAdapterError("user_not_found", "email", error);
  }
  if (code.includes("already") || code.includes("exists")) {
    return createAdapterError("email_taken", "email", error);
  }
  if (code.includes("password")) return createAdapterError("weak_password", "password", error);
  if (code.includes("email")) return createAdapterError("invalid_email", "email", error);
  if (code.includes("rate")) return createAdapterError("rate_limited", "form", error);
  return createAdapterError("unknown", "form", clerkError ?? error);
}

export function createClerkAdapter(options: ClerkAdapterOptions): AuthAdapter {
  const { client, callbackURL = "/", providers = ["github", "google"] } = options;
  const clerk = client as ClerkClient;

  return {
    id: "clerk",
    providers,
    requiresName: options.requireName,
    async signIn(input) {
      try {
        const data = await clerk.signIn?.create?.({
          identifier: input.email,
          password: input.password,
        });
        return { success: true, data };
      } catch (error) {
        return { success: false, error: mapClerkError(error) };
      }
    },
    async signUp(input) {
      try {
        const data = await clerk.signUp?.create?.({
          emailAddress: input.email,
          password: input.password,
          firstName: input.name,
        });
        return { success: true, data };
      } catch (error) {
        return { success: false, error: mapClerkError(error) };
      }
    },
    async signOut() {
      await clerk.signOut?.();
      return { success: true };
    },
    async signInWithOAuth(provider) {
      try {
        await clerk.signIn?.authenticateWithRedirect?.({
          strategy: `oauth_${provider}`,
          redirectUrl: callbackURL,
          redirectUrlComplete: callbackURL,
        });
        return new Promise(() => undefined);
      } catch (error) {
        return { success: false, error: mapClerkError(error) };
      }
    },
    useSession: clerk.useUser
      ? () => {
          const { user, isLoaded } = clerk.useUser?.() ?? {};
          return {
            data: user
              ? {
                  user: {
                    id: user.id,
                    email: user.primaryEmailAddress?.emailAddress ?? user.email ?? "",
                    name: user.fullName ?? user.firstName,
                    image: user.imageUrl,
                  },
                  session: user,
                }
              : null,
            isPending: !isLoaded,
            error: null,
          };
        }
      : undefined,
    normalizeError: mapClerkError,
  };
}
