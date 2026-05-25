# Custom JWT / REST API Client Adapter Specification

This specification outlines the client-side integration architecture for custom backends (built with Node.js, Go, Python, Laravel, etc.) utilizing JSON Web Tokens (JWT) for authentication.

---

## 1. Adapter Implementation

The adapter manages credential submission, authorization header configuration, and token cleanup inside the browser storage (localStorage or sessionStorage).

```typescript
import { useState, useEffect } from "react";
import type { AuthAdapter, AuthResult, CredentialAuthInput, AuthSessionState } from "../types";

/**
 * Options to configure custom REST API JWT integrations.
 */
export interface CustomJwtAdapterOptions {
  /** 
   * The base URL endpoint for REST auth actions (e.g. "/api/v1/auth").
   * Default: "/api/auth"
   */
  apiUrl?: string;
  /** 
   * Storage target used to persist the received authorization token.
   * Default: "localStorage"
   */
  storageType?: "localStorage" | "sessionStorage";
  /** 
   * The key identifier used to store the token payload.
   * Default: "auth_token"
   */
  tokenKey?: string;
  /**
   * Optional endpoint for refreshing expired tokens.
   * If provided, the adapter will attempt a refresh before clearing the session.
   * Default: undefined (no refresh)
   */
  refreshUrl?: string;
}

/**
 * REST API Adapter designed for custom backends.
 * Persists JWTs in local/session storage and appends them to Authorization Bearer headers.
 */
export function customJwtAdapter(options: CustomJwtAdapterOptions = {}): AuthAdapter {
  const { apiUrl = "/api/auth", storageType = "localStorage", tokenKey = "auth_token", refreshUrl } = options;
  const storage = typeof window !== "undefined" ? window[storageType] : null;

  return {
    id: "custom-jwt",

    // 1. Post credentials to custom login endpoint and persist the returned token
    async signIn({ email, password }) {
      try {
        const response = await fetch(`${apiUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: "invalid_credentials",
              target: "form",
              message: result.message ?? "Invalid credentials. Please try again.",
            }
          };
        }

        // Store JWT token locally
        storage?.setItem(tokenKey, result.token);
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          error: { 
            code: "network_error", 
            target: "form", 
            message: "Failed to connect to backend auth server." 
          }
        };
      }
    },

    // 2. Register new user account
    async signUp({ email, password, name }) {
      try {
        const response = await fetch(`${apiUrl}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, name }),
        });

        const result = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: {
              code: response.status === 409 ? "email_taken" : "unknown",
              target: response.status === 409 ? "email" : "form",
              message: result.message ?? "Registration failed.",
            },
          };
        }

        // Store JWT token if returned on registration
        if (result.token) {
          storage?.setItem(tokenKey, result.token);
        }
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          error: {
            code: "network_error",
            target: "form",
            message: "Failed to connect to backend auth server.",
          },
        };
      }
    },

    // 3. Clear stored token on logout
    async signOut() {
      storage?.removeItem(tokenKey);
      return { success: true };
    },

    // 4. Reactively fetch the user profile using the stored token
    useSession() {
      const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
      const [isPending, setIsPending] = useState(true);
      const [error, setError] = useState<any>(null);

      useEffect(() => {
        const token = storage?.getItem(tokenKey);
        if (!token) {
          setIsPending(false);
          return;
        }

        fetch(`${apiUrl}/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          },
          credentials: "include",
        })
          .then(async (res) => {
            if (res.status === 401 && refreshUrl) {
              // Attempt token refresh
              const refreshRes = await fetch(refreshUrl, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                credentials: "include",
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                storage?.setItem(tokenKey, refreshData.token);
                // Retry the original request with new token
                const retryRes = await fetch(`${apiUrl}/me`, {
                  headers: { "Authorization": `Bearer ${refreshData.token}` },
                  credentials: "include",
                });
                if (!retryRes.ok) throw new Error("Session expired");
                return retryRes.json();
              }
              throw new Error("Session expired");
            }
            if (!res.ok) throw new Error("Session expired");
            return res.json();
          })
          .then((data) => {
            setSessionState({
              user: {
                id: data.id,
                email: data.email,
                name: data.name,
                image: data.avatarUrl,
              },
              session: { token },
            });
          })
          .catch((err) => {
            setError(err);
            storage?.removeItem(tokenKey); // clean up expired token
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

## 2. API Design Guidelines

*   **Security Practices:** If using JWT, developers are encouraged to use **HttpOnly Secure Cookies** rather than localStorage to prevent XSS vulnerability. If using cookies, the `signIn` function simply calls `/login` without storing any token inside `storage` (as the browser appends and manages cookies automatically).
*   **Header Format:** Follows standard OAuth 2.0 / OpenID Connect HTTP Bearer pattern: `Authorization: Bearer <token>`.
*   **Cross-Origin Requests:** All `fetch` calls include `credentials: "include"` to ensure cookies are sent for cross-origin deployments. If your API server is on a different domain, configure CORS to allow credentials.
