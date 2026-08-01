<p align="center">
  <img src="./showcase/public/favicon.svg" alt="" width="56" height="56" />
</p>

# Auth Drawer

Configurable React auth drawer and modal for product teams that want a polished
sign-in surface without rebuilding OAuth buttons, credential forms, drawer
motion, validation states, and auth-provider glue for every app.

<p>
  <a href="https://www.npmjs.com/package/@remcostoeten/auth-drawer"><strong>npm package</strong></a>
  ·
  <a href="https://auth-drawer.remcostoeten.nl/docs"><strong>live docs</strong></a>
  ·
  <a href="./API.md"><strong>API reference</strong></a>
</p>

<p>
  <img alt="npm version" src="https://shieldcn.dev/npm/@remcostoeten/auth-drawer.png" />
  <img alt="npm downloads" src="https://shieldcn.dev/npm/dm/@remcostoeten/auth-drawer.png" />
  <img alt="npm license" src="https://shieldcn.dev/npm/license/@remcostoeten/auth-drawer.png" />
  <img alt="GitHub stars" src="https://shieldcn.dev/github/stars/remcostoeten/auth-drawer.png" />
</p>

## What It Is

`@remcostoeten/auth-drawer` is a provider-agnostic auth UI primitive. It ships a
typed adapter boundary, accessible drawer/modal presentation, OAuth provider
controls, email/password flows, password reset affordances, session hooks, and
configuration for copy, layout, triggers, and motion.

Use it when you already have an auth backend and need a reliable front-end auth
surface that can be dropped into different apps without forking UI code.

## Highlights

- Drawer or modal presentation with responsive mobile behavior.
- Email/password sign-in, registration, forgot-password, and optional live
  password-match feedback.
- OAuth buttons for GitHub, Google, Apple, Discord, TikTok, plus overflow
  handling for larger provider sets.
- Typed adapters for Better Auth, Supabase, Auth.js/NextAuth, Clerk, Firebase,
  custom JWT/REST APIs, Passport sessions, and mock demos.
- `AuthProvider`, `useAuth`, and trigger-store APIs for global session state and
  controlled drawer opening.
- Configurable copy, provider list, layout, backdrop, animation, width, desktop
  position, and trigger behavior.
- Live Next.js showcase with docs search, configurator, API tables, and themed
  playground examples.

## Demos

The regular demo opens the stock drawer from the docs CTA and submits against
the mock adapter used by the showcase.

![Regular Auth Drawer flow](./docs/assets/auth-drawer-regular.gif)

The Windows XP playground shows the same auth primitive mounted inside a themed
login experience.

![Windows XP Auth Drawer flow](./docs/assets/auth-drawer-windows-xp.gif)

Try the routes locally:

```bash
bun install
bun --cwd showcase run dev
```

- Docs and configurator: `http://localhost:3000/docs`
- Regular playground lab: `http://localhost:3000/?view=playground`
- Windows XP example: `http://localhost:3000/playground/windows-xp`
- Medium-style paywall example: `http://localhost:3000/playground/medium-paywall-example`

## Install

```bash
npm install @remcostoeten/auth-drawer
```

Peer dependencies:

```bash
npm install react react-dom framer-motion lucide-react
```

Styles ship with the package import. For most apps there is no separate CSS file
to wire.

## LLM-guided setup

This repo ships an [Agent Skill](https://skills.sh/) so coding agents (Cursor,
Claude Code, Codex, and [60+ others](https://github.com/vercel-labs/skills#supported-agents))
can wire up Auth Drawer end-to-end — pick an adapter, create `auth-adapter.ts`,
mount `AuthProvider` / `AuthDrawer`, and configure triggers or theming without
you spelling out every file.

**Install the skill** (project-scoped, recommended for teams):

```bash
npx skills add remcostoeten/auth-drawer --skill auth-drawer
```

**Target a specific agent** (non-interactive):

```bash
# Cursor
npx skills add remcostoeten/auth-drawer --skill auth-drawer -a cursor -y

# Claude Code
npx skills add remcostoeten/auth-drawer --skill auth-drawer -a claude-code -y
```

**Preview what's in the repo** before installing:

```bash
npx skills add remcostoeten/auth-drawer --list
```

**Try once without installing** (prints a skill prompt you can paste, or starts
an agent session when combined with `--agent`):

```bash
npx skills use remcostoeten/auth-drawer@auth-drawer
```

After install, ask your agent in plain language — for example:

- *"Add auth drawer with Better Auth to this Next.js app."*
- *"Wire up Passport cookie sessions with auth drawer — API is on port 4000."*
- *"Add a Supabase login drawer with GitHub and Google OAuth."*

The skill lives in [`skills/auth-drawer/`](./skills/auth-drawer/) and includes
reference docs for [adapters](./skills/auth-drawer/references/adapters.md),
[config](./skills/auth-drawer/references/config.md),
[errors](./skills/auth-drawer/references/errors.md), and
[triggers](./skills/auth-drawer/references/triggers.md). Installs are tracked in
[`skills-lock.json`](./skills-lock.json) (commit it for reproducible team
setups).

Browse more skills at [skills.sh](https://skills.sh/) or search:
`npx skills find auth drawer`.

## What `adapter={adapter}` means

`AuthDrawer` is UI only — forms, OAuth buttons, validation, motion, and error
display. It does **not** talk to your auth backend by itself.

An **adapter** is the object that connects that UI to your auth stack. You build
it once with a provider-specific factory (`createBetterAuthAdapter`,
`createPassportAdapter`, etc.), then pass the same instance to both
`AuthProvider` and `AuthDrawer`:

```tsx
<AuthProvider adapter={adapter}>   {/* session + drawer controls via useAuth() */}
  <AuthDrawer adapter={adapter} /> {/* renders the sign-in surface */}
</AuthProvider>
```

The adapter implements a small contract: `signIn`, optional `signUp` /
`signInWithOAuth` / `signOut`, `useSession`, and error normalization. The drawer
calls those methods when the user submits the form or clicks an OAuth button.
`AuthProvider` calls `useSession()` once and exposes the result through
`useAuth()`.

Pick the factory that matches your backend, configure it with your client or API
URLs, export the result as `authAdapter`, and wire it into your app shell.

## Quick start (Better Auth)

This is the most common setup: Better Auth runs in the same Next.js app, and the
adapter wraps the `better-auth/react` client.

**`lib/auth-client.ts`**

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

**`lib/auth-adapter.ts`**

```ts
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
import { authClient } from "@/lib/auth-client";

export const authAdapter = createBetterAuthAdapter({
  client: authClient,
  providers: ["github", "google"],
  callbackURL: "/dashboard",
  passwordResetRedirectTo: "/reset-password",
  requireName: true,
});
```

**`components/auth-shell.tsx`**

```tsx
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

**`app/layout.tsx`**

```tsx
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

Open the drawer from anywhere under `AuthProvider`:

```tsx
import { useAuth } from "@remcostoeten/auth-drawer";

function Header() {
  const { user, signOut, openDrawer } = useAuth();

  return user ? (
    <button onClick={signOut}>Sign out</button>
  ) : (
    <button onClick={openDrawer}>Sign in</button>
  );
}
```

Runnable reference: [`examples/better-auth-nextjs`](./examples/better-auth-nextjs).
Step-by-step guide: [live docs → Better Auth](https://auth-drawer.remcostoeten.nl/docs#sdk-better-auth).

> [!TIP]
> Add `<div id="auth-drawer-portal" />` near your app root. The drawer can render
> without it, but the portal keeps the overlay above page content and makes
> scroll locking predictable.

## Alternative setup (Passport + separate API)

When auth lives on a different server (Express, Fastify, etc.) with cookie
sessions, the adapter points at REST endpoints instead of an SDK client. Every
request uses `credentials: "include"` so session cookies flow between origins.

**`lib/auth-adapter.ts`**

```ts
import { createPassportAdapter } from "@remcostoeten/auth-drawer/adapters/passport";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const authAdapter = createPassportAdapter({
  loginUrl: `${API_URL}/login`,
  registerUrl: `${API_URL}/register`,
  logoutUrl: `${API_URL}/logout`,
  userProfileUrl: `${API_URL}/user`,
  requireName: true,
  fetcher: (url, init) => fetch(url, { ...init, credentials: "include" }),
});
```

The `AuthShell` / `AuthProvider` / `AuthDrawer` wiring is identical to Better
Auth — only the adapter factory and its options change.

Runnable reference: [`examples/passport-express`](./examples/passport-express)
(Express + Passport.js backend, Next.js frontend). Also see
[`examples/custom-jwt-nextjs`](./examples/custom-jwt-nextjs) for a hand-rolled
JWT REST API in the same Next.js app.

## Adapters

Import only the adapter you need:

```tsx
import { createSupabaseAdapter } from "@remcostoeten/auth-drawer/adapters/supabase";
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
import { createNextAuthAdapter } from "@remcostoeten/auth-drawer/adapters/next-auth";
import { createClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";
import { createPassportAdapter } from "@remcostoeten/auth-drawer/adapters/passport";
import { createCustomJwtAdapter } from "@remcostoeten/auth-drawer/adapters/custom-jwt";
import { createMockAdapter } from "@remcostoeten/auth-drawer/adapters/mock";
```

| Auth backend | Import path | Typical adapter input |
| --- | --- | --- |
| Better Auth | `@remcostoeten/auth-drawer/adapters/better-auth` | `better-auth/react` client |
| Supabase | `@remcostoeten/auth-drawer/adapters/supabase` | Browser Supabase client |
| Auth.js / NextAuth | `@remcostoeten/auth-drawer/adapters/next-auth` | `signIn` / `signOut` / `useSession` from `next-auth/react` |
| Clerk | `@remcostoeten/auth-drawer/adapters/clerk` | Clerk hooks wired into a `client` object |
| Firebase Auth | `@remcostoeten/auth-drawer/adapters/firebase` | Modular Firebase auth functions |
| Custom JWT / REST | `@remcostoeten/auth-drawer/adapters/custom-jwt` | `baseUrl` + REST endpoint paths |
| Passport sessions | `@remcostoeten/auth-drawer/adapters/passport` | Login/register/logout/user URLs |
| Mock adapter | `@remcostoeten/auth-drawer/adapters/mock` | In-memory demo handlers |

Provider-specific setup guides live in the [live docs](https://auth-drawer.remcostoeten.nl/docs#sdk-adapters)
and in [`specs/`](./specs/).

## Configuration

Most teams start with defaults and override only the parts that matter:

```tsx
<AuthDrawer
  adapter={adapter}
  config={{
    ui: {
      auth: {
        providers: ["github", "google", "discord"],
        allowRegister: true,
      },
      presentation: {
        variant: "drawer",
      },
      copy: {
        login: {
          title: "Welcome back",
          submit: "Sign in",
        },
      },
    },
  }}
/>
```

The full API reference is in [API.md](./API.md), and the live configurator can
generate a starter config from the docs UI.

## Monorepo layout

```text
packages/auth-drawer/          Published React package (adapters, UI, styles)
showcase/                      Next.js docs site, configurator, and playground
examples/
  better-auth-nextjs/          Better Auth + Drizzle + PostgreSQL (same-app auth)
  custom-jwt-nextjs/             Hand-rolled JWT REST API + Drizzle + PostgreSQL
  passport-express/            Express + Passport.js API + Next.js client (split stack)
specs/                         Adapter contracts and provider implementation notes
skills/auth-drawer/            Agent skill for LLM-guided integration (install via npx skills)
docs/
  assets/                      README demo GIFs
  internal/                    Planning and release notes
```

## Development

Install dependencies once from the repo root:

```bash
bun install
```

Common commands:

```bash
bun run dev          # run workspace dev tasks
bun run build        # build package and showcase
bun run typecheck    # typecheck workspaces
bun run test         # package tests
bun run lint         # lint workspaces
```

Run a focused target:

```bash
bun --cwd packages/auth-drawer run test
bun --cwd packages/auth-drawer run build
bun --cwd showcase run dev
```

## Publishing Boundary

The npm package ships from `packages/auth-drawer` and includes `dist`, `styles`,
`README.md`, `CHANGELOG.md`, and `LICENSE`. The showcase is a separate Next.js
workspace used for docs and visual testing; it is not part of the published
package.
