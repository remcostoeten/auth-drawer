# Auth Drawer API

This is the current public component and prop structure.

## Entry Points

The local public wrapper is:

```ts
import { AuthDrawer, DEFAULT_CONFIG } from "@/components/auth/auth-drawer";
import type {
  AuthBackdropConfig,
  AuthConfigGroup,
  AuthConfig,
  AuthUiConfig,
  AuthTriggerConfig,
  AuthTriggerStore,
  DrawerMode,
  DrawerPosition,
  OAuthProvider,
  AuthVisualConfig,
} from "@/components/auth/auth-drawer";
```

Internally that re-exports from `@remcostoeten/auth-drawer`.

## Component

```tsx
<AuthDrawer
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

```ts
type AuthDrawerProps = {
  config?: AuthConfig;
  className?: string;
  hideTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerStore?: AuthTriggerStore;
};
```

- `config` controls UI, activation triggers, and auth handlers.
- `className` is applied to the trigger button.
- `hideTrigger` hides the built-in Account trigger for controlled integrations with custom blockers, paywalls, or nav buttons.
- `open` makes the drawer controlled.
- `defaultOpen` is used only for uncontrolled mode.
- `onOpenChange` fires when the drawer opens or closes.
- `triggerStore` lets app code or scene components share a central trigger ledger with the drawer.

## Config

```ts
type AuthConfig = {
  ui?: AuthUiConfig;
  triggers?: AuthTriggerConfig;
} & AuthHandlers;
```

Use `ui.*` for everything that changes how the auth surface renders. Use `triggers.*` for rules that open the surface.

`ui.auth.providers` may be an empty array to disable OAuth entirely.

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

## Auth Handlers

```ts
type AuthHandlers = {
  onCredential?: (input: CredentialAuthInput) => Promise<void>;
  onOAuth?: (provider: OAuthProvider) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  normalizeError?: (
    error: unknown,
    context: {
      provider?: OAuthProvider;
      fallbackTarget?: AuthUiError["target"];
    },
  ) => AuthUiError;
};
```

Credential submit receives:

```ts
type CredentialAuthInput = {
  mode: "login" | "register";
  email: string;
  password: string;
  rememberMe: boolean;
};
```

Current behavior:

- `onCredential` runs after local email/password validation passes.
- `onOAuth` receives the selected provider.
- `onForgotPassword` receives the trimmed email.
- Any thrown error is passed through `normalizeError`.
- On success, the drawer closes.
- When `ui.auth.providers` is empty, the OAuth button group and divider are omitted.

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

## Supported Values

```ts
type OAuthProvider = "github" | "google";
type DrawerMode = "drawer" | "modal";
type DrawerPosition = "center" | "left" | "right";
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

Use `createAuthTriggerStore()` when a scene or host app needs to emit trigger events into the drawer from outside React props.

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
