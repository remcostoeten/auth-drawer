# Core API (`@remcostoeten/auth-drawer/core`)

Framework-free logic behind `@remcostoeten/auth-drawer`, published as its `/core` entry point: config resolution, the sign-in form state machine, the drawer open and success logic, the session client, the trigger store, validation, error normalization, copy, and the auth backend adapters. It has no runtime dependencies and imports no UI framework. The `/react` and `/solid` entry points are renderers over it; any other framework can be one too. Both renderers import this entry point through the package name, so module state such as the last-used store and the mock adapter's users is shared.

```bash
bun add @remcostoeten/auth-drawer
```

```ts
import { createAuthFormController, createDrawerController, createAuthClient } from "@remcostoeten/auth-drawer/core";
import { createSupabaseAdapter } from "@remcostoeten/auth-drawer/core/adapters/supabase";
```

Adapter entry points: `core/adapters/better-auth`, `core/adapters/clerk`, `core/adapters/custom-jwt`, `core/adapters/firebase`, `core/adapters/mock`, `core/adapters/next-auth`, `core/adapters/passport`, `core/adapters/supabase`. The theme tokens are available as `@remcostoeten/auth-drawer/core/tokens.css`.

## Contents

- [Controller contract](#controller-contract)
- [Session](#session)
- [Adapters](#adapters)
- [resolveAuthConfig](#resolveauthconfig)
- [createAuthFormController](#createauthformcontroller)
- [createDrawerController](#createdrawercontroller)
- [createAuthClient](#createauthclient)
- [Other exports](#other-exports)
- [Building a renderer](#building-a-renderer)

## Controller contract

Every controller has the same shape:

```ts
type Controller<State> = {
  getState: () => State;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
};
```

- `getState()` returns an immutable object. A new object is returned whenever anything changes and the same object is returned otherwise, so it works as a `useSyncExternalStore` snapshot or a Solid signal source. Never mutate it.
- `subscribe(listener)` calls `listener` with no arguments after a change and returns an unsubscribe function. Read `getState()` inside the listener.
- A controller is active while it has at least one subscriber. Timers, DOM listeners, storage listeners, trigger registrations and session subscriptions run only while active, and are released when the last subscriber leaves. Subscribing again restarts them. State and actions work without subscribers.
- `destroy()` is terminal. It clears timers and listeners, ignores later subscriptions, and makes in-flight async results a no-op. Renderers that tie the subscription to the component lifecycle do not need to call it; it exists for imperative use.
- Action methods are plain closures. They can be passed around unbound.

Types exported for this: `Controller<State>`, `Subscribers`, `createSubscribers(lifecycle?)`.

## Session

```ts
type AuthSessionState = {
  user: { id: string; email: string; name?: string; image?: string | null; [key: string]: any } | null;
  session: any | null;
};

type SessionSnapshot = {
  data: AuthSessionState | null;
  isPending: boolean;
  error: unknown;
};

type SessionSource = {
  getSnapshot: () => SessionSnapshot;
  subscribe: (listener: () => void) => () => void;
};
```

`getSnapshot` returns the same object until `data`, `isPending` or `error` change. Custom sources must keep that guarantee.

```ts
function createSessionStore(fetchSession: () => Promise<{ data: AuthSessionState | null; error: unknown }>): {
  source: SessionSource;
  refresh: () => void;
};
```

The first snapshot is `{ data: null, isPending: true, error: null }`. The first subscriber starts a fetch. `refresh()` re-fetches while anyone is subscribed and does nothing otherwise. A window `focus` event re-fetches while anyone is subscribed (guarded with `typeof window`). Overlapping requests keep the latest response, and a response that arrives after the last subscriber left is dropped.

```ts
function createSubscriptionSession(
  readInitial: () => SessionSnapshot,
  start: (set: (patch: Partial<SessionSnapshot>) => void) => (() => void) | void,
): SessionSource;
```

For SDKs that push auth changes. `start` runs on the first subscriber and its return value runs on the last unsubscribe. `readInitial` runs once, on first access.

```ts
function createPushSession(initial: SessionSnapshot): {
  source: SessionSource;
  push: (snapshot: SessionSnapshot) => void;
};
```

A source you feed from outside, for bridging a framework hook or signal. Pushing a snapshot with the same `data`, `isPending` and `error` is a no-op.

```ts
const STATIC_SESSION: SessionSource;   // { data: null, isPending: false, error: null }, never changes
function sessionOf(adapter: { session?: SessionSource }): SessionSource; // adapter.session ?? STATIC_SESSION
```

## Adapters

```ts
interface AuthAdapter {
  id: string;
  session: SessionSource;
  providers?: OAuthProvider[];
  demoCredentials?: { email: string; password: string };
  requiresName?: boolean;
  signIn?: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp?: (input: CredentialAuthInput & { name: string }) => Promise<AuthResult>;
  signOut?: () => Promise<AuthResult>;
  signInWithOAuth?: (provider: string) => Promise<AuthResult>;
  requestPasswordReset?: (email: string) => Promise<AuthResult>;
  resetPassword?: (input: { newPassword: string }) => Promise<AuthResult>;
  features?: {
    magicLink?: { signIn: (email: string) => Promise<AuthResult> };
    emailOtp?: { sendVerificationOtp: (email: string) => Promise<AuthResult>; signIn: (email: string, otp: string) => Promise<AuthResult> };
    anonymous?: { signIn: () => Promise<AuthResult> };
    passkey?: { signIn: () => Promise<AuthResult> };
  };
  normalizeError?: (error: unknown) => AuthUiError;
  onSuccess?: (action: AuthAction) => void;
  onError?: (error: AuthUiError, action: AuthAction) => void;
}

type CredentialAuthInput = { email: string; password: string; rememberMe: boolean };
type AuthResult<T = any> = { success: boolean; data?: T | null; error?: AuthUiError | null };
type AuthAction = "signIn" | "signUp" | "signOut" | "oauth" | "passkey";
```

`createAdapter(partial)` fills the defaults: a missing `session` becomes `STATIC_SESSION` and a missing `signOut` reloads the page.

Feature detection drives the UI: no `signUp` hides registration, no `signInWithOAuth` hides OAuth, no `requestPasswordReset` hides forgot password, `features.magicLink` and `features.passkey` enable those flows, and no `signIn` makes the form passwordless.

Each adapter factory has a neutral `session`:

| Adapter | `session` source |
| --- | --- |
| `custom-jwt`, `passport` | `createSessionStore`; refreshed after sign in, sign up and sign out |
| `better-auth` | `createSessionStore` over `client.getSession()`; refreshed after a successful sign in, sign up, sign out and passkey sign in. Static when the client has no `getSession` |
| `supabase` | `createSubscriptionSession` over `getSession()` and `onAuthStateChange` |
| `firebase` | `createSubscriptionSession` over `onAuthStateChanged`, seeded from `currentUser` |
| `mock` | in-memory, shared by all mock adapters in the module |
| `clerk`, `next-auth` | `STATIC_SESSION`. These SDKs expose their session through a framework hook (`clerk.useUser`, `client.useSession`), so the renderer reads that hook and pushes the result in, for example with `createPushSession`. `mapClerkUser`, `mapNextAuthSession` and `mapBetterAuthSession` map the hook data to `AuthSessionState` |

## resolveAuthConfig

```ts
function resolveAuthConfig<Node = unknown>(
  config: AuthConfig<Node> | undefined,
  adapter: AuthAdapter,
): ResolvedAuthConfig<Node>;
```

`Node` is the renderer's node type for `ui.footer` and `ui.success.footer` (`ReactNode`, `JSX.Element`, `string`). The result has every default applied:

```ts
type ResolvedAuthConfig<Node> = {
  normalizeError: (error: unknown, context: { provider?: OAuthProvider; fallbackTarget?: AuthErrorTarget }) => AuthUiError;
  triggers: AuthTriggerConfig;
  ui: {
    auth: ResolvedAuthConfigGroup;       // providers, oauthLayout, oauthOverflow, allowRegister, showRememberMe,
                                         // initialMode, showForgotPassword, showLivePasswordMatch, showFooter,
                                         // emailAutocomplete, magicLink, passkey, showLastUsed
    copy: ResolvedAuthCopyConfig;
    presentation: { variant: "drawer" | "modal"; defaultOpen: boolean; dismissible: boolean };
    visual: { backdrop: Required<AuthBackdropConfig> & { gradient: Required<AuthBackdropGradientConfig> } };
    motion: MotionSettings;
    footer?: Node;
    success: ResolvedAuthSuccessConfig<Node>; // enabled, minVisibleMs, maxVisibleMs, messages, footer
  };
};
```

Rules worth knowing:

- `ui.auth.providers` is intersected with `adapter.providers` when both are arrays. A non-array `adapter.providers` is ignored. No `signInWithOAuth` gives an empty list.
- `allowRegister`, `showForgotPassword`, `magicLink.enabled` and `passkey.enabled` are forced off when the adapter lacks the method or feature.
- `initialMode` falls back to `login` when `magicLink` is requested but unavailable, and becomes `magicLink` when the adapter has no `signIn` but has magic link.
- `motion` merges defaults, studio settings saved under `SETTINGS_KEY` in `localStorage`, `ui.motion`, then the resolved backdrop and `presentation.variant`.
- The default `normalizeError` runs `normalizeAuthError` and replaces the message with `ui.copy.errors[code]`. A `config.normalizeError` is used as is.

The pieces are exported too: `resolveAuthGroup`, `resolveBackdropGroup`, `resolveMotionSettings`, `resolvePresentationGroup`, `resolveAuthSuccessConfig`, `resolveCopyGroup`.

## createAuthFormController

```ts
function createAuthFormController<Node = unknown>(options: AuthFormControllerOptions<Node>): AuthFormController;

type AuthFormControllerOptions<Node = unknown> = {
  adapter: AuthAdapter;
  config: ResolvedAuthConfig<Node>;
  onSubmitSuccess: (action: "signIn" | "signUp" | "oauth" | "passkey") => void;
  onAdapterSuccess?: (action: AuthAction) => void;
  onAdapterError?: (error: AuthUiError, action: AuthAction) => void;
};
```

Callback order after a success is `adapter.onSuccess`, then `onAdapterSuccess`, then `onSubmitSuccess`. After a failure it is `adapter.onError`, then `onAdapterError`. A sent magic link and a password reset call none of the success callbacks.

### State

```ts
type AuthFormState = {
  email: string;
  name: string;
  password: string;
  confirm: string;
  rememberMe: boolean;
  mode: "login" | "register" | "resetPassword" | "magicLink";
  errors: { fields: { email?: AuthUiError; password?: AuthUiError; confirmPassword?: AuthUiError }; form?: AuthUiError; oauth?: AuthUiError };
  nameError: string;                    // "" when valid
  notice: string;                       // success text such as the password reset notice, "" when none
  loadingAction: OAuthProvider | "email" | "forgotPassword" | "passkey" | null;
  magicLinkSentTo: string | null;
  resendSeconds: number;                // counts down once per second while active
  oauthSuccessProvider: OAuthProvider | null;
  submitSuccessAction: "signIn" | "signUp" | null;
  passkeySucceeded: boolean;

  lastUsed: LastUsedMethod | null;      // null until hydrate() or the first subscription; null when ui.auth.showLastUsed is false
  isRegister: boolean;
  isResetPassword: boolean;
  isMagicLink: boolean;
  isMagicLinkSent: boolean;
  requiresName: boolean;                // adapter.requiresName && isRegister
  showMagicLinkSwitch: boolean;         // magic link available, adapter has signIn, not resetting
  magicLinkAvailable: boolean;
  passkeyAvailable: boolean;
  oauthProviders: OAuthProvider[];      // always an array
  title: string;
  subtitle: string;
  submitLabel: string;
  confirmFeedback: { message: string; tone: "error" | "success" } | null; // live password match
  buttonFeedback: { status: "error" | "success"; message: string } | undefined;
  isLoading: boolean;                   // loadingAction !== null
};
```

`buttonFeedback` is the form error if there is one, else the notice, else the success message for `submitSuccessAction`.

Fields start from `adapter.demoCredentials` and `ui.auth.initialMode` (register falls back to login when registration is disallowed). `rememberMe` and `lastUsed` start unset so server and client first renders match; call `hydrate()` right after mount (a layout effect avoids a visible flash) to read storage. The first subscription also reads `lastUsed`.

### Methods

```ts
type AuthFormController = Controller<AuthFormState> & {
  setEmail(value: string): void;              // clears the email, form and oauth errors and the notice
  acceptEmailSuggestion(value: string): void; // sets the email, clears the email error and the notice, keeps form errors
  setName(value: string): void;
  setPassword(value: string): void;
  setConfirm(value: string): void;
  setRememberMe(value: boolean): void;        // persists under REMEMBER_KEY
  hydrate(): void;                            // reads remember me and last used from storage; call after mount
  submit(): Promise<void>;                    // validates, then sign in, sign up, reset password or send magic link by mode
  runOAuth(provider: OAuthProvider): Promise<void>;
  runPasskey(): Promise<void>;
  sendMagicLink(address?: string): Promise<void>; // defaults to the sent address, then the trimmed email field
  requestPasswordReset(): Promise<void>;      // the "forgot password" link; validates only the email
  toggleMagicLink(): void;                    // login <-> magicLink
  useAnotherEmail(): void;                    // leaves the "link sent" view
  switchMode(): void;                         // login <-> register
  backToLogin(): void;                        // from resetPassword
  updateInputs(inputs: Partial<AuthFormControllerOptions>): void;
};
```

Behaviour:

- `submit()` validates first (`validateCredentials`, plus "Enter your name." when `requiresName`). On a validation error it sets `errors` and `nameError` and stops. Otherwise it runs the action for the current `mode`; `magicLink` mode sends the link.
- A failed result routes by `error.target`: `email`, `password` and `confirmPassword` go to `errors.fields`, `oauth` goes to `errors.oauth`, everything else goes to `errors.form`. Credential submits merge the validation state with the routed error.
- A thrown error goes through `adapter.normalizeError` if present, else `config.normalizeError`. A result without `success` becomes an "unavailable" error.
- A successful sign in, sign up, OAuth or passkey records the last-used method (`email`, the provider id, `passkey`). A sent magic link records `magicLink`.
- A successful password reset in `resetPassword` mode returns to `login`, clears both password fields and sets `notice` to `"Your password has been reset successfully. Please sign in."`. A sent reset email sets `notice` to `ui.copy.forgotPassword.successNotice`.
- After a link is sent, `resendSeconds` is `ceil(ui.auth.magicLink.resendMs / 1000)` and ticks down every second.
- `updateInputs` swaps `adapter` or `config` and recomputes the derived fields, which publishes a new state. Swapping only callbacks publishes nothing. Call it whenever your props change; it does not reset the fields.
- Last-used changes (this tab, or another tab through the `storage` event) update `lastUsed` while active.

## createDrawerController

```ts
function createDrawerController<Node = unknown>(options: DrawerControllerOptions<Node>): DrawerController<Node>;

type DrawerControllerOptions<Node = unknown> = {
  adapter: AuthAdapter;
  config?: AuthConfig<Node>;
  session: SessionSource;
  triggerStore?: AuthTriggerStore;          // defaults to a private createAuthTriggerStore()
  open?: { get: () => boolean; set: (next: boolean) => void };
  defaultOpen?: boolean;                    // when `open` is not bound; falls back to ui.presentation.defaultOpen
  onOpenChange?: (open: boolean) => void;   // when `open` is not bound
};

type DrawerState<Node = unknown> = {
  open: boolean;
  successState: { action: "signIn" | "signUp" | "oauth" | "passkey"; startedAt: number } | null;
  motion: MotionSettings;
  resolved: ResolvedAuthConfig<Node>;
  formConfig: ResolvedAuthConfig<Node>;     // resolved, minus the footer while a success state shows
  isAuthenticated: boolean;                 // Boolean(session.user)
  dismissible: boolean;
};

type DrawerController<Node = unknown> = Controller<DrawerState<Node>> & {
  openDrawer(): void;
  closeDrawer(): void;
  toggleDrawer(): void;
  handleAuthSuccess(action: "signIn" | "signUp" | "oauth" | "passkey"): void;
  syncOpen(): void;
  updateInputs(inputs: Partial<DrawerControllerOptions<Node>>): void;
};
```

Pass the controller's `handleAuthSuccess` as the form controller's `onSubmitSuccess`, and `state.formConfig` as the form's `config`.

- Open state: without `open`, the controller owns it and calls `onOpenChange` on every request. With `open`, `get` is read live, every request goes to `set`, and the controller never stores the value itself. Call `syncOpen()` after the owner changed the value (or pass the new binding through `updateInputs`) so subscribers are notified.
- `openDrawer` and `toggleDrawer` do nothing while `isAuthenticated`. `closeDrawer` always closes and clears the success state and its timer.
- `handleAuthSuccess`: with `ui.success.enabled` false it closes immediately. Otherwise it sets `successState` and schedules the close from `getAuthSuccessCloseDelay`. Authenticated and not pending closes after the remaining `minVisibleMs`. Otherwise it closes after the remaining `maxVisibleMs`. Past `maxVisibleMs` it closes at once. Session changes reschedule.
- While active it registers the six trigger kinds (`pageLoad`, `click`, `state`, `scrollOpen`, `idle`, `custom`) on the trigger store with an open-if-allowed callback, emits `pageLoad` after `delayMs`, binds the `click` selector on `document`, closes on `Escape` when open and `dismissible` (this leaves `successState` alone), and applies motion updates from the `SETTINGS_EVENT` window event and `storage` events on `SETTINGS_KEY`.
- `updateInputs` takes any of the options. A new `config` or `adapter` re-resolves the config and resets `motion`; a new `session` is re-subscribed; changed triggers are re-registered. It does not reset `open` or `successState`.

## createAuthClient

```ts
function createAuthClient(options: AuthClientOptions): AuthClient;

type AuthClientOptions = {
  adapter: AuthAdapter;
  onSuccess?: (action: AuthAction) => void;
  onError?: (error: AuthUiError, action: AuthAction) => void;
};

type AuthClientState = {
  user: AuthSessionState["user"];   // null when signed out
  session: AuthSessionState["session"];
  isPending: boolean;
  error: unknown;
  isDrawerOpen: boolean;
};

type AuthClient = Controller<AuthClientState> & {
  signIn(input: CredentialAuthInput): Promise<AuthResult>;
  signUp(input: CredentialAuthInput & { name: string }): Promise<AuthResult>;
  signInWithOAuth(provider: string): Promise<AuthResult>;
  signInWithMagicLink(email: string): Promise<AuthResult>;
  signInWithPasskey(): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  openDrawer(): void;
  closeDrawer(): void;
  updateInputs(inputs: Partial<AuthClientOptions>): void;
};
```

State mirrors `adapter.session` (read lazily, so `getState()` is correct without subscribers) plus `isDrawerOpen`. Actions never throw. Each runs the adapter call, then reports to `adapter.onSuccess` or `adapter.onError` and your callbacks, and resolves with the adapter result, or with `{ success: false, error }` for a thrown error or a missing method (`"<action> is unavailable for this auth adapter."`). `signInWithMagicLink` does not call the success callbacks, because a sent link is not a session. Whether an action exists is `adapter.signUp`, `adapter.signInWithOAuth`, `adapter.features?.magicLink` and `adapter.features?.passkey`; the client methods always exist, so check those if you need to hide a button.

## Other exports

- Config and copy: `DEFAULT_CONFIG`, `DEFAULT_COPY`, `DEFAULT_LEGAL_FOOTER_SEGMENTS`, `formatCopy(template, values)`, `resolveCopyGroup`, and the `Auth*Copy` types.
- Constants: `REMEMBER_KEY`, `LAST_USED_KEY`, `SETTINGS_KEY`, `SETTINGS_EVENT`, `PORTAL_ID`, `MAX_STAGGER`, `DOMAINS`, and the animation constants.
- Providers: `OAUTH_PROVIDER_IDS`, `OAUTH_PROVIDER_LABELS`, `OAUTH_PROVIDER_REGISTRY` (id and label, no icons), `OAUTH_VISIBLE_COUNT`, `defaultLabelForOAuthProvider`, `resolveOAuthProviders`, `resolveOAuthVisibleCount`. Icons belong to the renderer.
- Last used: `readLastUsedMethod()`, `recordLastUsedMethod(method)`, `clearLastUsedMethod()`, `subscribeLastUsed(listener)`.
- Triggers: `createAuthTriggerStore(options)` returning `{ registerTrigger, emit, subscribe, clear, snapshot }`.
- Validation and errors: `validateCredentials`, `getPasswordMatchFeedback`, `createAuthError`, `createAdapterError`, `hasAuthErrors`, `mergeAuthErrors`, `normalizeAuthError`, `EMPTY_AUTH_ERRORS`.
- Success timing: `resolveAuthSuccessConfig`, `getAuthSuccessCloseDelay`, `DEFAULT_AUTH_SUCCESS_CONFIG`.
- Email: `suggestEmailCompletion(value, domains)` returns the full suggested address or `""`.
- DOM helper: `registerOverlay(element)` marks siblings inert and locks scrolling until the returned function runs.

## Building a renderer

A renderer maps state to markup and events to methods. Sketch for Solid:

```ts
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import {
  createAuthFormController,
  createDrawerController,
  type Controller,
} from "@remcostoeten/auth-drawer/core";

function useController<State>(controller: Controller<State>) {
  const [state, setState] = createSignal(controller.getState());
  const stop = controller.subscribe(() => setState(() => controller.getState()));
  onCleanup(stop);
  return state;
}

const drawer = createDrawerController({ adapter, config, session: adapter.session });
const drawerState = useController(drawer);
const form = createAuthFormController({
  adapter,
  config: drawerState().formConfig,
  onSubmitSuccess: drawer.handleAuthSuccess,
});
const state = useController(form);
onMount(() => form.hydrate());
createEffect(() => form.updateInputs({ adapter: props.adapter, config: drawerState().formConfig }));
```

Checklist:

1. Create one controller per mounted surface and subscribe for as long as it is mounted.
2. Create `createDrawerController` first and feed `handleAuthSuccess` and `state.formConfig` into the form controller.
3. Push changed props with `updateInputs`. For framework-owned sessions, create a `createPushSession`, pass its `source` to the drawer controller and call `push` when the framework value changes.
4. Call `form.hydrate()` after mount on the client. Server rendering sees default fields and `lastUsed: null` until then.
5. Render from `getState()` only. Titles, labels, providers, feedback and loading flags are already derived.
6. Own what the core does not: icons, animation, portals, focus management, `inert` handling (`registerOverlay`), drag-to-dismiss, and the `pointer` and `scroll` events that call `triggerStore.emit`.
