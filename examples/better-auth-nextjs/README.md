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

`src/lib/oauth-providers.ts` ships a showcase set — `github`, `google`,
`discord`, `twitch`, `gitlab`, `spotify` — so the drawer renders the new v0.3
provider icons out of the box. The same list drives both the Better Auth server
(`src/lib/auth.ts`) and `createBetterAuthAdapter`, so UI and backend stay
aligned. Each provider is **env-gated**: it shows in the drawer immediately, and
real sign-in starts working once you add its `*_CLIENT_ID` / `*_CLIENT_SECRET`
to `.env` (see `.env.example`). Trim the list — or set it to `[]` — for an
email/password-only demo.

v0.3 ships bundled icons for 16 providers (`github`, `google`, `apple`,
`discord`, `tiktok`, `x`, `facebook`, `microsoft`, `gitlab`, `twitch`,
`linkedin`, `spotify`, `slack`, `reddit`, `notion`, `figma`); monochrome marks
adapt to light/dark automatically. `ui.auth.providers` also accepts object
entries for **custom providers, custom/light-dark logos, or label-only buttons**
— see the commented example in `src/lib/auth-drawer-config.ts`. (That rich form
applies when the adapter doesn't advertise its own provider list; the Better
Auth adapter does, so the bare ids win here. Use `showProviderIcons: false` to
drop logos globally.)

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
