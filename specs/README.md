# Auth Drawer: Client Adapters Specifications Index

This directory contains client-side specifications and interfaces mapping different authentication engines to the unified `@remcostoeten/auth-drawer` component using the Adapter pattern.

---

## Specifications Directory

| Adapter | Spec File | Purpose / Description |
|---|---|---|
| **Better Auth** | [better-auth.md](./better-auth.md) | Standard first-party SDK integration, reactive hook synchronization, and plugin detection. |
| **Supabase** | [supabase.md](./supabase.md) | Real-time session monitoring using `supabase.auth.onAuthStateChange`. |
| **Auth.js / NextAuth** | [next-auth.md](./next-auth.md) | Standard credentials and social provider logins wrapper. |
| **Clerk (Headless)** | [clerk.md](./clerk.md) | Factory adapter (`createClerkAdapter`) wired from Clerk hooks in a Client Component. |
| **Firebase Auth** | [firebase.md](./firebase.md) | Integration with standard Firebase v9/v10 JS SDK APIs and error codes. |
| **Custom REST / JWT** | [custom-jwt.md](./custom-jwt.md) | Template for custom REST endpoints using local storage tokens. |
| **Passport.js** | [passport.md](./passport.md) | Node.js cookie session integration with standard form payloads. |

---

## Architecture Guides

* [DRY_ADAPTER_PLAN.md](../docs/internal/DRY_ADAPTER_PLAN.md): Separation rules explaining validation, error normalizations, and OAuth provider scopes boundaries.
* [ADVANCED_ADAPTER_SUGGESTIONS.md](../docs/internal/ADVANCED_ADAPTER_SUGGESTIONS.md): Developer guide containing React Context implementations (`AuthProvider`), local sandbox mocking configurations (`createMockAdapter`), React 19 async loaders (`useTransition`), and custom styling variables.
