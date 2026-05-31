# Passport + Auth Drawer example

An Express + Passport.js backend with a Next.js frontend, demonstrating
`createPassportAdapter` from `@remcostoeten/auth-drawer`.

## Stack

| Layer | Technology |
|---|---|
| Auth strategy | [Passport.js](https://www.passportjs.org/) local strategy |
| Session store | [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple) → PostgreSQL |
| ORM | [Drizzle](https://orm.drizzle.team/) |
| Database | PostgreSQL 16 via Docker |
| Frontend | Next.js 15, React 19 |
| Auth UI | [@remcostoeten/auth-drawer](https://auth-drawer.remcostoeten.nl/docs) |

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (for PostgreSQL)
- [Bun](https://bun.sh/)

### 1. Clone the repo

```bash
git clone https://github.com/remcostoeten/auth-drawer.git
cd auth-drawer/examples/passport-express
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Edit `server/.env` — set a proper `SESSION_SECRET`:

```bash
# generate one:
openssl rand -base64 32
```

### 3. Run everything

```bash
bash dev.sh
```

This will:
1. Install dependencies in both `server/` and `client/`
2. Start PostgreSQL via Docker Compose
3. Generate and apply Drizzle migrations
4. Start the Express server on **http://localhost:4000**
5. Start the Next.js client on **http://localhost:3006**

Open **http://localhost:3006** in your browser.

## Project structure

```
passport-express/
├── docker-compose.yml        PostgreSQL 16
├── dev.sh                    Start server + client together
├── server/
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts          Express app (CORS, sessions, Passport)
│   │   ├── lib/
│   │   │   ├── passport-config.ts  Local strategy + serialize/deserialize
│   │   │   └── passwords.ts        scrypt hash/verify (no native deps)
│   │   ├── routes/
│   │   │   └── auth.ts       POST /login, POST /register, POST /logout, GET /user
│   │   └── db/
│   │       ├── connection.ts
│   │       └── schema.ts
│   └── scripts/dev.sh        Start server only
└── client/
    ├── .env.example
    └── src/
        ├── app/              Next.js App Router pages
        ├── components/
        │   ├── auth-shell.tsx   AuthProvider + AuthDrawer wrapper
        │   └── site-header.tsx  Header with sign-in / sign-out
        └── lib/
            ├── auth-adapter.ts       createPassportAdapter config
            └── auth-drawer-config.ts AuthConfig (backdrop, copy)
```

## How the adapter is wired

```ts
// client/src/lib/auth-adapter.ts
import { createPassportAdapter } from "@remcostoeten/auth-drawer/adapters/passport";

export const authAdapter = createPassportAdapter({
  loginUrl:       `${API_URL}/login`,
  registerUrl:    `${API_URL}/register`,
  logoutUrl:      `${API_URL}/logout`,
  userProfileUrl: `${API_URL}/user`,
  requireName:    true,
  fetcher: (url, init) => fetch(url, { ...init, credentials: "include" }),
});
```

The `credentials: "include"` fetcher is **required** so the browser sends the
session cookie cross-origin to the Express server.

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/login` | `{ username, password }` → sets session cookie |
| `POST` | `/register` | `{ username, password, name }` → creates user + sets session |
| `POST` | `/logout` | Clears session |
| `GET` | `/user` | Returns `{ id, email, name, image }` or `401` |

## Session revalidation

`createPassportAdapter` uses `createRevalidatingSession` internally. The session
is fetched on mount and then **re-fetched automatically** whenever:

- `signIn` or `signUp` succeeds
- `signOut` is called
- The browser tab regains focus (catches cross-tab sign-out)

No page reload required.
