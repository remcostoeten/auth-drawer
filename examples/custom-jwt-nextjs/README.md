# Custom JWT + Auth Drawer (Next.js)

Reference app for the [Auth Drawer Custom JWT guide](https://auth-drawer.remcostoeten.nl/docs#sdk-custom-jwt): a hand-rolled REST auth API that signs and verifies JSON Web Tokens, PostgreSQL via Drizzle, scrypt password hashing, `createCustomJwtAdapter`, and `AuthProvider` + `AuthDrawer`.

Unlike the Better Auth example, this one **consumes the published `@remcostoeten/auth-drawer` from npm** — it is deliberately excluded from the monorepo workspace so `bun install` pulls the real release into its own `node_modules` instead of symlinking the local package.

## Quick start

From the monorepo root:

```bash
bun run example:custom-jwt
```

Or from this directory:

```bash
cp .env.example .env
bun install        # pulls @remcostoeten/auth-drawer from npm (not linked)
bun run dev:all
```

The dev server runs on **http://localhost:3006**. Set `APP_URL` to match.

## How it works

The drawer never talks to a backend itself — `createCustomJwtAdapter` does. The
session JWT is stored in an **HttpOnly cookie** (the XSS-safe, industry-standard
choice), so no token is ever exposed to JavaScript. The adapter is configured
with a custom `fetcher` that sends `credentials: "include"` on every request; the
browser replays the cookie automatically, including on the `GET /api/auth/me`
call that hydrates the session.

| Route | Method | Purpose |
|------|--------|---------|
| `/api/auth/login` | POST | Verify credentials, set the session cookie, return `{ user }` |
| `/api/auth/register` | POST | Create a user, set the session cookie, return `{ user }` |
| `/api/auth/me` | GET | Resolve the user from the session cookie (401 = signed out) |
| `/api/auth/logout` | POST | Expire the session cookie |
| `/api/auth/forgot-password` | POST | Issue a reset token (logged to the terminal in dev) |
| `/api/auth/reset-password` | POST | Consume `{ token, newPassword }` and update the hash |

## Password reset

1. Use **Forgot password** in the drawer — the reset URL is logged to the terminal in development.
2. Open the link; it lands on `/reset-password?token=…`, which posts `{ token, newPassword }` to the REST endpoint.

Wire a real mailer by replacing the `console.log` in `src/app/api/auth/forgot-password/route.ts`.

## OAuth

The custom-JWT adapter only renders OAuth buttons when you pass an `oauthUrl`
resolver in `src/lib/auth-adapter.ts` (the adapter redirects the browser there;
your backend handles the callback and re-issues a JWT). List the providers in
`src/lib/oauth-providers.ts` to match.

## Security notes

- The JWT is kept in an **HttpOnly, SameSite=Lax cookie** (`Secure` in production),
  so client-side JavaScript can't read it — the standard mitigation against XSS
  token theft. Token lifetime is kept short (7 days) and mirrors the cookie max-age.
- For a localStorage + `Authorization: Bearer` flow instead, drop the custom
  `fetcher`, set `tokenStorageKey` on the adapter, and return the token in the
  login/register response body — the adapter then stores and attaches it.
- Passwords are hashed with `node:crypto` scrypt (no native deps). bcrypt/argon2 are
  fine drop-in replacements.
- Set a strong `AUTH_JWT_SECRET` (≥32 chars) — the app refuses to sign tokens otherwise.

## Layout

| File | Role |
|------|------|
| `src/lib/jwt.ts` | Sign / verify HS256 tokens with `jose` |
| `src/lib/passwords.ts` | scrypt hash + constant-time verify |
| `src/lib/session-cookie.ts` | Set / clear the HttpOnly session cookie |
| `src/lib/server-auth.ts` | Resolve the user from the session cookie |
| `src/lib/auth-adapter.ts` | `createCustomJwtAdapter` |
| `src/lib/oauth-providers.ts` | Shared OAuth provider list |
| `src/app/api/auth/*` | The REST auth API |
| `src/app/layout.tsx` | Root layout; includes `#auth-drawer-portal` |
| `src/components/auth-shell.tsx` | `AuthProvider` + `AuthDrawer` |
