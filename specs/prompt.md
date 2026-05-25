Listed directory specs
Listed directory cozy-auth-drawer
Listed directory packages
Viewed IMPLEMENTATION_ROADMAP.md:1-186

Here's the prompt:

---

## Agent Implementation Prompt

```
You are implementing the AuthAdapter system for the `@remcostoeten/auth-drawer` package.
The repository is at: /home/remcostoeten/dev/cozy-auth-drawer

Before writing any code, read ALL of the following files in full:

  /home/remcostoeten/dev/cozy-auth-drawer/IMPLEMENTATION_ROADMAP.md
  /home/remcostoeten/dev/cozy-auth-drawer/DRY_ADAPTER_PLAN.md
  /home/remcostoeten/dev/cozy-auth-drawer/ADVANCED_ADAPTER_SUGGESTIONS.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/README.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/better-auth.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/supabase.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/next-auth.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/clerk.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/firebase.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/custom-jwt.md
  /home/remcostoeten/dev/cozy-auth-drawer/specs/passport.md
  /home/remcostoeten/dev/cozy-auth-drawer/packages/auth-drawer/src/types.ts
  /home/remcostoeten/dev/cozy-auth-drawer/packages/auth-drawer/src/auth-errors.ts

Then explore the existing source tree under packages/auth-drawer/src/ to understand what
already exists before touching anything.

---

CODE STYLE — HARD CONSTRAINTS (violations are not acceptable):
- Never use React.FC or React.FunctionComponent.
- Never use React.* namespace for types. Import directly:
    import { ReactNode, useState, useEffect, useTransition } from "react"
- Define components as plain TypeScript functions:
    export function ComponentName({ prop }: Props) { ... }
- Type props with explicit interfaces or type aliases, not inline generics.

---

IMPLEMENTATION ORDER — follow this exactly, complete each phase before starting the next:

PHASE 1 — Core types & error utility
  1. Append the AuthAdapter interface, AuthResult, and AuthSessionState types to
     packages/auth-drawer/src/types.ts exactly as specified in IMPLEMENTATION_ROADMAP.md §2.
     Do not duplicate types that already exist in that file.
  2. Create packages/auth-drawer/src/errors.ts with the createAdapterError utility
     as specified in IMPLEMENTATION_ROADMAP.md §2 Task 1.2.
  3. After both files are written, run:
       cd packages/auth-drawer && bun run typecheck
     Fix all type errors before proceeding.

PHASE 2 — Adapters
  For each adapter below, read the corresponding spec file first, then implement it.
  Each adapter lives at packages/auth-drawer/src/adapters/<name>.ts and must:
    - Import AuthAdapter, AuthResult from "../types"
    - Import createAdapterError from "../errors"
    - Export a single factory function: export function create<Name>Adapter(...) { ... }
    - Never import the provider SDK at the module level — accept the client as a parameter
    - Map every provider error to AuthUiError via createAdapterError or normalizeAuthError
    - Not contain any UI, React component, or JSX

  Implement in this order:
    2.1  better-auth    (spec: specs/better-auth.md)
    2.2  supabase       (spec: specs/supabase.md)
    2.3  next-auth      (spec: specs/next-auth.md)
    2.4  clerk          (spec: specs/clerk.md)
    2.5  firebase       (spec: specs/firebase.md)
    2.6  custom-jwt     (spec: specs/custom-jwt.md)
    2.7  passport       (spec: specs/passport.md)
    2.8  mock           (spec: ADVANCED_ADAPTER_SUGGESTIONS.md §2)

  After implementing all adapters, run typecheck again and fix errors.

PHASE 3 — Package exports
  Update packages/auth-drawer/package.json exports map to add a tree-shakeable
  subpath entry for every adapter, as specified in IMPLEMENTATION_ROADMAP.md §3 Task 2.3.
  Extend the pattern to cover all 8 adapters (not just better-auth and supabase).

PHASE 4 — Drawer component wiring
  1. Read packages/auth-drawer/src/ui/auth-drawer.tsx (and any related form components)
     fully before editing.
  2. Add an optional `adapter?: AuthAdapter` and optional `onSuccess` / `onError` callbacks to the `AuthDrawer` component props.
  3. When adapter is provided:
     - Automatically override config properties if methods are missing (e.g. `allowRegister = false` if `signUp === undefined`, `showForgotPassword = false` if `requestPasswordReset === undefined`, `providers = []` if `signInWithOAuth === undefined`).
     - Gate triggers: Do not trigger drawer open when `session?.user` is authenticated (check `adapter.useSession()`).
     - Route credential signIn/signUp through `adapter.signIn` / `adapter.signUp`.
     - Route forgot-password through `adapter.requestPasswordReset`.
     - Route OAuth clicks through `adapter.signInWithOAuth` (keep promise pending during page redirect).
     - Route reset-password submissions through `adapter.resetPassword` (support `mode === "resetPassword"` form layout with password fields).
  4. Wrap all adapter calls with useTransition; set inputs/buttons disabled while isPending.
  5. Route callbacks correctly to `props.onSuccess` / `props.onError` and the active adapter lifecycle hooks.
  6. Run typecheck after edits.

PHASE 5 — AuthProvider context
  Create packages/auth-drawer/src/ui/auth-provider.tsx with the global AuthProvider
  component and useAuth hook as specified in ADVANCED_ADAPTER_SUGGESTIONS.md §1.
  Export both from the package's main index.

PHASE 6 — Final verification
  Run the following sequence from the repo root and fix anything that fails:
    cd packages/auth-drawer && bun run typecheck
    cd packages/auth-drawer && bun run test
    cd packages/auth-drawer && bun run build
    bun run dev   (from repo root — smoke-test the mock adapter in the playground)

Do not skip phases. Do not move to the next phase while the current phase has type errors.
Do not add dependencies to package.json unless the spec file explicitly lists them as
peer dependencies; adapters receive their SDK clients as constructor arguments instead.
```
