# Examples

Runnable reference apps that mirror the setup guides in the [live docs](https://auth-drawer.remcostoeten.nl/docs#sdk-adapters).

Want an agent to scaffold integration for you? Install the skill first:

```bash
npx skills add remcostoeten/auth-drawer --skill auth-drawer
```

Then ask it to match one of the examples below (e.g. *"Set up auth drawer like the better-auth-nextjs example"*).

| Example | Stack | Docs |
| --- | --- | --- |
| [better-auth-nextjs](./better-auth-nextjs) | Next.js 16, Better Auth, Drizzle, PostgreSQL | [SDK adapters → Better Auth](https://auth-drawer.remcostoeten.nl/docs#sdk-better-auth) |
| [custom-jwt-nextjs](./custom-jwt-nextjs) | Next.js 16, custom JWT REST API, jose, Drizzle, PostgreSQL | [SDK adapters → Custom JWT](https://auth-drawer.remcostoeten.nl/docs#sdk-custom-jwt) |
| [passport-express](./passport-express) | Express + Passport.js API, Next.js 15 client, Drizzle, PostgreSQL | [SDK adapters → Passport](https://auth-drawer.remcostoeten.nl/docs#sdk-passport) |

Run from the repo root:

```bash
bun run example:better-auth   # Better Auth example (port 3005)
bun run example:custom-jwt    # Custom JWT example
bun run example:passport      # Passport Express + Next.js client
```

## What the adapter does in each example

Every example follows the same UI wiring: create an adapter once in
`lib/auth-adapter.ts`, pass it to `AuthProvider` and `AuthDrawer` in
`components/auth-shell.tsx`. The adapter is the only file that changes between
stacks.

| Example | Adapter factory | What you configure |
| --- | --- | --- |
| better-auth-nextjs | `createBetterAuthAdapter` | `better-auth/react` client, OAuth providers, callback URLs |
| custom-jwt-nextjs | `createCustomJwtAdapter` | REST paths under `/api/auth`, cookie-based session |
| passport-express | `createPassportAdapter` | External API URLs (`/login`, `/register`, `/user`) with `credentials: "include"` |

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
