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

`src/lib/oauth-providers.ts` ships a showcase set (`github`, `google`,
`discord`, `x`). The same list drives both the Better Auth server
(`src/lib/auth.ts`) and `createBetterAuthAdapter`, so UI and backend stay
aligned. Each provider is **env-gated**: it shows in the drawer immediately, and
real sign-in starts working once you add its `*_CLIENT_ID` / `*_CLIENT_SECRET`
to `.env` (see `.env.example`). Trim the list, or set it to `[]`, for an
email/password-only demo.

The drawer ships icons for `github`, `google`, `apple`, `discord`, `tiktok` and
`x`. Better Auth calls the X provider `twitter`; the adapter and `src/lib/auth.ts`
handle the mapping.

## Sign-in flow (loading + success)

`src/components/auth-shell.tsx` uses the v0.3 success commit: on a successful
sign-in/up/oauth the drawer stays open through the connecting phase, holds a
confirmation until the Better Auth session is **fully loaded** (`useSession().isPending`
clears), then closes — no manual delay. The redirect to `/dashboard` is gated on
the session actually settling (not a fixed timeout), and only fires for a fresh
sign-in. Tune the commit via `ui.success` in `src/lib/auth-drawer-config.ts`.

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
| `src/app/layout.tsx` | Root layout; includes `#auth-drawer-portal` |
| `src/components/auth-shell.tsx` | `AuthProvider` + `AuthDrawer` |
