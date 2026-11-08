# Changelog

All notable changes to `@remcostoeten/auth-drawer` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- **SolidJS support.** `@remcostoeten/auth-drawer/solid` renders the same drawer
  and modal for SolidJS: `AuthDrawer`, `AuthProvider`, `useAuth` and
  `useOptionalAuth` (accessors), `createScrollOpenTrigger`, `useLastUsedMethod`
  and `bindSolidSession`, plus `/solid/adapters/<name>`, `/solid/styles.css` and
  `/solid/styles/tailwind.css`. The `solid` export condition points at
  uncompiled JSX. `solid-js` ^1.9 is the only peer dependency of this entry
  point and motion is CSS, with no animation library.
- **Framework-free core.** `@remcostoeten/auth-drawer/core` exports the
  controllers, `createAdapter`, config resolution, copy, validation, session
  stores, the trigger store and the last-used store, with neutral adapters under
  `/core/adapters/<name>` and the theme tokens as `/core/tokens.css`. The API is
  documented in `docs/core.md`.
- **`/react` entry point.** `@remcostoeten/auth-drawer/react` is the canonical
  React entry, with `/react/adapters/<name>`, `/react/styles.css` and
  `/react/styles/tailwind.css`. Its exports are the ones the package root had.
- **X provider.** `"x"` is now a built-in OAuth provider with its logo and the
  default label "X". The Better Auth adapter sends it to Better Auth as
  `twitter`, the id Better Auth uses for X.

### Changed

- **One package.** The core and the Solid renderer ship inside
  `@remcostoeten/auth-drawer` rather than as separate packages. The React and
  Solid builds import the core through `@remcostoeten/auth-drawer/core`, so both
  share one copy of its module state. Every peer dependency (`react`,
  `react-dom`, `framer-motion`, `lucide-react`, `solid-js`) is now optional,
  and you install the ones your entry point needs.
- **Neutral adapter session.** `AuthAdapter` now carries `session`, a
  `{ getSnapshot, subscribe }` source, and `useSession` is an optional React
  hook. Adapters built with `createAdapter` keep working, including ones that
  pass the old `useSession` hook. Plain adapter objects without `session` are
  read as signed out unless they still provide `useSession`.
- `createRevalidatingSession` keeps its `{ notifySession, useSession }` API and
  is now built on the core session store.
- `LoginForm`, `AuthDrawer` and `AuthProvider` are thin renderers over the core
  controllers. Rendered output is unchanged.

### Deprecated

These 0.5.0 import paths still work and resolve to the React entry point. Move
to the canonical paths; the aliases will be removed in a future major version.

| Deprecated                                      | Use                                                   |
| ----------------------------------------------- | ----------------------------------------------------- |
| `@remcostoeten/auth-drawer`                     | `@remcostoeten/auth-drawer/react`                     |
| `@remcostoeten/auth-drawer/adapters/<name>`     | `@remcostoeten/auth-drawer/react/adapters/<name>`     |
| `@remcostoeten/auth-drawer/styles.css`          | `@remcostoeten/auth-drawer/react/styles.css`          |
| `@remcostoeten/auth-drawer/styles/tailwind.css` | `@remcostoeten/auth-drawer/react/styles/tailwind.css` |

## 0.6.0

### Added

- **Passkey sign-in.** An adapter that implements `features.passkey` gets a
  "Continue with a passkey" button above the email form. A success is reported
  as the new `"passkey"` action, `useAuth()` exposes `signInWithPasskey`, and
  the Better Auth adapter wires it automatically when the client has the passkey
  plugin. Configure it under `ui.auth.passkey` and `copy.passkey`.
- **Last used chip.** The method that signed in last on this device (OAuth
  provider, password form, magic link, or passkey) is remembered in
  `localStorage` and marked with a "Last used" chip on the next visit. Configure
  it with `ui.auth.showLastUsed` and `copy.lastUsed`; `readLastUsedMethod`,
  `recordLastUsedMethod`, `clearLastUsedMethod`, and `useLastUsedMethod` are
  exported for apps.
- `AuthButton` accepts a `badge`.

### Changed

- `AuthAction` gains `"passkey"`, so a `success.messages` map now has a
  `passkey` entry (default "Signed in with passkey").
- **Breaking for the Better Auth adapter:** optional plugins are declared with
  `features: ["magicLink", "emailOtp", "anonymous", "passkey"]` instead of being
  detected on the client. A real Better Auth client is a Proxy that answers every
  property with a function, so 0.5.0 advertised the magic-link flow on every
  client, whether or not the plugin was installed.

## 0.5.0

### Added

- **Magic-link sign-in is now a real flow, not just a type.** An adapter that
  implements `features.magicLink` gets an email-only form and a "check your
  inbox" state with a throttled resend and a "use a different email" escape.
  Sending a link keeps the drawer open and fires no `onSuccess`, because no
  session exists until the user follows the link.
- `AuthAdapter.signIn` is now optional. Omit it on a passwordless backend and the
  password field is not rendered at all; the drawer opens straight into the
  magic-link form. Keep both and the form offers a link to switch between them.
- `ui.auth.magicLink` config group (`enabled`, `resendMs`, default 30000) and a
  `copy.magicLink` group for every string in the flow.
- `useAuth()` exposes `signInWithMagicLink` when the adapter supports it.
- `"magicLink"` is a valid `ui.auth.initialMode`; it falls back to `"login"` when
  the adapter has no magic-link support.
- `ui.presentation.dismissible` (default `true`). Set it to `false` when the auth
  surface *is* the page: the close button, backdrop click, escape key, and
  drag-to-close are all disabled, and initial focus moves to the first field
  instead of the (absent) close button.

## 0.3.2

### Changed

- **Success and error feedback moves into the button.** The submit button and each
  OAuth provider button now swap through `idle → loading → success/error` states
  via an `AnimatePresence` transition (blur + y-slide, 180ms ease-out). The
  separate `AuthSuccessBanner` at the bottom of the drawer is removed from the
  default rendering, success copy ("Signed in", "Account created",
  "Signed in with provider") appears inline in whichever button was clicked.
  Custom footers passed via `config.ui.success.footer` still render as before.
- Form-level errors (wrong credentials, server errors) now show inside the submit
  button with an error tint instead of floating above it as a separate element.
  Field-level and OAuth errors are unaffected.
- OAuth provider errors are repositioned to appear directly below the OAuth button
  group instead of just above the submit button.
- **Keyboard focus is now color-only.** Nothing in the drawer (or the built-in
  trigger) draws a focus outline or focus ring any more; tabbing changes text,
  border, or background color instead. The color comes from the new
  `--focus-on-overlay` token, which derives from `--text-on-overlay`, so it
  follows any theme override for free. The remember-me checkbox, which had no
  visible focus state at all, now tints its box and label.

### Fixed

- Password-match live feedback chip no longer flickers or briefly appears centered
  when transitioning between "Passwords match" and "Passwords don't match" states.
  Root cause: `inline-flex` combined with `scale` transform on the animated `<p>`
  caused the element to scale from an unexpected horizontal origin. Fixed by
  switching to `flex w-fit` and removing the scale from the entry/exit animation.
- `OAuthIconSource` is now correctly exported from the package's main entry point.

### Internal

- `examples/better-auth-nextjs` linked to the local workspace package so it
  always reflects local source changes without a separate publish step.

## 0.3.1

### Added

- **11 more built-in OAuth providers (16 total):** `x`, `facebook`, `microsoft`,
  `gitlab`, `twitch`, `linkedin`, `spotify`, `slack`, `reddit`, `notion`, `figma`
 , each with a bundled icon and default label.
- **Rich OAuth provider entries.** `ui.auth.providers` now accepts objects as
  well as ids, so you can register custom providers (any id) with a custom icon
  component, React element, or image URL; override labels; supply light/dark logo
  variants (`iconLight`/`iconDark`); or hide a logo.
- **Logo visibility controls.** `ui.auth.showProviderIcons` (global, default
  `true`) plus per-provider `showIcon`. Light/dark logo variants switch via the
  package's class-based dark mode (`.dark` ancestor) in CSS, SSR-safe.
- The `OAuthProvider` type accepts any string for custom providers. New public
  types `KnownOAuthProvider`, `OAuthIconSource`, `OAuthProviderConfig`,
  `AuthProviderEntry`; new `iconForOAuthProvider` export.

### Changed

- **Success commit now waits for the session to be fully loaded before closing.**
  `ui.success.minVisibleMs` (default raised `650` → `900`) is the dwell measured
  from when the session becomes ready, so the confirmation no longer flashes and
  vanishes the instant auth completes; `maxVisibleMs` (`3500`) is a failsafe cap
  that only applies while the session is still pending.
- The success confirmation now animates in (ease-out + blur, spring checkmark,
  reduced-motion aware) and stays visible through the drawer's close animation
  instead of popping back to the form mid-close.

### Internal

- Tests for provider entry normalization, logos/`showIcon`, custom ids, and
  ready-based success dwell (including slow-session coverage).

## 0.3.0

### Added

- Built-in success commit state after sign-in, sign-up, and OAuth completion.
  The drawer stays visible briefly after a successful auth action while the
  session settles, and the timing is configurable via `ui.success`.
- Public types for `AuthAction`, `AuthSuccessAction`, `AuthSuccessConfig`, and
  `ResolvedAuthSuccessConfig`.

### Changed

- Successful auth submissions now keep the drawer open for a short, controlled
  success state before closing, instead of disappearing immediately after the
  callback fires.

### Internal

- Added timing helpers and tests for success-state resolution and close-delay
  behavior.

## 0.2.3

### Fixed

- **Better Auth adapter no longer crashes the drawer on open.** A real Better
  Auth client (`createAuthClient`) is a Proxy, so `client.options?.socialProviders`
  is a truthy proxy rather than `undefined`. The adapter's
  `?? client.options?.socialProviders ?? [...]` therefore left `providers` as a
  proxy, and the form's `providers.length > 0` coerced it, throwing
  `Cannot convert object to primitive value` and white-screening the drawer the
  moment it opened. The adapter now only uses `client.options.socialProviders`
  when it is an actual array.
- The login form and `resolveAuthGroup` defensively normalize `providers` to an
  array, so a misbehaving adapter degrades to "no OAuth" instead of crashing.

### Internal

- Added a regression test that builds the Better Auth adapter from a
  Proxy-shaped client (the real client's shape), the prior tests used a plain
  mock and never exercised this.

## 0.2.1

### Fixed

- `custom-jwt` and `passport` adapters now refresh their session immediately
  after `signIn`/`signUp`/`signOut` instead of staying stale until a page
  reload. Both adapters previously read the session once on mount; they now
  re-fetch when notified and when the tab regains focus, matching the live
  behavior of the SDK-backed adapters (Better Auth, Supabase, Firebase, …).

### Internal

- Added a shared `createRevalidatingSession` helper that pairs a `useSession`
  hook with a `notifySession` trigger, used by the REST adapters above.

## 0.2.0

### Added

- Export `useOptionalAuth` from the package entry point, so consumers can read
  auth state from components that may render outside an `AuthProvider`.
- Unit tests for the `mock`, `better-auth`, `supabase`, and `custom-jwt`
  adapters covering happy paths, token persistence, and provider error mapping.

### Changed

- Hardened `AuthProvider`: provider errors are normalized through the adapter
  and unavailable actions (e.g. a missing `signOut`) fail with a clear error
  instead of throwing.
- `demoCredentials` is now part of the public `AuthAdapter` type.

### Notes

- The `0.1.0` tag on npm was published from a state preceding the provider
  hardening above. `0.2.0` is the first release to include it.

## 0.1.0

- Initial public release: configurable auth drawer/modal with OAuth, triggers,
  motion, and typed provider adapters (Better Auth, Supabase, Clerk, NextAuth,
  Firebase, custom JWT/REST, Passport, and a mock adapter).
