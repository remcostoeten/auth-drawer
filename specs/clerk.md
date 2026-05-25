# Clerk Client Adapter Specification (Hook-Based)

This specification outlines the client-side integration architecture for **Clerk** authentication inside the `@remcostoeten/auth-drawer` package using Clerk's headless client hooks (`useSignIn`, `useSignUp`, `useAuth`, `useUser`, `useSession`).

> [!IMPORTANT]
> Unlike other adapters that use plain factory functions, the Clerk adapter **must** be implemented as a React hook (`useClerkAdapter`). This is because Clerk's client-side API is entirely hook-based — `useSignIn`, `useSignUp`, `useAuth` etc. can only be called at the top level of a React component per the Rules of Hooks. A plain factory function cannot call these hooks inside async methods.

---

## 1. Adapter Implementation

The adapter calls all Clerk hooks at the top level and returns a memoized `AuthAdapter` object.

```typescript
import { useSignIn, useSignUp, useAuth, useUser, useSession } from "@clerk/clerk-react";
import { useMemo } from "react";
import type { AuthAdapter, AuthResult, CredentialAuthInput, AuthSessionState, OAuthProvider } from "../types";

/**
 * Configuration options for Clerk client integration.
 */
export interface ClerkAdapterOptions {
  /**
   * Optional override for social providers configured in Clerk dashboard.
   * Default: ["github", "google"]
   */
  providers?: OAuthProvider[];
}

/**
 * Clerk client-side adapter hook.
 *
 * Unlike other adapters that use plain factory functions, Clerk's headless API
 * requires React hooks (`useSignIn`, `useSignUp`, etc.) to access client state.
 * This adapter MUST be called as a React hook inside a component wrapped by
 * Clerk's `<ClerkProvider>`.
 *
 * @hook
 *
 * @example
 * ```tsx
 * import { useClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";
 *
 * function App() {
 *   const adapter = useClerkAdapter({ providers: ["github", "google"] });
 *   return <AuthProvider adapter={adapter}><AuthDrawer /></AuthProvider>;
 * }
 * ```
 */
export function useClerkAdapter(options: ClerkAdapterOptions = {}): AuthAdapter {
  const { providers = ["github", "google"] } = options;

  // Call ALL Clerk hooks at the top level (Rules of Hooks)
  const { signIn, isLoaded: isSignInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const { signOut, userId, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { session, isLoaded: isSessionLoaded } = useSession();

  return useMemo<AuthAdapter>(() => ({
    id: "clerk",
    providers,

    // 1. Core Sign In (email/password)
    async signIn({ email, password }) {
      if (!isSignInLoaded || !signIn) {
        return {
          success: false,
          error: { code: "unknown", target: "form", message: "Clerk client has not loaded yet." },
        };
      }

      try {
        const result = await signIn.create({ identifier: email, password });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          return { success: true, data: result };
        }

        // Multi-factor or other intermediate states
        return {
          success: false,
          error: {
            code: "unknown",
            target: "form",
            message: `Sign in requires additional verification (status: ${result.status}).`,
          },
        };
      } catch (err: any) {
        return { success: false, error: mapClerkError(err) };
      }
    },

    // 2. Core Sign Up
    async signUp({ email, password, name }) {
      if (!isSignUpLoaded || !signUp) {
        return {
          success: false,
          error: { code: "unknown", target: "form", message: "Clerk client has not loaded yet." },
        };
      }

      try {
        const result = await signUp.create({
          emailAddress: email,
          password,
          firstName: name,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          return { success: true, data: result };
        }

        // Email verification required
        if (result.status === "missing_requirements") {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          return {
            success: true,
            data: { status: "verification_required" },
          };
        }

        return { success: true, data: result };
      } catch (err: any) {
        return { success: false, error: mapClerkError(err) };
      }
    },

    // 3. OAuth Social Sign In
    async signInWithOAuth(provider) {
      if (!isSignInLoaded || !signIn) {
        return {
          success: false,
          error: { code: "unknown", target: "form", message: "Clerk client has not loaded yet." },
        };
      }

      try {
        await signIn.authenticateWithRedirect({
          strategy: `oauth_${provider}` as any,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: mapClerkError(err) };
      }
    },

    // 4. Core Sign Out
    async signOut() {
      await signOut();
      return { success: true };
    },

    // 5. Reactive Session Bridge
    useSession() {
      const isPending = !isAuthLoaded || !isUserLoaded || !isSessionLoaded;

      const data: AuthSessionState | null =
        user && session
          ? {
              user: {
                id: userId ?? user.id,
                email: user.primaryEmailAddress?.emailAddress ?? "",
                name: user.fullName ?? undefined,
                image: user.imageUrl,
              },
              session,
            }
          : null;

      return { data, isPending, error: null };
    },

    normalizeError: mapClerkError,
  }), [
    isSignInLoaded, isSignUpLoaded, isAuthLoaded, isUserLoaded, isSessionLoaded,
    signIn, signUp, signOut, setActive, user, session, userId, providers,
  ]);
}
```

---

## 2. Error Normalization Mapping

> [!IMPORTANT]
> The `mapClerkError` function should be defined inside the adapter file (`clerk.ts`), not in a shared errors module.

Clerk throws errors containing an `errors` array property. Each error object contains a machine-readable `code` and descriptive `message`.

| Clerk Error Code | Target UI Placement | local `AuthErrorCode` |
|---|---|---|
| `form_identifier_not_found` | `"email"` | `user_not_found` |
| `form_password_incorrect` | `"password"` | `invalid_credentials` |
| `form_identifier_exists` | `"email"` | `email_taken` |
| `password_too_short` | `"password"` | `weak_password` |
| `form_password_pwned` | `"password"` | `weak_password` |
| `strategy_not_supported` | `"form"` | `provider_unavailable` |
| `session_exists` | `"form"` | `unknown` |

### Clerk Error Mapper Code

```typescript
import type { AuthUiError, AuthErrorCode } from "../types";

export function mapClerkError(clerkErrorPayload: any): AuthUiError {
  const firstError = clerkErrorPayload?.errors?.[0];
  const code = firstError?.code;
  const message = firstError?.longMessage ?? firstError?.message ?? "Clerk authentication failed.";

  let uiCode: AuthErrorCode = "unknown";
  let target: AuthUiError["target"] = "form";

  switch (code) {
    case "form_identifier_not_found":
      uiCode = "user_not_found";
      target = "email";
      break;
    case "form_password_incorrect":
      uiCode = "invalid_credentials";
      target = "password";
      break;
    case "form_identifier_exists":
      uiCode = "email_taken";
      target = "email";
      break;
    case "password_too_short":
    case "form_password_pwned":
      uiCode = "weak_password";
      target = "password";
      break;
    default:
      if (code && code.includes("rate_limit")) {
        uiCode = "rate_limited";
      }
      break;
  }

  return {
    code: uiCode,
    message,
    target,
    cause: clerkErrorPayload,
  };
}
```

---

## 3. Hook-Based Adapter Usage Note

Because `useClerkAdapter` is a React hook (not a plain factory function), it must follow React's Rules of Hooks:

1. **Must be called inside a React component** — typically in the same component that renders `<AuthProvider>`.
2. **Cannot be called conditionally** — do not wrap in `if` statements or loops.
3. **Requires `<ClerkProvider>` ancestor** — Clerk's hooks require the ClerkProvider context to be present in the tree.

```tsx
// ✅ Correct usage
import { ClerkProvider } from "@clerk/clerk-react";
import { useClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";
import { AuthProvider, AuthDrawer } from "@remcostoeten/auth-drawer";

function AuthRoot() {
  const adapter = useClerkAdapter({ providers: ["github", "google"] });
  return (
    <AuthProvider adapter={adapter}>
      <AuthDrawer />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <AuthRoot />
    </ClerkProvider>
  );
}
```
