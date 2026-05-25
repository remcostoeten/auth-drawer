# DRY Adapter Design Plan: Do's and Don'ts

To ensure the `@remcostoeten/auth-drawer` package scales cleanly, adapters (Better Auth, Supabase, Next-Auth, etc.) must remain thin presentation-to-client translators. This document details the architectural boundaries required to keep code DRY.

---

## 🚀 The Core Boundary Rules

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
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Backend SDK Client                   │
│        (supabase-js, better-auth client, etc.)         │
└────────────────────────────────────────────────────────┘
```

---

## 🚫 Validation

### ❌ Don't
*   Write email formats (regex) or password length checks inside the adapters.
*   Check for password matching (e.g., `password !== confirmPassword`) inside adapters.

###   Do
*   Perform all basic input validation in the core UI layer using your existing `validation.ts` utility *before* calling `adapter.signIn` or `adapter.signUp`.
*   Keep adapters focused only on returning backend-specific validation errors (e.g., `email_exists` or `invalid_credentials`).

---

## 🔑 OAuth Provider Management

### ❌ Don't
*   Import brand icons (Google, GitHub) or custom display text mapping within adapters.
*   Make adapters return icon components.

###   Do
*   Expose a central registry containing all supported OAuth providers (icons, labels, and color properties) in the core UI package.
*   Have adapters simply declare supported providers as a flat string array:
    ```typescript
    providers: ["github", "google", "discord"]
    ```

---

## ⚠️ Error Normalization

### ❌ Don't
*   Recreate error translation dictionaries (messages) inside each adapter file.
*   Manually construct complete `AuthUiError` objects in each error callback.

###   Do
*   Implement a shared error creation factory in `@remcostoeten/auth-drawer/core`:
    ```typescript
    export function createAdapterError(code: AuthErrorCode, target: AuthErrorTarget, raw?: any);
    ```
*   Use the factory in your adapter's error mapper to assign standard types (`email_taken`, `weak_password`) while letting the core UI retrieve the correct copy.

---

## ⚙️ Base Wrapper

### ❌ Don't
*   Force adapter authors to implement every method (like `signOut` or `resetPassword`) if the target backend does not support it or if a reload is sufficient.

###   Do
*   Provide a `createAdapter` builder wrapper that populates default behaviors (e.g., fallback redirects, standard rate limit handling, page refreshes on logout) for missing fields.
