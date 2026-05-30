# @remcostoeten/auth-drawer

Configurable React auth drawer and modal with OAuth, email/password, triggers, motion, and typed provider adapters.

## Install

```bash
npm install @remcostoeten/auth-drawer
```

Peer dependencies: `react`, `react-dom`, `framer-motion`, `lucide-react`.

## Quick start

```tsx
import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer";
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
import { createAuthClient } from "better-auth/react";

const client = createAuthClient();
const adapter = createBetterAuthAdapter({ client });

export function App() {
  return (
    <>
      <AuthProvider adapter={adapter}>
        <AuthDrawer adapter={adapter} />
      </AuthProvider>
      <div id="auth-drawer-portal" />
    </>
  );
}
```

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
