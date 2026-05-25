# Passport.js Client-Side Adapter Specification

This specification outlines the client-side integration architecture to interface with server-side **Passport.js** authentication strategies (mounted on Express, Fastify, NestJS, etc.) using cookie-based sessions.

---

## 1. Adapter Implementation

The client adapter handles credentials submission to Passport's Local Strategy endpoint, cookie session revocation, and fetching serialized user session profiles.

```typescript
import { useState, useEffect } from "react";
import type { AuthAdapter, AuthResult, CredentialAuthInput, AuthSessionState } from "../types";

/**
 * Options configuring routes mapped to server-side Passport.js controllers.
 */
export interface PassportAdapterOptions {
  /** 
   * The server route handling passport's `local` authentication strategy.
   * Default: "/login"
   */
  loginUrl?: string;
  /** 
   * The server logout route clearing session cookies.
   * Default: "/logout"
   */
  logoutUrl?: string;
  /** 
   * The server route returning the current `req.user` serialized session payload.
   * Default: "/user"
   */
  userProfileUrl?: string;
  /**
   * The server route for user registration.
   * Default: "/register"
   */
  registerUrl?: string;
}

/**
 * Passport.js Client Adapter.
 * Integrates client drawer components with server-side Node.js cookie session engines.
 */
export function passportAdapter(options: PassportAdapterOptions = {}): AuthAdapter {
  const { loginUrl = "/login", logoutUrl = "/logout", userProfileUrl = "/user", registerUrl = "/register" } = options;

  return {
    id: "passport",

    // 1. Submit credentials to the local Passport strategy endpoint
    async signIn({ email, password }) {
      try {
        const response = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // Maps to passport's standard username/password strategy keys
          body: JSON.stringify({ username: email, password }),
        });

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: "invalid_credentials",
              target: "form",
              message: "Incorrect username or password.",
            }
          };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: { 
            code: "network_error", 
            target: "form", 
            message: "Failed to connect to authentication server." 
          }
        };
      }
    },

    // 2. Register new user account (if server supports it)
    async signUp({ email, password, name }) {
      try {
        const response = await fetch(registerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: email, password, name }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: response.status === 409 ? "email_taken" : "unknown",
              target: response.status === 409 ? "email" : "form",
              message: result.message ?? "Registration failed.",
            },
          };
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: {
            code: "network_error",
            target: "form",
            message: "Failed to connect to authentication server.",
          },
        };
      }
    },

    // 3. Clear backend session cookies
    async signOut() {
      await fetch(logoutUrl, { method: "POST", credentials: "include" });
      return { success: true };
    },

    // 4. Retrieve serializeUser data from the session cookie
    useSession() {
      const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
      const [isPending, setIsPending] = useState(true);
      const [error, setError] = useState<any>(null);

      useEffect(() => {
        // Fetch user data. Browser attaches session cookies automatically.
        fetch(userProfileUrl, { credentials: "include" })
          .then((res) => {
            if (res.status === 401) return null; // Unauthenticated
            if (!res.ok) throw new Error("Profile request failed");
            return res.json();
          })
          .then((data) => {
            if (data) {
              setSessionState({
                user: {
                  id: data.id || data._id,
                  email: data.email || data.username,
                  name: data.name || data.displayName,
                  image: data.avatar || data.imageUrl,
                },
                session: data, // Passport user session object
              });
            }
          })
          .catch((err) => {
            setError(err);
          })
          .finally(() => {
            setIsPending(false);
          });
      }, []);

      return { data: sessionState, isPending, error };
    }
  };
}
```

---

## 2. API Design Verification

*   **Credential Payload Mapping:** Passport's standard `LocalStrategy` expects request body properties named `username` and `password` by default. The adapter automatically maps `email` to `username` to match server-side expectations out-of-the-box.
*   **Cookie Authentication Handling:** Passport runs cookie sessions via middleware like `express-session`. Since browser fetches append and track cookies automatically across identical origins, the client adapter does not need to handle tokens or headers explicitly.

---

## 3. Cross-Origin Considerations

All `fetch` calls include `credentials: "include"` to ensure session cookies are sent across origins. If your Passport.js server runs on a different domain or port than your frontend, ensure:
- CORS middleware allows the frontend origin
- `credentials: true` is set in CORS configuration
- `sameSite` cookie attribute is configured appropriately
