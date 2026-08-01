# @remcostoeten/auth-drawer

Configurable React auth drawer and modal with OAuth, email/password, triggers, motion, and typed provider adapters.

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

Peer dependencies: `react`, `react-dom`, `framer-motion`, `lucide-react`.

## LLM-guided setup

Install the bundled [Agent Skill](https://skills.sh/) so your coding agent can
handle adapter choice, file wiring, and config for you:

```bash
npx skills add remcostoeten/auth-drawer --skill auth-drawer
```

Then prompt naturally — e.g. *"Add auth drawer with Better Auth"* or *"Set up
Passport cookie sessions with auth drawer."* The skill covers all adapters,
`AuthProvider`, triggers, and theming. See the [repo README](https://github.com/remcostoeten/auth-drawer#llm-guided-setup) for agent-specific flags and one-shot usage.

## What `adapter={adapter}` is

`AuthDrawer` renders the sign-in UI. The **adapter** connects that UI to your
auth backend — it implements `signIn`, `signUp`, `signOut`, `useSession`, and
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
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
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

import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer";
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
import { createPassportAdapter } from "@remcostoeten/auth-drawer/adapters/passport";

export const authAdapter = createPassportAdapter({
  loginUrl: "http://localhost:4000/login",
  registerUrl: "http://localhost:4000/register",
  logoutUrl: "http://localhost:4000/logout",
  userProfileUrl: "http://localhost:4000/user",
  fetcher: (url, init) => fetch(url, { ...init, credentials: "include" }),
});
```

`AuthProvider` / `AuthDrawer` wiring stays the same — only the adapter changes.

Styles ship with the component import — no separate CSS file required.

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
finishes loading, shows a confirmation, and only then closes — so the drawer
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

## Hooks

Wrap your app in `AuthProvider` to read auth state and control the drawer from
anywhere:

```tsx
import { useAuth, useOptionalAuth } from "@remcostoeten/auth-drawer";

function Header() {
  const { user, signOut, openDrawer } = useAuth();
  return user
    ? <button onClick={signOut}>Sign out</button>
    : <button onClick={openDrawer}>Sign in</button>;
}
```

- `useAuth()` returns `{ user, session, isPending, error, signIn, signUp?, signInWithOAuth?, signOut, openDrawer, closeDrawer, isDrawerOpen }`. It throws if used outside an `AuthProvider`.
- `useOptionalAuth()` returns the same value or `null` when no provider is mounted — use it in shared components that may render with or without the provider.

## Adapters

- `@remcostoeten/auth-drawer/adapters/better-auth`
- `@remcostoeten/auth-drawer/adapters/supabase`
- `@remcostoeten/auth-drawer/adapters/next-auth`
- `@remcostoeten/auth-drawer/adapters/clerk`
- `@remcostoeten/auth-drawer/adapters/firebase`
- `@remcostoeten/auth-drawer/adapters/custom-jwt`
- `@remcostoeten/auth-drawer/adapters/passport`
- `@remcostoeten/auth-drawer/adapters/mock` (`createMockAdapter`)

## Docs

- Full docs & live playground: https://auth-drawer.remcostoeten.nl/docs
- API reference: [API.md](https://github.com/remcostoeten/auth-drawer/blob/master/API.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## License

MIT
