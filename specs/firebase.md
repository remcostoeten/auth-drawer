# Firebase Client Adapter Specification

This specification outlines the client-side integration architecture for **Firebase Authentication (v10 JS SDK)** with the `@remcostoeten/auth-drawer` package.

---

## 1. Adapter Implementation

The adapter routes credentials and session hooks to standard Firebase Authentication SDK methods.

**`packages/auth-drawer/src/adapters/firebase.ts`**
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  GithubAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import type { Auth } from "firebase/auth";
import { useState, useEffect } from "react";
import type { AuthAdapter, AuthResult, CredentialAuthInput, AuthSessionState, OAuthProvider } from "../types";

/**
 * Options configuring standard Firebase Auth adapters.
 */
export interface FirebaseAdapterOptions {
  /** The initialized Firebase Auth SDK instance (returned by `getAuth(app)`). */
  auth: Auth;
  /** Override the list of providers shown in the UI. */
  providers?: OAuthProvider[];
}

/**
 * Firebase Auth Client Adapter.
 * Integrates Web Firebase JS SDK v9/v10 authentication with the Cozy Auth Drawer.
 */
export function firebaseAdapter(options: FirebaseAdapterOptions): AuthAdapter {
  const { auth, providers = ["github", "google"] } = options;

  return {
    id: "firebase",
    providers,

    // 1. Core Sign In
    async signIn({ email, password }) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, data: result };
      } catch (err: any) {
        return { success: false, error: mapFirebaseError(err) };
      }
    },

    // 2. Core Sign Up
    async signUp({ email, password }) {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, data: result };
      } catch (err: any) {
        return { success: false, error: mapFirebaseError(err) };
      }
    },

    // 3. Trigger Popup Social Login (Firebase Client standard)
    async signInWithOAuth(provider) {
      try {
        let authProvider;
        if (provider === "google") {
          authProvider = new GoogleAuthProvider();
        } else if (provider === "github") {
          authProvider = new GithubAuthProvider();
        } else {
          throw new Error(`Firebase provider not implemented for: ${provider}`);
        }

        const result = await signInWithPopup(auth, authProvider);
        return { success: true, data: result };
      } catch (err: any) {
        return { success: false, error: mapFirebaseError(err) };
      }
    },

    // 4. Core Sign Out
    async signOut() {
      await firebaseSignOut(auth);
      return { success: true };
    },

    // 5. Request Password Reset
    async requestPasswordReset(email) {
      try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: mapFirebaseError(err) };
      }
    },

    // 6. Reactive Session Hook
    useSession() {
      const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
      const [isPending, setIsPending] = useState(true);

      useEffect(() => {
        // Subscribe to auth state modifications
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setSessionState({
              user: {
                id: user.uid,
                email: user.email ?? "",
                name: user.displayName ?? undefined,
                image: user.photoURL,
              },
              session: user, // Firebase User credential session representation
            });
          } else {
            setSessionState(null);
          }
          setIsPending(false);
        });

        return () => unsubscribe();
      }, []);

      return { data: sessionState, isPending, error: null };
    },

    normalizeError: mapFirebaseError,
  };
}
```

---

## 2. Error Normalization Mapping

> [!IMPORTANT]
> The `mapFirebaseError` function should be defined inside the adapter file (`firebase.ts`), not in a shared errors module.

Firebase Authentication errors contain a `.code` string matching standard namespace codes (`auth/...`).

| Firebase Error Code | Target UI Placement | local `AuthErrorCode` |
|---|---|---|
| `auth/invalid-credential` | `"form"` | `invalid_credentials` |
| `auth/email-already-in-use` | `"email"` | `email_taken` |
| `auth/invalid-email` | `"email"` | `invalid_email` |
| `auth/weak-password` | `"password"` | `weak_password` |
| `auth/too-many-requests` | `"form"` | `rate_limited` |
| `auth/user-not-found` | `"email"` | `user_not_found` |
| `auth/popup-closed-by-user` | `"form"` | `oauth_cancelled` |
| `auth/cancelled-popup-request` | `"form"` | `oauth_cancelled` |
| `auth/popup-blocked` | `"form"` | `popup_blocked` |
| `auth/network-request-failed` | `"form"` | `network_error` |
| `auth/account-exists-with-different-credential` | `"email"` | `email_taken` |

### Firebase Error Mapper Code

**`packages/auth-drawer/src/adapters/firebase.ts` (Error Mapper)**
```typescript
import type { AuthUiError, AuthErrorCode } from "../types";

export function mapFirebaseError(firebaseError: any): AuthUiError {
  const code = firebaseError?.code;
  const message = firebaseError?.message ?? "Firebase authentication failed.";

  let uiCode: AuthErrorCode = "unknown";
  let target: AuthUiError["target"] = "form";

  switch (code) {
    case "auth/invalid-credential":
      uiCode = "invalid_credentials";
      target = "form";
      break;
    case "auth/email-already-in-use":
    case "auth/account-exists-with-different-credential":
      uiCode = "email_taken";
      target = "email";
      break;
    case "auth/invalid-email":
      uiCode = "invalid_email";
      target = "email";
      break;
    case "auth/weak-password":
      uiCode = "weak_password";
      target = "password";
      break;
    case "auth/too-many-requests":
      uiCode = "rate_limited";
      target = "form";
      break;
    case "auth/user-not-found":
      uiCode = "user_not_found";
      target = "email";
      break;
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      uiCode = "oauth_cancelled";
      target = "form";
      break;
    case "auth/popup-blocked":
      uiCode = "popup_blocked";
      target = "form";
      break;
    case "auth/network-request-failed":
      uiCode = "network_error";
      target = "form";
      break;
    default:
      break;
  }

  return {
    code: uiCode,
    message,
    target,
    cause: firebaseError,
  };
}
```
