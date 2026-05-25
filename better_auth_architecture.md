# Cozy Auth Drawer: Agnostic Architecture & Better Auth Adapter Design

To transition `@remcostoeten/auth-drawer` from a presentation-only component to an agnostic, plug-and-play authentication package, we can employ the **Adapter Pattern**. This separates visual design (theme, layout, animation, and trigger logic) from the target backend (Better Auth, Supabase, NextAuth, or custom JWT APIs).

Below is the complete architecture, focusing on a highly developer-friendly API.

---

## 1. System Architecture

The following diagram illustrates how the presentation layer interacts with different backends through a unified adapter interface:

```mermaid
graph TD
    subgraph Host Application
        UI[App Layout / Triggers]
        Client[Configured Auth Client e.g., authClient]
    end

    subgraph @remcostoeten/auth-drawer Package
        Drawer[AuthDrawer Component]
        TriggerStore[Trigger & Animation Store]
        AdapterContract[AuthAdapter Interface]
    end

    subgraph Adapters Module
        BAAdapter[betterAuthAdapter]
        SupaAdapter[supabaseAdapter]
        CustomAdapter[customAdapter]
    end

    %% Wiring
    UI -->|Render & Open| Drawer
    Drawer -->|Read state / Fire triggers| TriggerStore
    Drawer -->|Invoke Auth Actions| AdapterContract
    
    AdapterContract -.->|Implements| BAAdapter
    AdapterContract -.->|Implements| SupaAdapter
    AdapterContract -.->|Implements| CustomAdapter

    BAAdapter -->|Call API Methods| Client
```

---

## 2. Core Adapter Contract (`types.ts`)

The `AuthAdapter` acts as the interface between the drawer and the backend. It must capture standard auth operations, handle user sessions reactively, and advertise available features.

```typescript
export interface AuthResult<T = any> {
  success: boolean;
  data?: T | null;
  error?: AuthUiError | null;
}

export interface AuthSessionState {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    [key: string]: any; // Allow backend-specific custom fields
  } | null;
  session: any | null; // Raw session object
}

export interface AuthAdapter {
  id: string; // "better-auth" | "supabase" | "next-auth" | "custom"
  
  // Supported OAuth providers configured in the backend
  providers?: OAuthProvider[];

  // Core Authentication Operations
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp?: (input: CredentialAuthInput & { name: string }) => Promise<AuthResult>;
  signOut?: () => Promise<AuthResult>;

  // Password Recovery Operations
  requestPasswordReset?: (email: string) => Promise<AuthResult>;
  resetPassword?: (input: ResetPasswordInput) => Promise<AuthResult>;

  // Reactive Session Hook (optional - enables the drawer to show logged-in state/user profile)
  useSession?: () => {
    data: AuthSessionState | null;
    isPending: boolean;
    error: any;
  };

  // Feature flags for rendering extra tabs or actions (Magic Link, Passkeys, etc.)
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

  // Backend-specific error mapping
  normalizeError?: (error: unknown) => AuthUiError;
}
```

---

## 3. The Better Auth Adapter Implementation

Better Auth uses a `{ data, error }` return structure and handles session synchronization via secure cookies automatically. Below is the design for the first-party Better Auth adapter.

### Basic Implementation Structure

```typescript
import type { AuthAdapter, AuthResult, CredentialAuthInput } from "../types";
import { mapBetterAuthError } from "./errors";

export interface BetterAuthAdapterOptions<TClient = any> {
  /** The initialized client returned by `createAuthClient` */
  client: TClient;
  /** Custom fallback redirect URLs */
  callbackURL?: string;
  newUserCallbackURL?: string;
  /** Override the providers defined on the client */
  providers?: OAuthProvider[];
  /** Redirect URLs specifically for password reset links sent via email */
  passwordResetRedirectTo?: string;
}

export function betterAuthAdapter(options: BetterAuthAdapterOptions): AuthAdapter {
  const { client, callbackURL = "/", newUserCallbackURL, passwordResetRedirectTo } = options;

  // Derive providers from client config or fall back to custom definitions
  const providers = options.providers ?? client.options?.socialProviders ?? ["github", "google"];

  const adapter: AuthAdapter = {
    id: "better-auth",
    providers,

    // 1. Core Sign In (Email/Password or Social redirection)
    async signIn(input) {
      const { data, error } = await client.signIn.email({
        email: input.email,
        password: input.password,
        rememberMe: input.rememberMe,
        callbackURL,
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 2. Core Sign Up
    async signUp(input) {
      const { data, error } = await client.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
        callbackURL: newUserCallbackURL ?? callbackURL,
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 3. Sign Out
    async signOut() {
      const { error } = await client.signOut();
      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true };
    },

    // 4. Request Password Reset (using the updated non-deprecated API)
    async requestPasswordReset(email) {
      const { data, error } = await client.requestPasswordReset({
        email,
        redirectTo: passwordResetRedirectTo ?? `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: mapBetterAuthError(error) };
      }
      return { success: true, data };
    },

    // 5. Reactive Session Tracking
    useSession() {
      // Connect to Better Auth's reactive hook directly
      const session = client.useSession();
      return {
        data: session.data ? {
          user: session.data.user,
          session: session.data.session,
        } : null,
        isPending: session.isPending,
        error: session.error,
      };
    },

    // 6. Error normalizer export
    normalizeError: mapBetterAuthError,
  };

  // 7. Dynamic Feature Injection based on client plugins
  const features: Record<string, any> = {};

  // Detect Magic Link Plugin client presence
  if (typeof client.signIn?.magicLink === "function") {
    features.magicLink = {
      signIn: async (email: string) => {
        const { data, error } = await client.signIn.magicLink({
          email,
          callbackURL,
        });
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      }
    };
  }

  // Detect Email OTP Plugin client presence
  if (typeof client.emailOtp?.sendVerificationOtp === "function") {
    features.emailOtp = {
      sendVerificationOtp: async (email: string) => {
        const { data, error } = await client.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
        });
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      },
      signIn: async (email: string, otp: string) => {
        const { data, error } = await client.signIn.emailOtp({
          email,
          otp,
          callbackURL,
        });
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      }
    };
  }

  // Detect Anonymous Login Plugin presence
  if (typeof client.signIn?.anonymous === "function") {
    features.anonymous = {
      signIn: async () => {
        const { data, error } = await client.signIn.anonymous();
        if (error) return { success: false, error: mapBetterAuthError(error) };
        return { success: true, data };
      }
    };
  }

  if (Object.keys(features).length > 0) {
    adapter.features = features;
  }

  return adapter;
}
```

---

## 4. Error Mapping Schema

Better Auth provides structured HTTP statuses and machine-readable `code` keys. Here is how they map to our local `AuthUiError` shape:

| Better Auth Code | Better Auth Status | Target UI Placement | local `AuthErrorCode` |
|---|---|---|---|
| `INVALID_EMAIL_OR_PASSWORD` | 401 / 422 | `"form"` (generic alert) | `invalid_credentials` |
| `USER_ALREADY_EXISTS` | 422 | `"email"` (under field) | `email_taken` |
| `INVALID_EMAIL` | 422 | `"email"` (under field) | `invalid_email` |
| `INVALID_PASSWORD` | 422 | `"password"` (under field) | `weak_password` |
| `EMAIL_NOT_VERIFIED` | 403 | `"form"` (generic alert) | `email_not_verified` |
| `USER_NOT_FOUND` | 404 | `"email"` | `user_not_found` |

### Normalizer Code Example

```typescript
import type { AuthUiError, AuthErrorCode } from "../types";

export function mapBetterAuthError(rawError: any): AuthUiError {
  const code = rawError?.code;
  const status = rawError?.status;
  const message = rawError?.message ?? "Authentication failed. Please try again.";

  let uiCode: AuthErrorCode = "unknown";
  let target: AuthUiError["target"] = "form";

  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      uiCode = "invalid_credentials";
      target = "form";
      break;
    case "USER_ALREADY_EXISTS":
      uiCode = "email_taken";
      target = "email";
      break;
    case "INVALID_EMAIL":
      uiCode = "invalid_email";
      target = "email";
      break;
    case "INVALID_PASSWORD":
      uiCode = "weak_password";
      target = "password";
      break;
    case "EMAIL_NOT_VERIFIED":
      uiCode = "email_not_verified";
      target = "form";
      break;
    case "USER_NOT_FOUND":
      uiCode = "user_not_found";
      target = "email";
      break;
    default:
      if (status && status >= 500) {
        uiCode = "server_error";
      } else if (status === 429) {
        uiCode = "rate_limited";
      }
      break;
  }

  return {
    code: uiCode,
    message,
    target,
    cause: rawError,
    retryable: status === 429 || (status && status >= 500),
  };
}
```

---

## 5. End-User React API Comparison

Here is how the API interface looks under different integration scenarios.

### Scenario A: Zero Configuration (Simple Email + Social Auth)
The component automatically configures form handling, triggers, loading states, and social sign-in redirection:

```tsx
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { betterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
import { authClient } from "@/lib/auth-client";

const adapter = betterAuthAdapter({ client: authClient });

export default function LoginDrawer() {
  return <AuthDrawer adapter={adapter} />;
}
```

### Scenario B: Dynamic Capabilities (Detects Magic Link & OTP)
If the user passes an `authClient` loaded with `@better-auth/magic-link`, the adapter detects the `magicLink` functions on the client. The `AuthDrawer` dynamically updates its UI to show "Sign in with Magic Link" alongside the standard Email/Password tab:

```tsx
// 1. client definition with plugins
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

// 2. Drawer Component Setup
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { betterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
import { authClient } from "@/lib/auth-client";

// The adapter detects magicLink automatically!
const adapter = betterAuthAdapter({ client: authClient });

export default function LoginDrawer() {
  return (
    <AuthDrawer 
      adapter={adapter}
      ui={{
        auth: {
          // If the client supports magic links, we can configure preference here
          initialMode: "magic-link", 
        }
      }}
    />
  );
}
```

### Scenario C: Custom JWT Backend Implementation
If a developer isn't using a supported auth framework, they can create a custom adapter without importing external modules:

```tsx
import { AuthDrawer, createAdapter } from "@remcostoeten/auth-drawer";

const customAdapter = createAdapter({
  id: "custom-api",
  providers: ["github"],
  
  signIn: async ({ email, password }) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    
    if (!res.ok) {
      return { 
        success: false, 
        error: { code: "invalid_credentials", target: "form", message: "Bad login" } 
      };
    }
    return { success: true };
  },
  
  // Custom sign-up handler
  signUp: async ({ email, password, name }) => {
    // custom fetch logic...
    return { success: true };
  }
});

export default function CustomLoginDrawer() {
  return <AuthDrawer adapter={customAdapter} />;
}
```
