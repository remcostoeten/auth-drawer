# Auth Drawer API

This is the current public component and prop structure for `@remcostoeten/auth-drawer`.
See [CHANGELOG.md](./packages/auth-drawer/CHANGELOG.md) for version history.

## Entry Points

Everything is imported directly from the published package:

```ts
import {
  AuthDrawer,
  AuthProvider,
  useAuth,
  useOptionalAuth,
  DEFAULT_CONFIG,
  createAuthTriggerStore,
  useScrollOpenTrigger,
} from "@remcostoeten/auth-drawer";
import type {
  AuthBackdropConfig,
  AuthConfigGroup,
  AuthConfig,
  AuthUiConfig,
  AuthTriggerConfig,
  AuthTriggerEvent,
  AuthTriggerStore,
  DrawerMode,
  DrawerPosition,
  OAuthProvider,
  AuthVisualConfig,
} from "@remcostoeten/auth-drawer";
```

Adapter factories are imported from their own subpaths, e.g.
`@remcostoeten/auth-drawer/adapters/better-auth`.

## Component

```tsx
<AuthDrawer
  adapter={authAdapter}
  config={config}
  className="..."
  hideTrigger={false}
  open={open}
  defaultOpen={false}
  onOpenChange={setOpen}
  triggerStore={triggerStore}
/>
```

### Props

```typescript
type AuthDrawerProps = {
  adapter: AuthAdapter;
  config?: AuthConfig;
  className?: string;
  hideTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerStore?: AuthTriggerStore;
  onSuccess?: (action: "signIn" | "signUp" | "signOut" | "oauth") => void;
  onError?: (error: AuthUiError, action: "signIn" | "signUp" | "signOut" | "oauth") => void;
};
```

| Prop | Type | Default | Description & Integration Tooltip |
| :--- | :--- | :--- | :--- |
| **`adapter`** | `AuthAdapter` | Required | **The authentication client bridge.** Connects the UI to engines like Supabase, Better Auth, Clerk, NextAuth, Firebase, or custom JWT/REST. Automatically overrides layout flags based on supported adapter features (e.g. hides the Register tab if the adapter doesn't implement `signUp`). |
| **`config`** | `AuthConfig` | `DEFAULT_CONFIG` | **Behavioral & visual theme configuration.** Customizes layout styles, Framer Motion properties, label/error copy, and active triggers (scroll, delay, idle). |
| **`className`** | `string` | `""` | CSS classes applied directly to the default built-in floating/inline trigger button. |
| **`hideTrigger`** | `boolean` | `false` | **Hides the built-in trigger button.** Enable this if you want to open the drawer exclusively from your own custom elements (e.g., custom header, route guards, paywall blockers, or CTA buttons). |
| **`open`** | `boolean` | `undefined` | **Controlled state driver.** Drives the drawer's visual status from the host application. If provided, it takes precedence over provider-managed and uncontrolled state, and you must update it from `onOpenChange`. |
| **`defaultOpen`** | `boolean` | `false` | **Uncontrolled initial state.** Sets the default open state on initial render. Only used if the `open` prop is left undefined. |
| **`onOpenChange`** | `(open: boolean) => void` | `undefined` | **State change callback.** Fires whenever the drawer transitions between open/closed states. Triggers on drag-to-dismiss, backdrop click, Escape keypress, or close button click. |
| **`triggerStore`** | `AuthTriggerStore` | `undefined` | **Agnostic trigger ledger.** Connects external/non-React code (e.g., canvas renderers, router events, third-party libraries) to the drawer's activation listener. |
| **`onSuccess`** | `(action) => void` | `undefined` | **Successful authentication callback.** Fired on any completed auth action (e.g., credentials login, registration, social callback). Perfect for performing route transitions, toast displays, or state syncs. |
| **`onError`** | `(error, action) => void` | `undefined` | **Failed action callback.** Fired when any credential check, signup, or social attempt fails. Useful for analytics tracking or logging. |

### Provider-controlled drawer

`AuthProvider` exposes session state and drawer controls through `useAuth()`. If
`AuthDrawer` is rendered inside the provider and you do not pass `open` or
`onOpenChange`, the drawer follows `useAuth().openDrawer()` /
`useAuth().closeDrawer()` and reuses the provider's adapter-backed session state.

```tsx
import { AuthDrawer, AuthProvider, useAuth } from "@remcostoeten/auth-drawer";

function HeaderButton() {
  const { openDrawer } = useAuth();
  return <button onClick={openDrawer}>Sign in</button>;
}

function AppShell({ adapter, children }) {
  return (
    <AuthProvider adapter={adapter}>
      <HeaderButton />
      {children}
      <AuthDrawer adapter={adapter} hideTrigger />
    </AuthProvider>
  );
}
```

Pass `open` and `onOpenChange` when you need explicit host-owned state instead;
those props take precedence over provider-managed state.

### Hooks

```typescript
type AuthContextValue = {
  user: AuthUser | null;
  session: unknown | null;
  isPending: boolean;
  error: unknown | null;
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp?: (input: CredentialAuthInput & { name: string }) => Promise<AuthResult>;
  signInWithOAuth?: (provider: OAuthProvider) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
};
```

| Hook | Returns | Notes |
| :--- | :--- | :--- |
| **`useAuth()`** | `AuthContextValue` | Reads adapter-backed session state and drawer controls. **Throws** if called outside an `AuthProvider`. |
| **`useOptionalAuth()`** | `AuthContextValue \| null` | Same value as `useAuth()`, but returns `null` instead of throwing when no `AuthProvider` is mounted. Use it in shared/reusable components that may render with or without the provider. |

`signUp` and `signInWithOAuth` are only present when the active adapter
implements them, mirroring the drawer's own feature detection.

```tsx
import { useOptionalAuth } from "@remcostoeten/auth-drawer";

function AccountBadge() {
  const auth = useOptionalAuth();
  if (!auth?.user) return null;
  return <span>{auth.user.email}</span>;
}
```

## Config

```ts
type AuthConfig = {
  ui?: AuthUiConfig;
  triggers?: AuthTriggerConfig;
  normalizeError?: AuthErrorNormalizer;
};
```

Use `ui.*` for everything that changes how the auth surface renders. Use `triggers.*` for rules that open the surface.

`ui.auth.providers` may be an empty array to disable OAuth entirely. At render time
the drawer resolves OAuth buttons with
`adapter.providers ?? config.ui.auth.providers ?? DEFAULT_CONFIG.ui.auth.providers`
(when the adapter implements `signInWithOAuth`). Pass `providers` on the adapter
factory (e.g. `createBetterAuthAdapter({ providers: [] })`) or keep both lists in
sync — config alone cannot hide OAuth if the adapter still advertises providers.

Defaults come from `DEFAULT_CONFIG`.

Current defaults:

```ts
{
  ui: {
    auth: {
      providers: ["github", "google"],
      oauthLayout: "column",
      allowRegister: true,
      showRememberMe: true,
      initialMode: "login",
      showForgotPassword: true,
      showLivePasswordMatch: true,
      emailAutocomplete: {
        enabled: true,
        domains: ["gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com"],
      },
    },
    presentation: {
      variant: "drawer",
      defaultOpen: false,
    },
    visual: {
      backdrop: {
        color: "#070708",
        opacity: 0.85,
        blur: 6,
        gradient: {
          angle: 180,
          from: "transparent",
          to: "#070708",
          fromPos: 100,
          toPos: 100,
        },
      },
    },
    motion: {
      displayMode: "drawer",
      desktopWidth: "448px",
      desktopPosition: "center",
      // plus drag, entry, exit, backdrop motion, and form layout settings
    },
  },
  triggers: {}
}
```

### CSS theme tokens

The package ships CSS variables for the overlay theme. Override the existing HSL
component tokens in your app CSS; there is no `cad-*` theme API.

```css
:root {
  --surface-overlay: 34 12% 82%;
  --text-on-overlay: 24 18% 14%;
  --border-overlay: 28 12% 54%;
}

.dark {
  --surface-overlay: 0 0% 7.5%;
  --text-on-overlay: 0 0% 96%;
  --border-overlay: 0 0% 100%;
}
```

## Auth Adapter

```ts
type AuthAdapter = {
  id: string;
  providers?: OAuthProvider[];
  requiresName?: boolean;
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp?: (input: CredentialAuthInput & { name: string }) => Promise<AuthResult>;
  signOut?: () => Promise<AuthResult>;
  signInWithOAuth?: (provider: string) => Promise<AuthResult>;
  requestPasswordReset?: (email: string) => Promise<AuthResult>;
  resetPassword?: (input: ResetPasswordInput) => Promise<AuthResult>;
  useSession: () => {
    data: AuthSessionState | null;
    isPending: boolean;
    error: unknown;
  };
  normalizeError?: (error: unknown) => AuthUiError;
  onSuccess?: (action: "signIn" | "signUp" | "signOut" | "oauth") => void;
  onError?: (
    error: AuthUiError,
    action: "signIn" | "signUp" | "signOut" | "oauth",
  ) => void;
};

type AuthErrorNormalizer = (
  error: unknown,
  context: {
    provider?: OAuthProvider;
    fallbackTarget?: AuthUiError["target"];
  },
) => AuthUiError;
```

Credential sign-in receives:

```ts
type CredentialAuthInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};
```

Reset password submit receives:

```ts
type ResetPasswordInput = {
  newPassword: string;
};
```

Current behavior:

- `adapter.signIn` runs after local email/password validation passes.
- `adapter.signUp` is required to show registration.
- `adapter.signInWithOAuth` is required to show OAuth provider buttons.
- `adapter.requestPasswordReset` is required to show the forgot-password action.
- `adapter.resetPassword` receives a `ResetPasswordInput` with the new password.
- `adapter.useSession` is called once at the top of the drawer to suppress prompts for authenticated users.
- Adapter action failures should return `{ success: false, error }`.
- Thrown errors are passed through `adapter.normalizeError` or `config.normalizeError`.
- On successful sign-in, sign-up, or OAuth, the drawer closes.
- When the resolved provider list is empty (see precedence above), the OAuth button
  group and divider are omitted.

## Error Shape

```ts
type AuthUiError = {
  code: AuthErrorCode;
  message: string;
  target: "email" | "password" | "confirmPassword" | "form" | "oauth";
  provider?: OAuthProvider;
  retryable?: boolean;
  cause?: unknown;
};
```

Current error codes:

```ts
type AuthErrorCode =
  | "required"
  | "invalid_email"
  | "weak_password"
  | "password_mismatch"
  | "invalid_credentials"
  | "email_not_verified"
  | "email_taken"
  | "user_not_found"
  | "provider_unavailable"
  | "oauth_cancelled"
  | "popup_blocked"
  | "rate_limited"
  | "network_error"
  | "server_error"
  | "unknown";
```

The default normalizer accepts strings, objects with `code/status/message`, and nested `{ error }` objects.

## Email Autocomplete

The email field supports inline domain completion when the user types `@`. This is configurable via `ui.auth.emailAutocomplete`.

```ts
type EmailAutocompleteConfig = {
  /** Toggle the autocomplete feature on or off. Defaults to true. */
  enabled?: boolean;
  /** Custom domain list. Falls back to built-in defaults when omitted. */
  domains?: string[];
};
```

Built-in domains: `gmail.com`, `outlook.com`, `hotmail.com`, `icloud.com`, `yahoo.com`.

### Examples

Disable autocomplete entirely:

```ts
const config = {
  ui: {
    auth: {
      emailAutocomplete: { enabled: false },
    },
  },
};
```

Use a custom corporate domain list:

```ts
const config = {
  ui: {
    auth: {
      emailAutocomplete: {
        enabled: true,
        domains: ["company.com", "corp.company.com", "gmail.com"],
      },
    },
  },
};
```

## Supported Values

```ts
type OAuthProvider = "github" | "google" | "apple" | "discord" | "tiktok";
type DrawerMode = "drawer" | "modal";
type DrawerPosition = "center" | "left" | "right";
type FormMode = "login" | "register" | "resetPassword";
```

## Trigger Config

```ts
type AuthTriggerConfig = {
  pageLoad?: PageLoadTriggerConfig;
  click?: ClickTriggerConfig;
  state?: StateTriggerConfig;
  scrollOpen?: ScrollOpenTriggerConfig;
  idle?: IdleTriggerConfig;
  custom?: CustomTriggerConfig;
};

type TriggerPolicy = {
  once?: boolean;
  cooldownMs?: number;
  scope?: "session" | "day" | "week" | "install";
  every?: number;
  sampleRate?: number;
};

type PageLoadTriggerConfig = TriggerPolicy & {
  delayMs?: number;
};

type ScrollOpenTriggerConfig = TriggerPolicy & {
  threshold?: number;
  container?: "self" | "page";
};

type ClickTriggerConfig = TriggerPolicy & {
  selector?: string;
  event?: "click" | "pointerdown";
};

type StateTriggerConfig = TriggerPolicy & {
  state: "denied" | "expired" | "missing";
};

type IdleTriggerConfig = TriggerPolicy & {
  idleMs: number;
};

type CustomTriggerConfig = TriggerPolicy & {
  event: string;
};
```

## Trigger Usage

Triggers split into two roles:

1. **Config** (`config.triggers.*`) — declare which rules are active and their policy.
2. **Events** (`triggerStore.emit(...)`) — tell the store that something happened.

`AuthDrawer` creates or accepts a trigger store, registers every configured rule, and opens the surface when the store decides a rule should fire.

### Built-in vs emit-only

| Trigger | Config key | Who emits? |
| :--- | :--- | :--- |
| Page load | `triggers.pageLoad` | `AuthDrawer` on mount (respects `delayMs`) |
| Click | `triggers.click` | `AuthDrawer` when `selector` matches a document event |
| Scroll | `triggers.scrollOpen` | Host app — usually `useScrollOpenTrigger` + `emit` |
| Auth state | `triggers.state` | Host app — API clients, route guards, session checks |
| Idle | `triggers.idle` | Host app — your idle detector |
| Custom | `triggers.custom` | Host app — any named channel you define |

`pageLoad` and `click` can work without a shared store if you pass no `triggerStore` prop — `AuthDrawer` creates one internally. For scroll, state, idle, and custom rules, create one store and pass it to both the drawer and the code that emits events.

### Shared store wiring

```tsx
import {
  AuthDrawer,
  createAuthTriggerStore,
  useScrollOpenTrigger,
  type AuthConfig,
} from "@remcostoeten/auth-drawer";
import { useMemo, useRef } from "react";

const triggerStore = createAuthTriggerStore();

const config: AuthConfig = {
  triggers: {
    pageLoad: { delayMs: 800, once: true },
    scrollOpen: { threshold: 0.25, once: true, cooldownMs: 30_000 },
    state: { state: "expired", once: true },
    custom: { event: "paywall:blocked", scope: "session" },
  },
};

function ArticlePaywall() {
  const articleRef = useRef<HTMLDivElement>(null);

  useScrollOpenTrigger({
    containerRef: articleRef,
    threshold: config.triggers?.scrollOpen?.threshold ?? 0.25,
    once: config.triggers?.scrollOpen?.once ?? true,
    enabled: Boolean(config.triggers?.scrollOpen),
    onTrigger: (progress) => {
      triggerStore.emit({
        kind: "scrollOpen",
        progress,
        threshold: config.triggers?.scrollOpen?.threshold,
        container: "self",
      });
    },
  });

  return (
    <>
      <div ref={articleRef}>{/* scrollable article */}</div>
      <AuthDrawer config={config} triggerStore={triggerStore} hideTrigger />
    </>
  );
}
```

### Emit examples

```ts
// Session expired after a 401
triggerStore.emit({
  kind: "state",
  state: "expired",
  reason: "session-expired",
});

// User hit a canvas or router paywall
triggerStore.emit({
  kind: "custom",
  event: "paywall:blocked",
  payload: { layer: "comments" },
});

// Idle detector crossed the configured threshold
triggerStore.emit({
  kind: "idle",
  idleMs: 60_000,
});
```

### TriggerPolicy

Every trigger kind extends `TriggerPolicy`:

- **`once`** — fire at most once per scope bucket.
- **`cooldownMs`** — minimum time between firings.
- **`scope`** — eligibility bucket: `session` (in-memory), `day`, `week`, or `install` (localStorage).
- **`every`** — fire only on every Nth matching event.
- **`sampleRate`** — random gate between `0` and `1`.

`scrollOpen.once` defaults to `true` when omitted. Other kinds default `once` to `false`.

### AuthTriggerEvent

Events emitted into the store:

```ts
type AuthTriggerEvent =
  | { kind: "pageLoad"; source?: "mount" | "manual" }
  | {
      kind: "click";
      selector?: string;
      event?: "click" | "pointerdown";
      target?: EventTarget | null;
    }
  | {
      kind: "state";
      state: "denied" | "expired" | "missing";
      reason?: string;
      payload?: unknown;
    }
  | {
      kind: "scrollOpen";
      progress: number;
      threshold?: number;
      container?: "self" | "page";
    }
  | { kind: "idle"; idleMs: number }
  | { kind: "custom"; event: string; payload?: unknown };
```

Matching rules:

- **`scrollOpen`** — fires when `event.progress >= config.threshold` (default `0.25`).
- **`state`** — fires when `event.state === config.state`.
- **`idle`** — fires when `event.idleMs >= config.idleMs`.
- **`custom`** — fires when `event.event === config.event`.
- **`click`** — fires when selector/event match; if `config.selector` is set, the target must match.

### Store API

```ts
const store = createAuthTriggerStore({
  namespace?: string;      // default: "auth-drawer"
  storage?: AuthTriggerStorage;
  now?: () => number;
  random?: () => number;
});

store.registerTrigger(kind, config, onFire); // used internally by AuthDrawer
store.emit(event);
store.subscribe(listener);
store.snapshot(); // seenCounts, fireCounts, lastSeenAt, lastFiredAt
store.clear(kind?);
```

Use `createAuthTriggerStore()` when a scene or host app needs to emit trigger events into the drawer from outside React props — for example paywall scenes, router middleware, or vanilla DOM blockers.

### useScrollOpenTrigger

```ts
useScrollOpenTrigger({
  containerRef,
  onTrigger: (progress) => void,
  threshold?: number;   // default 0.25
  once?: boolean;       // default true
  enabled?: boolean;    // default true
});
```

The hook observes normalized scroll progress on `containerRef` and calls `onTrigger` when the threshold is crossed. Pair it with `triggerStore.emit({ kind: "scrollOpen", progress, ... })` so cooldown, scope, and sampling policy stay centralized in the store.

## Lab Usage

The debug lab currently uses the same public `AuthConfig` contract. It supplies fake auth handlers through `createScenarioHandlers`, then renders:

```tsx
<AuthDrawer
  config={config}
  triggerStore={triggerStore}
  open={isDrawerOpen}
  onOpenChange={setDrawerOpen}
/>
```

For custom blocker scenes, the lab uses `hideTrigger` and opens the controlled auth surface from scene-owned buttons:

```tsx
<AuthDrawer
  config={config}
  triggerStore={triggerStore}
  hideTrigger
  open={isDrawerOpen}
  onOpenChange={setDrawerOpen}
/>
```

The playground now exposes the full practical `ui` namespace: auth flags, presentation, visual backdrop, motion/layout/animation controls, plus page-load and scroll trigger controls.
