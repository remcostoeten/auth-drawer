# AI Agent Execution Prompts

To get the best results when working with an AI coding agent, execute the implementation roadmap in granular phases. Below are ready-to-use prompts corresponding to each phase.

---

## Prompt 1: Phase 1 (Core Setup & Types)

```markdown
We are building a framework-agnostic adapter architecture for our Cozy Auth Drawer. Before coding, review these guidelines in the project root:
- DRY Adapter Design Plan: DRY_ADAPTER_PLAN.md
- Coding style requirements: IMPLEMENTATION_ROADMAP.md (strictly avoid React.FC, import ReactNode directly).

For this task:
1. Append the unified adapter types (`AuthResult`, `AuthSessionState`, `CredentialAuthInput`, `ResetPasswordInput`, and `AuthAdapter`) to the end of `packages/auth-drawer/src/types.ts` as specified in Task 1.1 of the roadmap.
2. Create the file `packages/auth-drawer/src/errors.ts` to implement `createAdapterError()` as specified in Task 1.2.
3. Verify that the files compile successfully by running:
   cd packages/auth-drawer && bun run typecheck
```

---

## Prompt 2: Phase 2 (First-Party Adapters)

```markdown
We have defined our core adapter types. Now we need to implement first-party adapters.
First, refer to the specs inside the `specs/` directory:
- specs/better-auth.md
- specs/supabase.md
- specs/next-auth.md

Tasks:
1. Create `packages/auth-drawer/src/adapters/better-auth.ts` implementing `betterAuthAdapter()`. Ensure dynamic check for client plugin methods (`magicLink`, `emailOtp`, `anonymous`) is fully supported.
2. Create `packages/auth-drawer/src/adapters/supabase.ts` implementing `supabaseAdapter()`. Use standard React `useState` and `useEffect` to subscribe to session changes via `onAuthStateChange`.
3. Create `packages/auth-drawer/src/adapters/next-auth.ts` implementing `nextAuthAdapter()`.
4. Configure package exports inside `packages/auth-drawer/package.json` to expose these adapters via tree-shakeable subpaths:
   - `./adapters/better-auth`
   - `./adapters/supabase`
   - `./adapters/next-auth`
5. Compile and check types:
   cd packages/auth-drawer && bun run typecheck
```

---

## Prompt 3: Phase 2 (Custom REST & Passport Adapters)

```markdown
Next, implement custom endpoints and Passport.js client integrations.
Refer to the specs inside the `specs/` directory:
- specs/custom-jwt.md
- specs/passport.md

Tasks:
1. Create `packages/auth-drawer/src/adapters/custom-jwt.ts` implementing `customJwtAdapter()`.
2. Create `packages/auth-drawer/src/adapters/passport.ts` implementing `passportAdapter()`.
3. Export these adapters in `packages/auth-drawer/package.json` and `packages/auth-drawer/src/index.ts`.
4. Run `bun run typecheck` to verify compilation.
```

---

## Prompt 4: Phase 3 (AuthDrawer Refactoring)

```markdown
We need to refactor the main visual component to consume the new adapter system.

Tasks:
1. Modify `packages/auth-drawer/src/ui/auth-drawer.tsx` (and nested form elements) to accept `adapter?: AuthAdapter` in its props.
2. If `adapter` is present, override the legacy mock handlers:
   - Redirect credentials inputs to `adapter.signIn` or `adapter.signUp`.
   - Redirect forgot password inputs to `adapter.requestPasswordReset`.
3. Refactor form submission handlers inside the nested UI forms to use the React `useTransition` hook for loading states as specified in Task 3.2. Do not use legacy manual boolean loaders.
4. Run compilation and check style compliance:
   cd packages/auth-drawer && bun run typecheck
```

---

## Prompt 5: Phase 4 (Provider Context, Mocking, and Tests)

```markdown
Finalize the implementation by wrapping the adapter in a global context and shipping a sandbox mock adapter.
Refer to the guide in:
- ADVANCED_ADAPTER_SUGGESTIONS.md

Tasks:
1. Create `packages/auth-drawer/src/ui/auth-provider.tsx` implementing the global `AuthProvider` context and `useAuth()` hook. Avoid `React.FC`, import `ReactNode` directly.
2. Create `packages/auth-drawer/src/adapters/mock.ts` implementing `mockAdapter()`.
3. Ensure the Drawer UI dynamically detects `adapter.features` to render Magic Link tabs if supported.
4. Build the package and verify unit tests pass:
   cd packages/auth-drawer && bun run test && bun run build
```

---

## Prompt 6: Forgot Password UI & Reset Password Integration

```markdown
We need to implement the Forgot Password request flow and the new Password Reset Form view inside the Cozy Auth Drawer.

References:
- IMPLEMENTATION_ROADMAP.md (Phase 3 refactoring)
- packages/auth-drawer/src/types.ts

Tasks:
1. Ensure the `FormMode` type in `packages/auth-drawer/src/types.ts` supports `"resetPassword"`:
   ```typescript
   export type FormMode = "login" | "register" | "resetPassword";
   ```
2. Refactor the trigger for the "Forgot password?" link:
   - Clicking "Forgot password" should continue to call `adapter.requestPasswordReset(email)` to send the recovery email.
   - Ensure a success notice is displayed to the user when sent successfully.
3. Implement the new **Reset Password Form Layout** inside `packages/auth-drawer/src/ui/login-form.tsx`:
   - When the drawer/form is in `mode === "resetPassword"`:
     - Hide the email input field and all social login buttons/dividers.
     - Change the header to display the password reset copy (e.g. title: "Reset your password", subtitle: "Choose a strong new password").
     - Render the **Password** and **Confirm Password** fields with live validation matching feedback underneath.
     - Render the main submit action button displaying "Reset Password".
     - Submitting the form calls `adapter.resetPassword({ newPassword: password })` wrapped in `useTransition`.
     - On successful resolution, transition the drawer back to `"login"` mode and display a success notification alert ("Your password has been reset successfully. Please sign in.").
4. Verify that typechecking and tests pass successfully:
   cd packages/auth-drawer && bun run typecheck
```
