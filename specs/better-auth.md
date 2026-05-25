# Better Auth Client Adapter Specification

This specification outlines the client-side integration architecture for **Better Auth** with the `@remcostoeten/auth-drawer` package.

---

## 1. Adapter Implementation

The adapter manages credential submission, OAuth provider redirection, reactive session hook updates, and client plugin discovery.

```typescript
import type { AuthAdapter, AuthResult, CredentialAuthInput, OAuthProvider } from "../types";
import { mapBetterAuthError } from "./errors";

/**
 * Configuration options for initializing the Better Auth adapter.
 */
export interface BetterAuthAdapterOptions<TClient = any> {
  /** 
   * The initialized client instance returned by `createAuthClient`.
   * Must include standard auth methods (`signIn`, `signUp`, etc.) and optional plugins.
   */
  client: TClient;
  /** Default redirect URL on successful authentication actions. */
  callbackURL?: string;
  /** Redirect URL for newly registered users. */
  newUserCallbackURL?: string;
  /** Optional override to control which social providers are visible in the Drawer UI. */
  providers?: OAuthProvider[];
  /** Redirection landing link appended to password recovery email links. */
  passwordResetRedirectTo?: string;
}

/**
 * Factory that returns a standardized adapter instance wrapping a Better Auth client.
 * Automatically checks for active client plugins (Magic Link, OTP, Anonymous) and exposes them.
 */
export function betterAuthAdapter(options: BetterAuthAdapterOptions): AuthAdapter {
  const { client, callbackURL = "/", newUserCallbackURL, passwordResetRedirectTo } = options;

  // Derive providers from client config or fall back to custom definitions
  const providers = options.providers ?? client.options?.socialProviders ?? ["github", "google"];

  const adapter: AuthAdapter = {
    id: "better-auth",
    providers,

    // 1. Core Sign In (Email/Password or Social redirection)
    async signIn(input) {
      const { data, error } = await client.signIn.email({
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe,
        callbackURL,
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 2. Core Sign Up
    async signUp(input) {
      const { data, error } = await client.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
        callbackURL: newUserCallbackURL ?? callbackURL,
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 3. Sign Out
    async signOut() {
      const { error } = await client.signOut();
      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true };
    },

    // 4. Request Password Reset (using the updated non-deprecated API)
    async requestPasswordReset(email) {
      const { data, error } = await client.requestPasswordReset({
        email,
        redirectTo: passwordResetRedirectTo ?? (typeof window !== "undefined" ? `${window.location.origin}/reset-password` : "/reset-password"),
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 5. OAuth Social Provider Sign In
    async signInWithOAuth(provider) {
      const { data, error } = await client.signIn.social({
        provider,
        callbackURL,
        newUserCallbackURL: newUserCallbackURL ?? callbackURL,
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 6. Reactive Session Tracking
    useSession() {
      // Connect to Better Auth's reactive hook directly
      const session = client.useSession();
      return {
        data: session.data ? {
          user: session.data.user,
          session: session.data.session,
        } : null,
        isPending: session.isPending,
        error: session.error,
      };
    },

    // 7. Error normalizer export
    normalizeError: mapBetterAuthError,
  };

  // 8. Dynamic Feature Injection based on client plugins
  const features: Record<string, any> = {};

  // Detect Magic Link Plugin client presence
  if (typeof client.signIn?.magicLink === "function") {
    features.magicLink = {
      signIn: async (email: string) => {
        const { data, error } = await client.signIn.magicLink({
          email,
          callbackURL,
        });
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      }
    };
  }

  // Detect Email OTP Plugin client presence
  if (typeof client.emailOtp?.sendVerificationOtp === "function") {
    features.emailOtp = {
      sendVerificationOtp: async (email: string) => {
        const { data, error } = await client.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        });
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      },
      signIn: async (email: string, otp: string) => {
        const { data, error } = await client.signIn.emailOtp({
          email,
          otp,
          callbackURL,
        });
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      }
    };
  }

  // Detect Anonymous Login Plugin presence
  if (typeof client.signIn?.anonymous === "function") {
    features.anonymous = {
      signIn: async () => {
        const { data, error } = await client.signIn.anonymous();
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      }
    };
  }

  if (Object.keys(features).length > 0) {
    adapter.features = features;
  }

  return adapter;
}
```

---

## 2. Error Normalization Mapping

> [!IMPORTANT]
> The `mapBetterAuthError` function should be defined inside the adapter file (`better-auth.ts`), not in a shared errors module.

Better Auth provides structured HTTP statuses and machine-readable `code` keys. Here is how they map to our local `AuthUiError` shape:

| Better Auth Code | Better Auth Status | Target UI Placement | local `AuthErrorCode` |
|---|---|---|---|
| `INVALID_EMAIL_OR_PASSWORD` | 401 / 422 | `"form"` (generic alert) | `invalid_credentials` |
| `USER_ALREADY_EXISTS` | 422 | `"email"` (under field) | `email_taken` |
| `INVALID_EMAIL` | 422 | `"email"` (under field) | `invalid_email` |
| `INVALID_PASSWORD` | 422 | `"password"` (under field) | `weak_password` |
| `EMAIL_NOT_VERIFIED` | 403 | `"form"` (generic alert) | `email_not_verified` |
| `USER_NOT_FOUND` | 404 | `"email"` | `user_not_found` |
| `TOO_MANY_REQUESTS` | 429 | `"form"` | `rate_limited` |
| `SOCIAL_ACCOUNT_ALREADY_LINKED` | 422 | `"form"` | `email_taken` |
| Network/fetch failure | N/A | `"form"` | `network_error` |
