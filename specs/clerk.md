# Clerk Client Adapter Specification

This specification outlines the client-side integration architecture for **Clerk** authentication inside the `@remcostoeten/auth-drawer` package.

Clerk's client API is hook-based (`useSignIn`, `useSignUp`, `useUser`, etc.), so the adapter is a **factory function** that receives a pre-wired client object from your React component. The factory itself does not call hooks — your component does, then passes the results into `createClerkAdapter({ client })`.

---

## 1. Adapter Implementation

**`packages/auth-drawer/src/adapters/clerk.ts`**

```typescript
import type { AuthAdapter, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

type ClerkClient = {
  signIn?: {
    create?: (input: { identifier: string; password: string }) => Promise<unknown>;
    authenticateWithRedirect?: (input: {
      strategy: string;
      redirectUrl: string;
      redirectUrlComplete: string;
    }) => Promise<unknown>;
  };
  signUp?: {
    create?: (input: {
      emailAddress: string;
      password: string;
      firstName?: string;
    }) => Promise<unknown>;
  };
  signOut?: () => Promise<unknown>;
  useUser?: () => { user?: unknown; isLoaded?: boolean };
};

export interface ClerkAdapterOptions<TClient = unknown> {
  client: TClient;
  callbackURL?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
}

export function createClerkAdapter(options: ClerkAdapterOptions): AuthAdapter {
  // Maps Clerk signIn/signUp/signOut/useUser into the shared AuthAdapter contract.
}
```

---

## 2. Required Client Shape

Create the adapter inside a Client Component under `ClerkProvider`. Wire Clerk hooks into the `client` object before passing it to the factory:

```tsx
"use client";

import { useClerk, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";
import { useMemo } from "react";

export function Login() {
  const { signOut } = useClerk();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const adapter = useMemo(
    () =>
      createClerkAdapter({
        client: {
          signIn: {
            ...signIn,
            create: async (input) => {
              const result = await signIn?.create(input);
              if (result?.status === "complete" && result.createdSessionId) {
                await setSignInActive?.({ session: result.createdSessionId });
              }
              return result;
            },
            authenticateWithRedirect: signIn?.authenticateWithRedirect?.bind(signIn),
          },
          signUp: {
            ...signUp,
            create: async (input) => {
              const result = await signUp?.create(input);
              if (result?.status === "complete" && result.createdSessionId) {
                await setSignUpActive?.({ session: result.createdSessionId });
              }
              return result;
            },
          },
          signOut,
          useUser,
        },
        providers: ["github", "google"],
        callbackURL: "/dashboard",
        requireName: true,
      }),
    [signIn, signUp, signOut, setSignInActive, setSignUpActive],
  );

  return <AuthDrawer adapter={adapter} />;
}
```

The wrapper around `signIn.create` / `signUp.create` activates completed Clerk custom-flow sessions via `setActive`.

---

## 3. Options

| Option | Type | Default | Purpose |
|---|---|---|---|
| `client` | Clerk hook bundle | required | `signIn`, `signUp`, `signOut`, `useUser` wired from Clerk hooks |
| `callbackURL` | `string` | `"/"` | OAuth redirect target passed to `authenticateWithRedirect` |
| `providers` | `OAuthProvider[]` | `["github", "google"]` | OAuth buttons to render |
| `requireName` | `boolean` | `false` | Show the name field on sign-up |

---

## 4. Error Normalization

Clerk errors expose an `errors` array. The adapter maps common codes to drawer field targets:

| Clerk pattern | Target | `AuthErrorCode` |
|---|---|---|
| password incorrect | `"form"` | `invalid_credentials` |
| identifier not found | `"email"` | `user_not_found` |
| already exists | `"email"` | `email_taken` |
| password validation | `"password"` | `weak_password` |
| rate limit | `"form"` | `rate_limited` |

---

## 5. Usage Requirements

1. **Render under `ClerkProvider`** — Clerk hooks only work below Clerk's provider tree.
2. **Create the adapter in a Client Component** — hooks must run at the top level of a component, not inside the factory.
3. **Memoize the adapter** — rebuild when `signIn`, `signUp`, `signOut`, or `setActive` references change.

**`app.tsx` (Usage Example)**

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { Login } from "@/components/auth/clerk-login";

export default function App() {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <Login />
    </ClerkProvider>
  );
}
```
