# Cozy Auth Drawer: Agent-Executable Implementation Roadmap

This document serves as a detailed, step-by-step blueprint designed for direct execution by an AI coding agent or developer. It outlines the exact file modifications, paths, and code patterns required to build the agnostic adapter system.

---

## 1. Code Style Guidelines (Strict Agent Constraints)

When executing this roadmap, the agent **must** adhere to these syntax constraints:
1.  **No `React.FC` or `React.FunctionComponent`:** Define components as standard TypeScript functions.
2.  **No `React.` namespaces:** Import types directly (e.g., `import { ReactNode, useState, useEffect, useMemo, useTransition } from "react";`).
3.  **Explicit Prop Interfaces:** Type props as custom interfaces/types passed directly to the function arguments.

---

## 2. Phase 1: Core Type Definitions & Utilities

### Task 1.1: Update `packages/auth-drawer/src/types.ts`

> [!IMPORTANT]
> 1. The existing `CredentialAuthInput` type in `types.ts` has a `mode` field (`"login" | "register"`). **Remove the `mode` field** — the drawer will branch on mode before calling `adapter.signIn()` or `adapter.signUp()`, so adapters never need to know which mode the form is in. Do **not** redeclare `CredentialAuthInput` — reuse and modify the existing one.
> 2. Update the `FormMode` type in `types.ts` to support password resets:
>    ```typescript
>    export type FormMode = "login" | "register" | "resetPassword";
>    ```

Append the following adapter types to the end of [types.ts](file:///home/remcostoeten/dev/cozy-auth-drawer/packages/auth-drawer/src/types.ts):

```typescript
import type { AuthUiError, AuthErrorCode } from "./auth-errors";

/**
 * Standardized output wrapper for all adapter actions.
 */
export interface AuthResult<T = any> {
  success: boolean;
  data?: T | null;
  error?: AuthUiError | null;
}

/**
 * User and session profile structure exposed to the UI.
 */
export interface AuthSessionState {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    [key: string]: any;
  } | null;
  session: any | null;
}

/**
 * Reset password parameters.
 */
export interface ResetPasswordInput {
  newPassword: string;
}

/**
 * Core interface for authentication adapters.
 *
 * All methods except `signIn` and `id` are optional. The drawer uses
 * feature detection to show/hide UI elements based on which methods
 * are implemented (see "Adapter Feature Detection" below).
 */
export interface AuthAdapter {
  id: string;
  providers?: string[];
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp?: (input: CredentialAuthInput & { name: string }) => Promise<AuthResult>;
  signOut?: () => Promise<AuthResult>;
  signInWithOAuth?: (provider: string) => Promise<AuthResult>;
  requestPasswordReset?: (email: string) => Promise<AuthResult>;
  resetPassword?: (input: ResetPasswordInput) => Promise<AuthResult>;
  /**
   * Reactive session hook. This is a React hook and MUST only be called
   * from within a React component or custom hook (Rules of Hooks).
   * @hook
   */
  useSession: () => {
    data: AuthSessionState | null;
    isPending: boolean;
    error: any;
  };
  features?: {
    magicLink?: {
      signIn: (email: string) => Promise<AuthResult>;
    };
    emailOtp?: {
      sendVerificationOtp: (email: string) => Promise<AuthResult>;
      signIn: (email: string, otp: string) => Promise<AuthResult>;
    };
    anonymous?: {
      signIn: () => Promise<AuthResult>;
    };
  };
  normalizeError?: (error: unknown) => AuthUiError;
  /** Called after any successful auth action. */
  onSuccess?: (action: "signIn" | "signUp" | "signOut" | "oauth") => void;
  /** Called after any failed auth action. */
  onError?: (error: AuthUiError, action: "signIn" | "signUp" | "signOut" | "oauth") => void;
}
```

### Adapter Feature Detection & Automatic UI Overrides

The drawer MUST dynamically show/hide UI elements and force config overrides based on the active `adapter`'s defined methods. If an adapter is provided:

| Adapter Method | Configuration Forced Overrides & UI Behavior |
|---|---|
| `signUp === undefined` | Force `config.ui.auth.allowRegister = false` and hide the register tab toggle. |
| `requestPasswordReset === undefined` | Force `config.ui.auth.showForgotPassword = false` and hide the forgot password link. |
| `signInWithOAuth === undefined` | Force `config.ui.auth.providers = []` and hide all social sign-in buttons. |
| `features?.magicLink === undefined` | Hide the magic link sign-in alternative if previously enabled. |
| `features?.emailOtp === undefined` | Hide the email OTP verification form option. |

### Task 1.2: Create `packages/auth-drawer/src/errors.ts`
Implement standard error wrapper.
```typescript
import type { AuthUiError, AuthErrorCode, AuthErrorTarget } from "./auth-errors";

/**
 * Helper to construct unified AuthUiError payloads.
 */
export function createAdapterError(
  code: AuthErrorCode,
  target: AuthErrorTarget,
  rawError?: any
): AuthUiError {
  return {
    code,
    target,
    message: rawError?.message ?? "Authentication request failed.",
    cause: rawError,
    retryable: code === "network_error" || code === "server_error" || code === "rate_limited",
  };
}
```

### Task 1.3: Create `packages/auth-drawer/src/create-adapter.ts`
Base utility that fills in sensible defaults for missing methods, reducing boilerplate for minimal adapters.
```typescript
import type { AuthAdapter, AuthResult } from "./types";

/**
 * Wraps a partial adapter with sensible defaults for missing methods.
 * Reduces boilerplate for adapters that don't support every feature.
 */
export function createAdapter(partial: AuthAdapter): AuthAdapter {
  return {
    ...partial,
    signOut: partial.signOut ?? (async () => {
      if (typeof window !== "undefined") window.location.reload();
      return { success: true };
    }),
    signUp: partial.signUp,
    signInWithOAuth: partial.signInWithOAuth,
    requestPasswordReset: partial.requestPasswordReset,
    resetPassword: partial.resetPassword,
    normalizeError: partial.normalizeError,
  };
}
```

---

## 3. Phase 2: Implement First-Party Adapters

> [!IMPORTANT]
> Each adapter's error mapper function (e.g., `mapBetterAuthError`, `mapSupabaseError`) should be defined **inside** the adapter file itself, not in a shared errors module. The shared `errors.ts` only contains the generic `createAdapterError` utility.

### Task 2.1: Create `packages/auth-drawer/src/adapters/better-auth.ts`
Implements the Better Auth adapter conforming to the design spec in [better-auth.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/better-auth.md). Ensure dynamic check for plugins (`signIn.magicLink`, `emailOtp`, etc.) is fully typed.

### Task 2.2: Create `packages/auth-drawer/src/adapters/supabase.ts`
Implements the Supabase adapter conforming to the design spec in [supabase.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/supabase.md), using `onAuthStateChange` to update local React state.

### Task 2.3: Create `packages/auth-drawer/src/adapters/next-auth.ts`
Implements the Auth.js/NextAuth v4 adapter conforming to [next-auth.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/next-auth.md).

### Task 2.4: Create `packages/auth-drawer/src/adapters/clerk.ts`
Implements the Clerk hook-based adapter conforming to [clerk.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/clerk.md). **Note:** this adapter is a React hook (`useClerkAdapter`), not a plain factory function.

### Task 2.5: Create `packages/auth-drawer/src/adapters/firebase.ts`
Implements the Firebase Auth adapter conforming to [firebase.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/firebase.md).

### Task 2.6: Create `packages/auth-drawer/src/adapters/custom-jwt.ts`
Implements the Custom JWT/REST adapter conforming to [custom-jwt.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/custom-jwt.md).

### Task 2.7: Create `packages/auth-drawer/src/adapters/passport.ts`
Implements the Passport.js adapter conforming to [passport.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/passport.md).

### Task 2.8: Configure Exports in `packages/auth-drawer/package.json`
Add tree-shakeable entries to exports object for all adapters:
```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./adapters/better-auth": {
    "import": "./dist/adapters/better-auth.js",
    "types": "./dist/adapters/better-auth.d.ts"
  },
  "./adapters/supabase": {
    "import": "./dist/adapters/supabase.js",
    "types": "./dist/adapters/supabase.d.ts"
  },
  "./adapters/next-auth": {
    "import": "./dist/adapters/next-auth.js",
    "types": "./dist/adapters/next-auth.d.ts"
  },
  "./adapters/clerk": {
    "import": "./dist/adapters/clerk.js",
    "types": "./dist/adapters/clerk.d.ts"
  },
  "./adapters/firebase": {
    "import": "./dist/adapters/firebase.js",
    "types": "./dist/adapters/firebase.d.ts"
  },
  "./adapters/custom-jwt": {
    "import": "./dist/adapters/custom-jwt.js",
    "types": "./dist/adapters/custom-jwt.d.ts"
  },
  "./adapters/passport": {
    "import": "./dist/adapters/passport.js",
    "types": "./dist/adapters/passport.d.ts"
  },
  "./adapters/mock": {
    "import": "./dist/adapters/mock.js",
    "types": "./dist/adapters/mock.d.ts"
  }
}
```

---

## 4. Phase 3: Drawer Component Refactoring

### Task 3.1: Modify `packages/auth-drawer/src/ui/auth-drawer.tsx`
*   Add required `adapter: AuthAdapter` and optional `onSuccess` / `onError` callbacks directly to the `AuthDrawer` component props.
*   **Automatic UI Feature Overrides:** Override visual configuration options dynamically:
    *   If `adapter.signUp === undefined`, set `allowRegister = false` (disable and hide register toggle).
    *   If `adapter.requestPasswordReset === undefined`, set `showForgotPassword = false` (hide forgot password email trigger).
    *   If `adapter.signInWithOAuth === undefined`, set `providers = []` (hide all social sign-in buttons).
*   **Trigger Session Gating:** If the adapter's reactive session hook `adapter.useSession()` indicates that `session?.user` is authenticated:
    *   Gate trigger subscriptions so that automated triggers (`pageLoad`, `scrollOpen`, `idle`) do **not** open the drawer for already logged-in users.
*   **Override Mock Handlers:** If `adapter` is present, map the core handlers as follows:
    *   Map credential submission to `adapter.signIn` (if `mode === "login"`) or `adapter.signUp` (if `mode === "register"`).
    *   Map forgot password request to `adapter.requestPasswordReset`.
    *   Map social button clicks to `adapter.signInWithOAuth`.
    *   Map reset password submission (if `mode === "resetPassword"`) to `adapter.resetPassword`.
*   **Forward Callbacks:** On successful auth actions, call both `onSuccess` (closes drawer) and `adapter.onSuccess` / `props.onSuccess` (if defined). On failures, route normalized error payloads to both `adapter.onError` and `props.onError`.

### Task 3.2: Decouple Loaders with `useTransition` & Support `resetPassword` Mode
*   Refactor form submission hooks inside the UI forms to use the React `useTransition` hook:
    ```typescript
    const [isPending, startTransition] = useTransition();
    // Set buttons/inputs disabled when isPending is true
    ```
*   **Reset Password UI Form View:** Implement layout support when `mode === "resetPassword"`:
    *   Hide the Email field and social provider buttons.
    *   Display the **Password** (`newPassword`) and **Confirm Password** fields with the matching confirmation live validation message underneath.
    *   Submit button displays "Reset Password" and calls `adapter.resetPassword({ newPassword })` on submission.
    *   On success, switch mode back to `"login"` and display a success message notification.

---

## 5. Phase 4: Optional Capabilities

### Task 4.1: Create `packages/auth-drawer/src/ui/auth-provider.tsx`
Create the global state context component and `useAuth()` hook using the spec outlined in [ADVANCED_ADAPTER_SUGGESTIONS.md](file:///home/remcostoeten/dev/cozy-auth-drawer/ADVANCED_ADAPTER_SUGGESTIONS.md).

### Task 4.2: Create `packages/auth-drawer/src/adapters/mock.ts`
Implement the sandbox mock adapter from Section 2 of the advanced suggestions guide.

---

## 6. Verification & Build Steps
Verify execution with the following command sequence:
1.  Navigate to package directory: `cd packages/auth-drawer`
2.  Run typescript compilation check: `bun run typecheck`
3.  Run unit tests: `bun run test`
4.  Verify successful bundle build: `bun run build`
5.  Launch monorepo playground to test mock/live sessions: `bun run dev` (run from monorepo root)
