# Auth.js (NextAuth.js) Client Adapter Specification

This specification outlines the client-side integration architecture for **Auth.js (NextAuth.js) v4** with the `@remcostoeten/auth-drawer` package.

---

## 1. Adapter Implementation

The adapter delegates credentials and OAuth actions directly to client methods imported from `next-auth/react`.

```typescript
import { signIn, signOut, useSession } from "next-auth/react";
import type { AuthAdapter, AuthResult, CredentialAuthInput, OAuthProvider } from "../types";

/**
 * Configuration options for initializing the Auth.js (NextAuth) client-side adapter.
 */
export interface NextAuthAdapterOptions {
  /** 
   * The destination URL to redirect users to after successful authentication. 
   * Default: "/"
   */
  callbackURL?: string;
  /** 
   * Custom list of active OAuth provider IDs configured in the NextAuth backend.
   * Default: ["github", "google"]
   */
  providers?: OAuthProvider[];
}

/**
 * Factory that instantiates a standardized NextAuth/Auth.js adapter.
 * Handles the mapping of Credentials and OAuth providers, and translates the useSession loading statuses.
 */
export function nextAuthAdapter(options: NextAuthAdapterOptions = {}): AuthAdapter {
  const { callbackURL = "/", providers = ["github", "google"] } = options;

  return {
    id: "next-auth",
    providers,

    // 1. NextAuth routes credentials through signIn("credentials", ...)
    async signIn(input) {
      const result = await signIn("credentials", {
        redirect: false, // Prevent NextAuth from performing a hard browser reload
        email: input.email,
        password: input.password,
        callbackUrl: callbackURL,
      });

      if (!result) {
        return {
          success: false,
          error: { code: "unknown", target: "form", message: "No response received from NextAuth server." }
        };
      }

      if (result.error) {
        return {
          success: false,
          error: {
            code: "invalid_credentials",
            target: "form",
            message: result.error === "CredentialsSignin" 
              ? "Invalid credentials provided." 
              : result.error,
          }
        };
      }

      return { success: true };
    },

    // 2. NextAuth triggers OAuth redirection by passing the provider ID as the first argument
    async signInWithOAuth(provider) {
      await signIn(provider, { callbackUrl: callbackURL });
      // Redirect occurs instantly, so we return a successful trigger state
      return { success: true };
    },

    // 3. Core Sign Out
    async signOut() {
      await signOut({ redirect: false });
      return { success: true };
    },

    // 4. Reactive Session Bridge
    useSession() {
      const { data: session, status } = useSession();
      
      const isPending = status === "loading";
      const data = session?.user ? {
        user: {
          id: (session.user as any).id ?? "",
          email: session.user.email ?? "",
          name: session.user.name ?? undefined,
          image: session.user.image,
        },
        session,
      } : null;

      return { data, isPending, error: null };
    }
  };
}
```

---

## 2. API Signature Verification

*   **`signIn` Method:** Confirms to `next-auth/react` v4 spec. The options object supports `{ redirect: false, callbackUrl }` alongside credential parameters. Returning value is resolved asynchronously as `{ error, status, ok, url }` instead of throwing exceptions.
*   **`useSession` Hook:** Bridges the NextAuth reactive state statuses (`"loading"`, `"authenticated"`, `"unauthenticated"`) safely to the drawer's `isPending` and `data` properties.

---

## 3. Error Handling

NextAuth's `signIn()` with `redirect: false` returns `{ error: string | null, status, ok, url }`. The `error` field contains a string identifier. Common values:

| NextAuth Error String | Target UI Placement | local `AuthErrorCode` |
|---|---|---|
| `"CredentialsSignin"` | `"form"` | `invalid_credentials` |
| `"OAuthSignin"` | `"form"` | `provider_unavailable` |
| `"OAuthCallback"` | `"form"` | `oauth_cancelled` |
| `"SessionRequired"` | `"form"` | `unknown` |

Since NextAuth returns simple string errors, the error mapping should be handled inline within the adapter rather than requiring a separate mapper function.

---

## 4. Auth.js v5 Compatibility Note

This specification targets **NextAuth.js v4** (`next-auth/react`). Auth.js v5 (`@auth/nextjs`) uses a significantly different, server-first architecture with different client APIs. A separate `authjs-v5` adapter may be needed for v5 users. Key differences:
- v5 uses `auth()` server function instead of `getSession()`
- Client-side `useSession` still exists but session fetching is server-preferred
- `signIn`/`signOut` are imported from the auth config, not from `next-auth/react`
