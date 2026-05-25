# Supabase Client Adapter Specification

Integrating **Supabase Auth (GoTrue)** with the `@remcostoeten/auth-drawer` package is highly straightforward. Supabase uses a similar `{ data, error }` pattern and provides a subscription method (`onAuthStateChange`) to listen for session changes in real-time.

Below is the complete design for the first-party Supabase adapter.

---

## 1. The Supabase Adapter Implementation

This adapter maps the standard `supabase.auth` client calls directly to our unified `AuthAdapter` interface.

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthAdapter, AuthResult, CredentialAuthInput, AuthSessionState, OAuthProvider } from "../types";
import { useState, useEffect } from "react";
import { mapSupabaseError } from "./errors";

/**
 * Configuration options required to instantiate the Supabase Auth adapter.
 */
export interface SupabaseAdapterOptions {
  /** 
   * The initialized `@supabase/supabase-js` client instance.
   * Leveraged internally to make GoTrue API calls under the `supabase.auth` namespace.
   */
  supabase: SupabaseClient;
  /** The default callback landing URL redirected to after successful registration. */
  redirectTo?: string;
  /** Override standard OAuth social logins rendered in the component. */
  providers?: OAuthProvider[];
  /** Redirection landing link appended to password recovery email links. */
  passwordResetRedirectTo?: string;
}

/**
 * Adapter factory that maps Supabase Auth functions to the Drawer's AuthAdapter interface.
 * Implements real-time session tracking using supabase.auth.onAuthStateChange.
 */
export function supabaseAdapter(options: SupabaseAdapterOptions): AuthAdapter {
  const { supabase, redirectTo = (typeof window !== "undefined" ? window.location.origin : ""), passwordResetRedirectTo } = options;

  // Let developers customize providers or fall back to default OAuth options
  const providers = options.providers ?? ["github", "google"];

  return {
    id: "supabase",
    providers,

    // 1. Sign In (Email / Password)
    async signIn(input) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data };
    },

    // 2. Sign Up (Email / Password)
    async signUp(input) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          // Pass the display name inside user metadata
          data: {
            name: input.name,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data };
    },

    // 3. Sign Out
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true };
    },

    // 4. Request Password Reset
    async requestPasswordReset(email) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: passwordResetRedirectTo ?? `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data };
    },

    // 5. Complete Password Reset (Update password)
    async resetPassword({ newPassword }) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data };
    },

    // 6. OAuth Social Provider Sign In
    async signInWithOAuth(provider) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { success: false, error: mapSupabaseError(error) };
      }
      return { success: true, data };
    },

    // 7. Reactive Session tracking
    // Bridges Supabase's listener pattern to our React UI
    useSession() {
      const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
      const [isPending, setIsPending] = useState(true);
      const [error, setError] = useState<any>(null);

      useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            setError(error);
          } else if (session) {
            setSessionState({
              user: {
                id: session.user.id,
                email: session.user.email ?? "",
                name: session.user.user_metadata?.name,
                image: session.user.user_metadata?.avatar_url,
              },
              session,
            });
          }
          setIsPending(false);
        });

        // Listen for authentication changes (Sign In, Sign Out, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            setSessionState({
              user: {
                id: session.user.id,
                email: session.user.email ?? "",
                name: session.user.user_metadata?.name,
                image: session.user.user_metadata?.avatar_url,
              },
              session,
            });
          } else {
            setSessionState(null);
          }
          setIsPending(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      }, []);

      return { data: sessionState, isPending, error };
    },

    // 8. Dynamic features specific to Supabase Auth
    features: {
      magicLink: {
        signIn: async (email: string) => {
          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: redirectTo,
            },
          });
          if (error) return { success: false, error: mapSupabaseError(error) };
          return { success: true, data };
        },
      },
    },

    normalizeError: mapSupabaseError,
  };
}
```

---

## 2. Error Normalization Mapping

> [!IMPORTANT]
> The `mapSupabaseError` function should be defined inside the adapter file (`supabase.ts`), not in a shared errors module.

Supabase's auth engine returns errors extending from `AuthError` containing a `.code` (string identifier) and `.status` (HTTP code). We map these directly to the drawer's layout targets:

| Supabase Code | HTTP Status | Target UI Placement | local `AuthErrorCode` |
|---|---|---|---|
| `invalid_credentials` | 400 | `"form"` (generic alert) | `invalid_credentials` |
| `email_exists` | 422 | `"email"` (under field) | `email_taken` |
| `validation_failed` (email) | 422 | `"email"` (under field) | `invalid_email` |
| `validation_failed` (password) | 422 | `"password"` (under field) | `weak_password` |
| `email_not_confirmed` | 400 / 403 | `"form"` (generic alert) | `email_not_verified` |
| `user_not_found` | 404 | `"email"` | `user_not_found` |

---

## 3. Cross-Origin Credentials Note

If the Supabase project is hosted on a different domain than the consuming application, the consumer may need to configure CORS headers on the Supabase side and ensure `credentials: "include"` is set on fetch requests. The `@supabase/supabase-js` client handles this internally for most cases, but custom `fetch` overrides or reverse-proxy setups may require explicit configuration.
