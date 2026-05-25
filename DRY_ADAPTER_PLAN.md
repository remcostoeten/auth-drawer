# DRY Adapter Design Plan: Do's and Don'ts

To ensure the `@remcostoeten/auth-drawer` package scales cleanly, adapters (Better Auth, Supabase, NextAuth, Clerk, Firebase, etc.) must remain thin client-to-UI mappers. This document outlines the architectural boundaries and rules required to maintain a DRY (Don't Repeat Yourself) codebase.

---

## 🚀 The Core Boundary Rules

All adapters follow a standard boundary layout. The UI is in control of presentation and visual rules; adapters are strictly responsible for API communication and error formatting.

```
┌────────────────────────────────────────────────────────┐
│                   Drawer UI & Core                     │
│  (Framer Motion, CSS, validation.ts, Provider Registry) │
└───────────────────────────┬────────────────────────────┘
                            │
                  Uses Unified AuthAdapter
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Target Adapter                      │
│      (Translates inputs/outputs to client SDKs)        │
│    (Applies to all 7 supported specs in /specs)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Backend SDK Client                   │
│      (clerk-js, supabase-js, firebase/auth client)     │
└────────────────────────────────────────────────────────┘
```

---

## 🚫 Validation Rules

### ❌ Don't
*   Write client-side email regex or password complexity format validators inside individual adapters.
*   Implement password-matching validation rules (`password !== confirmPassword`) within individual adapters.

###   Do
*   Implement all client-side checks within the core package's `validation.ts` module.
*   Ensure the Drawer UI calls this validator *before* delegating actions to the adapter (`adapter.signIn` or `adapter.signUp`).
*   Only handle server-returned validation rejections (like `email_exists` or `weak_password` errors) inside the adapter.

---

## 🔑 OAuth Provider Management

### ❌ Don't
*   Import third-party icons (Google, GitHub, Apple) directly inside your adapters.
*   Make adapters return React JSX elements or icons.

###   Do
*   Expose a centralized registry in the UI core mapping provider string IDs to visual assets and display titles.
*   Have adapters simply declare active providers as a flat array of identifiers:
    ```typescript
    providers: ["github", "google", "apple", "discord"]
    ```
*   Ensure the adapter's `signInWithOAuth` returns a promise that does not resolve on success if the SDK initiates a full-page redirect. This keeps the button loading state and disabled controls active in the UI until the page unloads.

---

## ⚠️ Error Normalization

### ❌ Don't
*   Hardcode string translation dictionaries (message copy) inside each adapter file.
*   Manually build custom `AuthUiError` objects from scratch inside each error callback.

###   Do
*   Use the unified factory utility `createAdapterError` from the core module:
    ```typescript
    export function createAdapterError(code: AuthErrorCode, target: AuthErrorTarget, raw?: any): AuthUiError;
    ```
*   Route native backend codes (e.g., Clerk's `form_password_incorrect` or Firebase's `auth/weak-password`) to standardized codes (`invalid_credentials`, `weak_password`), allowing the core package to manage copy.

---

## ⚙️ Base Wrapper

### ❌ Don't
*   Force developers or adapter authors to write duplicate boilerplate methods (like fallback signOut, redirects, or reset passwords) for custom backends.

###   Do
*   Provide a default `createAdapter` initialization utility that fills in fallback defaults (e.g. page refreshes on signOut, standard 500 error handlers) automatically for missing properties:
    ```typescript
    import { createAdapter } from "@remcostoeten/auth-drawer";

    const myAdapter = createAdapter({
      id: "my-backend",
      async signIn(input) {
        // Your signIn logic
      },
      // signOut defaults to window.location.reload()
      // signUp, requestPasswordReset, etc. are undefined → drawer hides those features
    });
    ```

---

## 🪝 `useSession` Hook Contract

The `useSession` method on `AuthAdapter` is a **React hook**. This has important implications:

### ❌ Don't
*   Call `adapter.useSession()` inside a regular function, event handler, or async callback.
*   Call `adapter.useSession()` conditionally (inside `if`, loops, or after early returns).

###   Do
*   Only call `adapter.useSession()` inside a React component or custom hook.
*   Mark the method with a `@hook` JSDoc tag so TypeScript-aware linting tools can flag violations.
*   Call it exactly once — inside `AuthProvider` — and expose the result through context.

```typescript
// ✅ Correct: called at the top level of a component
export function AuthProvider({ adapter, children }: AuthProviderProps) {
  const { data, isPending, error } = adapter.useSession?.() ?? {
    data: null, isPending: false, error: null,
  };
  // ...
}

// ❌ Wrong: called inside an event handler
function handleClick() {
  const session = adapter.useSession(); // ILLEGAL
}
```

---

## 🎛️ UI & Gating Sync Rules

To keep adapters thin and maintain high UX fidelity, the core components automatically react to adapter definitions and session states.

### ❌ Don't
* Require host applications to manually disable `allowRegister` or `showForgotPassword` when using a restricted adapter (e.g. read-only, or no reset-password capability).
* Allow automated presentation triggers (`pageLoad`, `scrollOpen`, `idle`) to open the auth drawer when the user is already authenticated.

###   Do
* Automatically disable visual form targets (`allowRegister = false` or `showForgotPassword = false`) inside the core component if the passed `adapter` lacks the matching method (`signUp === undefined` or `requestPasswordReset === undefined`).
* Check the reactive `useSession` hook status before executing trigger actions, gating any visual popup triggers when `session.user` is active.
