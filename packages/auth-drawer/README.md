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
    <AuthProvider adapter={adapter}>
      <AuthDrawer adapter={adapter} />
    </AuthProvider>
  );
}
```

Styles ship with the component import — no separate CSS file required.

When `AuthDrawer` is rendered inside `AuthProvider`, `useAuth().openDrawer()` and
`useAuth().closeDrawer()` control the drawer unless you pass explicit
`open`/`onOpenChange` props. Use those props when your app needs fully controlled
state. The drawer and `useAuth()` read the same adapter-backed session state.

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

https://auth-drawer.remcostoeten.nl/docs

## License

MIT
