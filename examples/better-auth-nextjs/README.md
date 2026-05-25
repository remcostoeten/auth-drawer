# Better Auth + Auth Drawer (Next.js)

Reference app for the [Auth Drawer Better Auth guide](https://auth-drawer.remcostoeten.nl/docs#ba-guide): PostgreSQL, Drizzle, a catch-all `/api/auth` route, `createBetterAuthAdapter`, and `AuthProvider` + `AuthDrawer`.

## Quick start

From the monorepo root:

```bash
bun run example:better-auth
```

Or from this directory:

```bash
cp .env.example .env
bun run dev:all
```

The dev server runs on **http://localhost:3005** (not 3000). Set `BETTER_AUTH_URL` to match.

## OAuth

Edit `src/lib/oauth-providers.ts` to enable `github` / `google`, then add the matching env vars from `.env.example`. The same list is passed to the Better Auth server and `createBetterAuthAdapter` so UI and backend stay aligned.

## Password reset

1. Use **Forgot password** in the drawer (logs the reset URL to the terminal in development).
2. Open the link; it lands on `/reset-password?token=…` where you set a new password.

Configure a real mailer by replacing the `sendResetPassword` stub in `src/lib/auth.ts`.

## Layout

| File | Role |
|------|------|
| `src/lib/auth.ts` | Better Auth server |
| `src/lib/auth-client.ts` | React client |
| `src/lib/auth-adapter.ts` | `createBetterAuthAdapter` |
| `src/lib/oauth-providers.ts` | Shared OAuth provider list |
| `src/components/auth-shell.tsx` | `AuthProvider` + `AuthDrawer` |
