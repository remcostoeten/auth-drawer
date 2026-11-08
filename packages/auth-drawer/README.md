# @remcostoeten/auth-drawer

Configurable auth drawer and modal for React and SolidJS with OAuth, email/password, triggers, motion, and typed provider adapters, on top of a framework-free core.

<p>
  <img alt="npm version" src="https://shieldcn.dev/npm/@remcostoeten/auth-drawer.png" />
  <img alt="npm downloads" src="https://shieldcn.dev/npm/dm/@remcostoeten/auth-drawer.png" />
  <img alt="npm license" src="https://shieldcn.dev/npm/license/@remcostoeten/auth-drawer.png" />
  <img alt="npm types" src="https://shieldcn.dev/npm/types/@remcostoeten/auth-drawer.png" />
</p>

## Install

```bash
npm install @remcostoeten/auth-drawer
```

One package, three entry points:

| Entry point                      | For                                                          |
| -------------------------------- | ------------------------------------------------------------ |
| `@remcostoeten/auth-drawer/react` | React UI, hooks and React-flavoured adapters                 |
| `@remcostoeten/auth-drawer/solid` | SolidJS UI, accessors and adapters                           |
| `@remcostoeten/auth-drawer/core`  | Framework-free controllers, config, copy, stores and adapters |

All peer dependencies are optional. Install the ones your entry point needs:

| Entry point | Peer dependencies                                         |
| ----------- | --------------------------------------------------------- |
| `/react`    | `react`, `react-dom`, `framer-motion`, `lucide-react`     |
| `/solid`    | `solid-js` ^1.9 (no animation library, motion is CSS)     |
| `/core`     | none                                                      |

The React and Solid builds import the core through `@remcostoeten/auth-drawer/core`, so both share one copy of its
module state (the last-used store, the mock adapter's users). The core API is documented in [docs/core.md](./docs/core.md).

## Frameworks

### React

```tsx
import { AuthDrawer, AuthProvider, useAuth } from "@remcostoeten/auth-drawer/react";
import { createMockAdapter } from "@remcostoeten/auth-drawer/react/adapters/mock";

const adapter = createMockAdapter();

export function App() {
  return (
    <AuthProvider adapter={adapter}>
      <AuthDrawer adapter={adapter} hideTrigger />
    </AuthProvider>
  );
}
```

Styles are imported by the entry point. Tailwind projects can import `@remcostoeten/auth-drawer/react/styles/tailwind.css`
instead. The rest of this README uses the React entry point.

### SolidJS

The Solid renderer shows the same surface on the same core, so form behaviour, copy, validation, adapters and trigger
rules are identical.

```tsx
import { Show } from "solid-js";
import { AuthDrawer, AuthProvider, useAuth } from "@remcostoeten/auth-drawer/solid";
import { createMockAdapter } from "@remcostoeten/auth-drawer/solid/adapters/mock";
import "@remcostoeten/auth-drawer/solid/styles.css";

const adapter = createMockAdapter();

function Header() {
  const auth = useAuth();
  return (
    <Show when={auth.user()} fallback={<button onClick={auth.openDrawer}>Sign in</button>}>
      {(user) => <button onClick={auth.signOut}>Sign out {user().email}</button>}
    </Show>
  );
}

export function App() {
  return (
    <AuthProvider adapter={adapter}>
      <Header />
      <AuthDrawer adapter={adapter} hideTrigger />
    </AuthProvider>
  );
}
```

Add `<div id="auth-drawer-portal" />` to your root HTML so the drawer portals above the page. Without it the drawer
renders inline. Dark mode follows a `dark` class on an ancestor, as in React. The `/solid` entry stamps its own
stylesheet import, so the explicit `styles.css` import is only needed when your bundler drops side-effect imports.

`useAuth()` returns accessors and actions. It throws outside an `AuthProvider`; `useOptionalAuth()` returns `undefined`
instead.

| Member                                                                            | Type                           |
| --------------------------------------------------------------------------------- | ------------------------------ |
| `user()`, `session()`, `error()`                                                  | accessors                      |
| `isPending()`, `isDrawerOpen()`                                                   | accessors                      |
| `signIn`, `signUp`, `signInWithOAuth`, `signInWithMagicLink`, `signInWithPasskey` | actions resolving `AuthResult` |
| `signOut`, `openDrawer`, `closeDrawer`                                            | actions                        |

`AuthDrawer` takes the same props as the React component: `config`, `adapter`, `className`, `triggerClassName`,
`hideTrigger`, `open`, `defaultOpen`, `onOpenChange`, `onSuccess`, `onError` and `triggerStore`. The config tree is the
one documented in the [API reference](https://github.com/remcostoeten/auth-drawer/blob/master/API.md). Wherever the React
config takes a `ReactNode` (footers), the Solid config takes a `JSX.Element`.

Adapters live under `@remcostoeten/auth-drawer/solid/adapters/<name>` (`better-auth`, `supabase`, `next-auth`, `clerk`,
`firebase`, `custom-jwt`, `passport`, `mock`). They expose a neutral `session` source, so Solid needs no hook. Some
clients only expose their session through a reactive accessor, for example the Better Auth Solid client's `useSession`
or Clerk. Bind that accessor with `bindSolidSession`:

```tsx
import { bindSolidSession } from "@remcostoeten/auth-drawer/solid";
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/solid/adapters/better-auth";

const session = authClient.useSession();
const adapter = bindSolidSession(createBetterAuthAdapter({ client: authClient }), () => ({
  data: session().data ? { user: session().data.user, session: session().data.session } : null,
  isPending: session().isPending,
  error: session().error,
}));
```

Call it inside a component or `createRoot`. Outside any owner it creates its own root that lives for the page.

`createAuthTriggerStore()` is shared with the other renderers. `createScrollOpenTrigger` is the Solid equivalent of the
React `useScrollOpenTrigger` hook, and `useLastUsedMethod()` returns an accessor for the last sign-in method.

`@remcostoeten/auth-drawer/solid/styles.css` is the prebuilt stylesheet and
`@remcostoeten/auth-drawer/solid/styles/tailwind.css` is the Tailwind source layer. The theme tokens are shared with
React and also available as `@remcostoeten/auth-drawer/core/tokens.css`.

The `/solid` export has a `solid` condition that points at uncompiled JSX (`dist/solid/source`), which Solid-aware
bundlers pick up, and an `import` condition with compiled ESM and type declarations. Adapter subpaths ship compiled ESM
only.

Differences from React:

- Accessors instead of values from `useAuth()` and `useLastUsedMethod()`.
- No `framer-motion`: the entry, exit and height transitions are CSS, and drag to dismiss uses pointer events.
- `bindSolidSession` replaces the React adapters' `useSession` hook wrappers.

### Deprecated aliases

Imports from the 0.5.0 layout keep working. They point at the React entry point and will be removed in a future major
version. Move to the canonical paths.

| Deprecated                                  | Use                                                |
| ------------------------------------------- | -------------------------------------------------- |
| `@remcostoeten/auth-drawer`                 | `@remcostoeten/auth-drawer/react`                  |
| `@remcostoeten/auth-drawer/adapters/<name>` | `@remcostoeten/auth-drawer/react/adapters/<name>`  |
| `@remcostoeten/auth-drawer/styles.css`      | `@remcostoeten/auth-drawer/react/styles.css`       |
| `@remcostoeten/auth-drawer/styles/tailwind.css` | `@remcostoeten/auth-drawer/react/styles/tailwind.css` |

## LLM-guided setup

Install the bundled [Agent Skill](https://skills.sh/) so your coding agent can
handle adapter choice, file wiring, and config for you:

```bash
npx skills add remcostoeten/auth-drawer --skill auth-drawer
```

Then prompt naturally, e.g. *"Add auth drawer with Better Auth"* or *"Set up
Passport cookie sessions with auth drawer."* The skill covers all adapters,
`AuthProvider`, triggers, and theming. See the [repo README](https://github.com/remcostoeten/auth-drawer#llm-guided-setup) for agent-specific flags and one-shot usage.

## What `adapter={adapter}` is

`AuthDrawer` renders the sign-in UI. The **adapter** connects that UI to your
auth backend, it implements `signIn`, `signUp`, `signOut`, `useSession`, and
related methods. Create it once with a provider factory, then pass the same
object to both `AuthProvider` (session + `useAuth()`) and `AuthDrawer` (the
form surface).

## Quick start (Better Auth)

```ts
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
```

```ts
// lib/auth-adapter.ts
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/react/adapters/better-auth";
import { authClient } from "@/lib/auth-client";

export const authAdapter = createBetterAuthAdapter({
  client: authClient,
  providers: ["github", "google"],
  callbackURL: "/dashboard",
});
```

```tsx
// components/auth-shell.tsx
"use client";

import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer/react";
import { authAdapter } from "@/lib/auth-adapter";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider adapter={authAdapter}>
      {children}
      <AuthDrawer adapter={authAdapter} hideTrigger />
    </AuthProvider>
  );
}
```

```tsx
// app/layout.tsx
import { AuthShell } from "@/components/auth-shell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthShell>{children}</AuthShell>
        <div id="auth-drawer-portal" />
      </body>
    </html>
  );
}
```

## Alternative (Passport cookie sessions on a separate API)

When auth runs on another server, point the adapter at REST endpoints instead of
an SDK client:

```ts
import { createPassportAdapter } from "@remcostoeten/auth-drawer/react/adapters/passport";

export const authAdapter = createPassportAdapter({
  loginUrl: "http://localhost:4000/login",
  registerUrl: "http://localhost:4000/register",
  logoutUrl: "http://localhost:4000/logout",
  userProfileUrl: "http://localhost:4000/user",
  fetcher: (url, init) => fetch(url, { ...init, credentials: "include" }),
});
```

`AuthProvider` / `AuthDrawer` wiring stays the same, only the adapter changes.

Styles ship with the component import, no separate CSS file required.

Add `<div id="auth-drawer-portal" />` near the root of your document so the drawer
portals above page content and background scroll lock works correctly. Without it,
the drawer still renders but falls back to inline placement (a dev console warning
is logged).

When `AuthDrawer` is rendered inside `AuthProvider`, `useAuth().openDrawer()` and
`useAuth().closeDrawer()` control the drawer unless you pass explicit
`open`/`onOpenChange` props. Use those props when your app needs fully controlled
state. The drawer and `useAuth()` read the same adapter-backed session state.

Put app-level success handling on `AuthProvider` (or `adapter.onSuccess`). Drawer
submissions inside a provider already flow through the provider callbacks.

The drawer also includes a built-in success commit state after sign-in,
sign-up, and OAuth completion. It keeps the drawer open while the session
finishes loading, shows a confirmation, and only then closes, so the drawer
never disappears before the session is actually ready. Tune it with `ui.success`:

```tsx
<AuthDrawer
  adapter={adapter}
  config={{
    ui: {
      success: {
        // How long the confirmation stays visible *after* the session is
        // fully loaded (ms). Defaults to 900.
        minVisibleMs: 900,
        // Failsafe cap: longest the drawer waits for a session that never
        // resolves before closing anyway (ms). Defaults to 3500.
        maxVisibleMs: 3500,
      },
    },
  }}
/>
```

### OAuth providers

Sixteen providers ship with bundled icons and labels: `github`, `google`,
`apple`, `discord`, `tiktok`, `x`, `facebook`, `microsoft`, `gitlab`, `twitch`,
`linkedin`, `spotify`, `slack`, `reddit`, `notion`, `figma`. Each `providers`
entry can be a bare id or a rich object for custom providers, custom icons,
light/dark logos, or label-only buttons:

```tsx
<AuthDrawer
  adapter={adapter}
  config={{
    ui: {
      auth: {
        showProviderIcons: true, // global logo default; per-provider showIcon overrides
        providers: [
          "github",                                       // built-in icon + label
          { id: "google", label: "Continue with Google" },
          { id: "acme", label: "Acme SSO", icon: "/acme.svg" }, // image-url logo
          { id: "keycloak", label: "Keycloak",
            iconLight: "/keycloak-dark.svg",              // shown on light surfaces
            iconDark: "/keycloak-white.svg" },            // shown on dark (.dark)
          { id: "okta", label: "Okta", showIcon: false }, // label-only
        ],
      },
    },
  }}
/>
```

`icon`/`iconLight`/`iconDark` accept a component, a React element, or an image
URL string. Light/dark variants switch via the package's class-based dark mode
(`.dark` ancestor); built-in monochrome marks use `currentColor` and adapt
automatically. Custom provider ids must match what the adapter's
`signInWithOAuth(provider)` expects.

Customize the bundled theme with CSS tokens:

```css
:root {
  --surface-overlay: 34 12% 82%;
  --surface-overlay-raised: 30 11% 78%;
  --surface-overlay-hover: 28 10% 70%;
  --text-on-overlay: 24 18% 14%;
  --border-overlay: 28 12% 54%;
}
```

## Magic link (passwordless)

Implement `features.magicLink` on the adapter and the drawer grows a passwordless
flow: an email-only form, then a "check your inbox" state with a throttled resend.
The prebuilt Better Auth adapter wires it when you declare the plugin:
`createBetterAuthAdapter({ client, features: ["magicLink"] })`.

```ts
import { createAdapter } from "@remcostoeten/auth-drawer/react";

export const authAdapter = createAdapter({
  id: "my-backend",
  // No signIn at all: the password field disappears and the drawer opens
  // straight into the magic-link form.
  features: {
    magicLink: {
      async signIn(email) {
        const res = await fetch("/api/auth/sign-in/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          return {
            success: false,
            error: { code: "rate_limited", target: "form", message: "Try again shortly." },
          };
        }
        return { success: true };
      },
    },
  },
  useSession,
});
```

Keep `signIn` as well and both flows are offered: the password form gets a link
to switch to the magic-link form and back.

Configure it under `ui.auth.magicLink` and relabel it under `copy.magicLink`:

```tsx
<AuthDrawer
  adapter={authAdapter}
  config={{
    ui: {
      auth: { magicLink: { enabled: true, resendMs: 30000 } },
      copy: { magicLink: { submit: "Email me a link" } },
    },
  }}
/>
```

Sending a link is not a session, so the drawer stays open on success and no
`onSuccess` fires, the sign-in completes when the user follows the link.

When the auth surface *is* the page (a `/login` route with nothing behind it),
pass `ui.presentation.dismissible: false` to drop the close button, backdrop
click, escape key, and drag-to-close.

## Passkeys

Implement `features.passkey` on the adapter and the drawer adds a "Continue with
a passkey" button above the email form. A success is reported as the `"passkey"`
action. The prebuilt Better Auth adapter wires it when you declare the plugin
(`features: ["passkey"]`); registering and managing passkeys stays in your app.

```ts
export const authAdapter = createAdapter({
  id: "my-backend",
  signIn,
  features: {
    passkey: {
      async signIn() {
        const res = await fetch("/api/auth/passkey/sign-in", { method: "POST" });
        return res.ok ? { success: true } : { success: false };
      },
    },
  },
  useSession,
});
```

Switch it off with `ui.auth.passkey.enabled: false` and relabel it under
`copy.passkey.continueWith`.

## Last used

The drawer remembers which method signed in last on this device (an OAuth
provider, the password form, a magic link, or a passkey) in `localStorage` and
marks that button with a "Last used" chip on the next visit. Nothing is synced.
Turn it off with `ui.auth.showLastUsed: false`, relabel it under
`copy.lastUsed.label`, and read or reset it from your app:

```ts
import { readLastUsedMethod, clearLastUsedMethod, useLastUsedMethod } from "@remcostoeten/auth-drawer/react";
```

## Hooks

Wrap your app in `AuthProvider` to read auth state and control the drawer from
anywhere:

```tsx
import { useAuth, useOptionalAuth } from "@remcostoeten/auth-drawer/react";

function Header() {
  const { user, signOut, openDrawer } = useAuth();
  return user
    ? <button onClick={signOut}>Sign out</button>
    : <button onClick={openDrawer}>Sign in</button>;
}
```

- `useAuth()` returns `{ user, session, isPending, error, signIn, signUp?, signInWithOAuth?, signInWithMagicLink?, signInWithPasskey?, signOut, openDrawer, closeDrawer, isDrawerOpen }`. It throws if used outside an `AuthProvider`.
- `useOptionalAuth()` returns the same value or `null` when no provider is mounted, use it in shared components that may render with or without the provider.

## Adapters

- `@remcostoeten/auth-drawer/react/adapters/better-auth`
- `@remcostoeten/auth-drawer/react/adapters/supabase`
- `@remcostoeten/auth-drawer/react/adapters/next-auth`
- `@remcostoeten/auth-drawer/react/adapters/clerk`
- `@remcostoeten/auth-drawer/react/adapters/firebase`
- `@remcostoeten/auth-drawer/react/adapters/custom-jwt`
- `@remcostoeten/auth-drawer/react/adapters/passport`
- `@remcostoeten/auth-drawer/react/adapters/mock` (`createMockAdapter`)

The same adapter names exist under `/solid/adapters/` and, as neutral adapters that expose a `session` source instead of a
hook, under `/core/adapters/`.

## Docs

- Full docs & live playground: https://auth-drawer.remcostoeten.nl/docs
- API reference: [API.md](https://github.com/remcostoeten/auth-drawer/blob/master/API.md)
- Core API reference: [docs/core.md](./docs/core.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## License

MIT
