# Examples

Runnable reference apps that mirror the setup guides in the docs.

| Example | Stack | Docs |
| --- | --- | --- |
| [better-auth-nextjs](./better-auth-nextjs) | Next.js 16, Better Auth, Drizzle, PostgreSQL | [SDK adapters → Better Auth](https://auth-drawer.remcostoeten.nl/docs#sdk-better-auth) |
| [custom-jwt-nextjs](./custom-jwt-nextjs) | Next.js 16, custom JWT REST API, jose, Drizzle, PostgreSQL | [SDK adapters → Custom JWT](https://auth-drawer.remcostoeten.nl/docs#sdk-custom-jwt) |

## Provider-open behavior

When `AuthDrawer` is inside `AuthProvider`, buttons can open it through
`useAuth()` without local `open` state:

```tsx
import { AuthDrawer, AuthProvider, useAuth } from "@remcostoeten/auth-drawer";

function SignInButton() {
  const { openDrawer } = useAuth();
  return <button onClick={openDrawer}>Sign in</button>;
}

export function App({ adapter }) {
  return (
    <>
      <AuthProvider adapter={adapter}>
        <SignInButton />
        <AuthDrawer adapter={adapter} hideTrigger />
      </AuthProvider>
      <div id="auth-drawer-portal" />
    </>
  );
}
```
