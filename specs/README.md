# Cozy Auth Drawer: Client Adapters Specifications Index

This directory contains client-side specifications and interfaces mapping different authentication engines to the unified `@remcostoeten/auth-drawer` component using the Adapter pattern.

---

## 📁 Specifications Directory

| Adapter | Spec File | Purpose / Description |
|---|---|---|
| **Better Auth** | 📄 [better-auth.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/better-auth.md) | Standard first-party SDK integration, reactive hook synchronization, and plugin detection. |
| **Supabase** | 📄 [supabase.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/supabase.md) | Real-time session monitoring using `supabase.auth.onAuthStateChange`. |
| **Auth.js / NextAuth** | 📄 [next-auth.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/next-auth.md) | Standard credentials and social provider logins wrapper. |
| **Clerk (Headless)** | 📄 [clerk.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/clerk.md) | Hook-based adapter (`useClerkAdapter`) mapping `useSignIn` and `useSignUp` hooks. |
| **Firebase Auth** | 📄 [firebase.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/firebase.md) | Integration with standard Firebase v9/v10 JS SDK APIs and error codes. |
| **Custom REST / JWT** | 📄 [custom-jwt.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/custom-jwt.md) | Template for custom REST endpoints using local storage tokens. |
| **Passport.js** | 📄 [passport.md](file:///home/remcostoeten/dev/cozy-auth-drawer/specs/passport.md) | Node.js cookie session integration with standard form payloads. |

---

## 🛠️ Architecture Guides

*   📄 **[DRY_ADAPTER_PLAN.md](file:///home/remcostoeten/dev/cozy-auth-drawer/DRY_ADAPTER_PLAN.md)**: Separation rules explaining validation, error normalizations, and OAuth provider scopes boundaries.
*   📄 **[ADVANCED_ADAPTER_SUGGESTIONS.md](file:///home/remcostoeten/dev/cozy-auth-drawer/ADVANCED_ADAPTER_SUGGESTIONS.md)**: Developer guide containing React Context implementations (`AuthProvider`), local sandbox mocking configurations (`createMockAdapter`), React 19 async loaders (`useTransition`), and custom styling variables.
