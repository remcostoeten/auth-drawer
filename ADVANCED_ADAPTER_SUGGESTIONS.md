# Advanced Auth Drawer Architecture: Context, Mocking, Async Lifecycles, and Styling

This document details advanced architectural improvements for the `@remcostoeten/auth-drawer` package. These recommendations expand the drawer into a complete auth state ecosystem, introduce local sandbox support, optimize runtime state updates, and provide styling isolation with deep customization options.

---

## 1. Global Auth Provider Context

By wrapping adapters inside a React Context, we decouple session state from the drawer UI. This allows other elements in the host application (navbars, route guards, action buttons) to access auth status without directly importing backend SDKs.

```
                  ┌───────────────────────┐
                  │      AuthProvider     │ <──[Receives Adapter]
                  └───────────┬───────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  Navbar UI   │     │  AuthDrawer  │     │ ProtectedBtn │
  │  (useAuth)   │     │  (useAuth)   │     │  (useAuth)   │
  └──────────────┘     └──────────────┘     └──────────────┘
```

### Context Implementation (`AuthProvider.tsx`)

```typescript
import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { AuthAdapter, AuthSessionState, AuthResult, AuthUiError } from "./types";

/**
 * Interface representing the complete properties exposed by the useAuth hook.
 */
interface AuthContextType {
  /** The current user profile info, or null if unauthenticated. */
  user: AuthSessionState["user"] | null;
  /** The raw session data returned from the backend client. */
  session: any | null;
  /** Loading flag representing active auth session check operations. */
  isPending: boolean;
  /** Error payload returned if fetching session state failed. */
  error: any;
  /** Invokes credentials/social signIn on the active adapter. */
  signIn: AuthAdapter["signIn"];
  /** Invokes credentials registration on the active adapter. */
  signUp: AuthAdapter["signUp"];
  /** Invokes OAuth social sign-in on the active adapter. */
  signInWithOAuth: AuthAdapter["signInWithOAuth"];
  /** Invokes session revocation on the active adapter. */
  signOut: () => Promise<void>;
  /** Triggers the Auth Drawer UI to open state. */
  openDrawer: () => void;
  /** Triggers the Auth Drawer UI to close state. */
  closeDrawer: () => void;
  /** Current drawer visual open/close status. */
  isDrawerOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  /** Any backend adapter conforming to the AuthAdapter interface (e.g., Supabase, Better Auth). */
  adapter: AuthAdapter;
  /** App structure children that can use useAuth context. */
  children: ReactNode;
  /** Called after any successful auth action. */
  onSuccess?: (action: "signIn" | "signUp" | "signOut" | "oauth") => void;
  /** Called after any failed auth action. */
  onError?: (error: AuthUiError, action: "signIn" | "signUp" | "signOut" | "oauth") => void;
}

/**
 * Global React wrapper providing real-time session mapping and Drawer controller API.
 *
 * NOTE: This component calls `adapter.useSession()` internally, which is a React hook.
 * The adapter's useSession method MUST follow the Rules of Hooks — it is called
 * unconditionally at the top level of this component.
 */
export function AuthProvider({ adapter, children, onSuccess, onError }: AuthProviderProps) {
  // Hook into adapter's reactive session hook (called unconditionally — Rules of Hooks)
  const { data, isPending, error } = adapter.useSession?.() ?? {
    data: null,
    isPending: false,
    error: null,
  };

  // Control Drawer visual open/close state globally
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const value = useMemo(() => ({
    user: data?.user ?? null,
    session: data?.session ?? null,
    isPending,
    error,
    signIn: adapter.signIn,
    signUp: adapter.signUp,
    signInWithOAuth: adapter.signInWithOAuth,
    signOut: async () => {
      if (adapter.signOut) {
        await adapter.signOut();
        onSuccess?.("signOut");
      } else if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
    isDrawerOpen,
  }), [data, isPending, error, adapter, isDrawerOpen, onSuccess, onError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Consumes global auth state session variables, triggers, and drawer controls.
 * @throws Error if used outside of a configured AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

---

## 2. Built-in Sandbox Mocking (`mockAdapter.ts`)

To allow developers to design, build, and test UI styling or mock edge cases locally without connecting a database or cloud instance, package a first-party `mockAdapter`.

```typescript
import { useState } from "react";
import type { AuthAdapter, AuthResult } from "./types";
import { createAdapterError } from "./errors";

/**
 * Configuration options to control simulated behavior of the mock adapter.
 */
interface MockAdapterOptions {
  /** The latency duration in milliseconds to simulate network lag. Default: 800ms. */
  latencyMs?: number;
  /** Mock email required for successful logins. Default: "admin@example.com". */
  mockEmail?: string;
  /** Mock password required for successful logins. Default: "password". */
  mockPassword?: string;
}

/**
 * Factory returning a mock auth adapter conforming to the AuthAdapter interface.
 * Useful for playground sandboxes, testing loading states, and checking UI validation errors.
 */
export function mockAdapter(options: MockAdapterOptions = {}): AuthAdapter {
  const { latencyMs = 800, mockEmail = "admin@example.com", mockPassword = "password" } = options;

  let isAuthenticated = false;

  const wait = () => new Promise((resolve) => setTimeout(resolve, latencyMs));

  return {
    id: "mock",
    providers: ["github", "google", "discord"],

    async signIn({ email, password }) {
      await wait();

      // Test validation trigger
      if (password === "wrong") {
        return {
          success: false,
          error: {
            code: "invalid_credentials",
            target: "form",
            message: "Invalid email or password combination (Mock error).",
          },
        };
      }

      // Test rate limit simulation
      if (email === "spam@example.com") {
        return {
          success: false,
          error: {
            code: "rate_limited",
            target: "form",
            message: "Too many attempts. Please try again later.",
          },
        };
      }

      isAuthenticated = true;
      return { success: true };
    },

    async signUp({ email, password }) {
      await wait();
      if (email === mockEmail) {
        return {
          success: false,
          error: {
            code: "email_taken",
            target: "email",
            message: "This email address is already in use.",
          },
        };
      }
      return { success: true };
    },

    async signOut() {
      await wait();
      isAuthenticated = false;
      return { success: true };
    },

    // Return static reactive session mock
    useSession() {
      const [isPending, setIsPending] = useState(false);
      const data = isAuthenticated
        ? {
            user: { id: "mock-user-123", email: "admin@example.com", name: "Mock User" },
            session: { id: "mock-sess-456" },
          }
        : null;

      return { data, isPending, error: null };
    },
  };
}
```

---

## 3. Decoupling State via Async Transitions

In modern React (React 19 / Next.js 15), instead of tracking local state like `const [loading, setLoading] = useState(false)` across input actions, you should decouple execution states using async **transitions**. 

By returning promises from the adapter functions, the Drawer UI component handles loaders cleanly:

```tsx
import { useTransition, useState, FormEvent } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Standard email-password login form illustrating useTransition hook consumption.
 */
export function CredentialForm() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // React hook manages pending states during the Promise resolution
  const [isPending, startTransition] = useTransition();

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      setError(null);
      const result = await signIn({ email, password, rememberMe: true });
      
      if (!result.success && result.error) {
        setError(result.error.message);
      }
    });
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <input name="email" type="email" disabled={isPending} required />
      <input name="password" type="password" disabled={isPending} required />
      
      {error && <div className="error-banner">{error}</div>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

## 4. Styling Isolation & Class Collision Prevention

When publishing components using Tailwind CSS to NPM, a common risk is utility class collision with the host application. If the host application defines different spacing rules or overrides default tailwind behavior, the Cozy Auth Drawer layout will break.

### The Prefix Strategy
To isolate your styles, define a unique prefix in the library's local Tailwind configuration:

```javascript
// tailwind.config.js (packaged inside @remcostoeten/auth-drawer)
module.exports = {
  prefix: 'cad-', // Cozy Auth Drawer prefix
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
       // ...
    }
  }
}
```

Your components will use prefixed class names:
```tsx
// Isolate structure and layout styles
<div className="cad-flex cad-items-center cad-justify-center cad-rounded-lg" />
```

This prevents conflict even if the developer has a globally overridden class name matching standard Tailwind defaults.

---

## 5. Theme Customization: CSS Custom Properties (Variables)

To give developers total control over branding colors (buttons, inputs, borders, text, backgrounds) without writing complex Tailwind override chains, map Tailwind styles to **CSS custom variables**.

### Step A: Define semantic tokens in your core CSS file
```css
/* dist/styles.css */
.cad-theme-root {
  --cad-background: #070708;
  --cad-foreground: #ffffff;
  
  --cad-primary: #6366f1;
  --cad-primary-foreground: #ffffff;
  
  --cad-input-bg: #111113;
  --cad-input-border: #27272a;
  --cad-input-focus: #6366f1;
  
  --cad-text-muted: #a1a1aa;
}
```

### Step B: Map variables in your local Tailwind Configuration
```javascript
// tailwind.config.js (packaged config)
module.exports = {
  prefix: 'cad-',
  theme: {
    extend: {
      colors: {
        background: 'var(--cad-background)',
        foreground: 'var(--cad-foreground)',
        primary: {
          DEFAULT: 'var(--cad-primary)',
          foreground: 'var(--cad-primary-foreground)',
        },
        input: {
          bg: 'var(--cad-input-bg)',
          border: 'var(--cad-input-border)',
          focus: 'var(--cad-input-focus)',
        },
        muted: 'var(--cad-text-muted)',
      }
    }
  }
}
```

Inside your component, reference them cleanly:
```tsx
// This evaluates to bg-[var(--cad-primary)] text-[var(--cad-primary-foreground)]
<button className="cad-bg-primary cad-text-primary-foreground cad-px-4 cad-py-2" />
```

### Step C: End-User Customization Paths

End-users can now customize the theme dynamically in two ways:

#### Option 1: Global CSS Override
Developers can easily customize the styles inside their own stylesheets:
```css
/* App.css (Host Application) */
.cad-theme-root {
  --cad-primary: #ec4899; /* Changes all primary buttons/highlights to pink */
  --cad-input-bg: #09090b;
}
```

#### Option 2: Inline React Theme Props
By providing a simple `theme` configuration object, the package can map it to CSS custom properties dynamically using inline styling objects:

```typescript
import { CSSProperties } from "react";

/**
 * Developer theme override configuration options.
 */
export interface AuthDrawerThemeConfig {
  /** Hex or CSS color string for background canvas. */
  background?: string;
  /** Primary action button background color. */
  primary?: string;
  /** Primary action button text color. */
  primaryForeground?: string;
  /** Input field background color. */
  inputBg?: string;
  /** Input border line color. */
  inputBorder?: string;
  /** Input focus indicator color. */
  inputFocus?: string;
}

import { AuthDrawer } from "@remcostoeten/auth-drawer";

export default function App() {
  return (
    <AuthDrawer 
      theme={{
        primary: "#10b981",          // Emerald primary buttons
        background: "#09090b",       // Darker background
        inputBorder: "#3f3f46",      // Zinc-700 border
      }}
    />
  );
}
```

**Implementation inside `AuthDrawer` container wrapper:**
```typescript
const themeStyles = theme ? {
  "--cad-primary": theme.primary,
  "--cad-background": theme.background,
  "--cad-input-border": theme.inputBorder,
} as CSSProperties : {};

return (
  <div style={themeStyles} className="cad-theme-root">
     {/* Drawer UI components */}
  </div>
);
```
