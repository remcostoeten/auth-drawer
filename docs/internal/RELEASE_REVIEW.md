# Auth Drawer Release Review

Date: 2026-05-16

Verdict: not release ready. The app builds and the package tests pass, but the publish surface is incomplete and several public configuration areas are either too narrow, duplicated, or demo-only.

## Verification Run

- `bun run --cwd .. build` from `showcase/`: passed.
- `bun run --cwd .. typecheck` from `showcase/`: passed, but only `@remcostoeten/auth-drawer` has a `typecheck` task.
- `bun run --cwd .. test` from `showcase/`: passed, 3 files and 8 tests.
- `bun run --cwd .. lint` from `showcase/`: passed, but only `showcase` has a `lint` task.
- `npm pack --dry-run --json` in `packages/auth-drawer`: produced only `dist/index.js` and `package.json`.

## Release Blockers

### 1. Package Cannot Be Published

`packages/auth-drawer/package.json` has `"private": true` and version `0.0.0`.

Evidence:

- `packages/auth-drawer/package.json:2-4`

Impact: npm publish is blocked outright, and the current version is not a real release version.

Required fix:

- Set `private` to false or remove it before public release.
- Choose a real semver version.
- Add package metadata: `description`, `license`, `repository`, `homepage`, `bugs`, `keywords`, and `author` if desired.

### 2. Declared Type Export Does Not Exist

The package exports `./dist/index.d.ts`, but the build only emits `dist/index.js`. `tsconfig.json` has `noEmit: true`, and Vite is not configured with a declaration plugin.

Evidence:

- `packages/auth-drawer/package.json:6-10`
- `packages/auth-drawer/tsconfig.json:10`
- `packages/auth-drawer/vite.config.ts:7-24`
- `npm pack --dry-run --json` included no `.d.ts` files.

Impact: TypeScript consumers will fail to resolve package types from the published package.

Required fix:

- Add declaration generation, for example `tsc --emitDeclarationOnly` with a release tsconfig or `vite-plugin-dts`.
- Make `build` emit declarations into `dist`.
- Keep `exports["."].types` pointed at the generated file.

### 3. CSS Export Is Broken

The package exports `./styles.css` as `./styles/tokens.css`, but `packages/auth-drawer/styles/` is empty and the dry-run tarball contains no CSS.

Evidence:

- `packages/auth-drawer/package.json:11-15`
- `showcase/src/components/docs/docs-page.tsx:546-550`
- `npm pack --dry-run --json` included no `styles/tokens.css`.

Impact: The install docs tell users to import CSS that does not exist in the published package.

Required fix:

- Copy or generate the token CSS into `packages/auth-drawer/styles/tokens.css`.
- Add a smoke test that imports `@remcostoeten/auth-drawer/styles.css` from a packed tarball.

### 4. Registry File References Missing Style Asset

`registry/auth-drawer.json` includes `styles/tokens.css`, but that file is missing from the package.

Impact: shadcn-style registry installation will be incomplete.

Required fix:

- Add the style asset to the package, or remove the registry style entry until it exists.

### 5. Package Lint Is Not Wired

Root `bun run lint` only ran `showcase:lint`. The publishable package has no `lint` script.

Evidence:

- `packages/auth-drawer/package.json:20-26`
- Verification output: only `showcase:lint` executed.

Impact: release CI can report green while the package source is never linted.

Required fix:

- Add `lint` and `format:check` scripts to `packages/auth-drawer`.
- Make root CI run build, typecheck, test, lint, and pack validation.

## Missing Public Props And Config Options

### 1. Hard-Coded Copy

The form title, subtitle, divider copy, terms copy, terms/privacy URLs, submit labels, mode-switch labels, forgot-password label, and success notice are hard-coded.

Evidence:

- `packages/auth-drawer/src/ui/login-form.tsx:86-90`
- `packages/auth-drawer/src/ui/login-form.tsx:337-346`
- `packages/auth-drawer/src/ui/login-form.tsx:416-424`
- `packages/auth-drawer/src/ui/login-form.tsx:432-452`
- `packages/auth-drawer/src/ui/login-form.tsx:458-470`

Impact: teams cannot ship this broadly across products, brands, languages, legal flows, or tone-of-voice requirements.

Recommended config:

```ts
type AuthCopyConfig = {
  loginTitle?: string;
  loginSubtitle?: string;
  registerTitle?: string;
  registerSubtitle?: string;
  oauthDivider?: string;
  loginSubmit?: string;
  registerSubmit?: string;
  forgotPassword?: string;
  forgotPasswordLoading?: string;
  resetSentNotice?: string;
  switchToLogin?: string;
  switchToRegister?: string;
  legalText?: string;
  termsLabel?: string;
  termsHref?: string;
  privacyLabel?: string;
  privacyHref?: string;
};
```

### 2. Built-In Trigger Button Is Not Configurable

Only `className` can be passed, and it only styles the built-in trigger button. The label remains `Account`, with `Open`/`Close` hard-coded.

Evidence:

- `packages/auth-drawer/src/ui/auth-drawer.tsx:36-44`
- `packages/auth-drawer/src/ui/auth-drawer.tsx:547-570`

Impact: consumers must hide the trigger and build their own for common use cases like "Sign in", "Upgrade", "Join", navbar avatars, paywall CTAs, or icon-only buttons.

Recommended props:

- `triggerLabel`
- `triggerDescription`
- `triggerIcon`
- `renderTrigger`
- `triggerClassName` instead of ambiguous `className`

### 3. Form Fields Are Not Extensible

Credential auth only supports email, password, confirm password, and remember-me. There is no way to request name, username, invite code, organization name, phone, TOTP, passkey, magic link, or custom metadata.

Evidence:

- `packages/auth-drawer/src/types.ts:325-330`
- `packages/auth-drawer/src/ui/login-form.tsx:138-177`

Impact: the component is useful for a narrow demo auth flow, but not enough for many production signup requirements.

Recommended options:

- `ui.auth.fields`
- `ui.auth.requireName`
- `ui.auth.showMagicLink`
- `ui.auth.showPasskey`
- `onMagicLink`
- `onPasskey`
- `onValidateCustomFields`
- `metadata` in `CredentialAuthInput`

### 4. OAuth Providers Are Closed

`OAuthProvider` is only `"github" | "google"`, and provider labels/icons are internal.

Evidence:

- `packages/auth-drawer/src/types.ts:4-8`
- `packages/auth-drawer/src/ui/oauth-buttons.tsx:16-19`

Impact: consumers cannot add Apple, Discord, Microsoft, GitLab, Slack, SAML, OIDC, custom providers, custom icons, provider order metadata, or provider-specific disabled states without editing package code.

Recommended replacement:

```ts
type OAuthProviderConfig = {
  id: string;
  label: string;
  icon?: ComponentType;
  disabled?: boolean;
};
```

Then make `adapter.signInWithOAuth` receive the provider id or full provider object.

### 5. Layout Slots Are Missing

There are no slots before/after the header, fields, OAuth group, submit button, legal text, or footer.

Impact: apps cannot add SSO notes, security badges, enterprise disclaimers, invite banners, product-specific benefits, custom legal blocks, or support links without forking.

Recommended props:

- `headerSlot`
- `beforeFields`
- `afterFields`
- `beforeSubmit`
- `footerSlot`
- `legalSlot`
- `renderHeader`
- `renderFooter`

### 6. Error Copy Is Not Configurable

Default error messages are internal constants.

Evidence:

- `packages/auth-drawer/src/auth-errors.ts:52-68`

Impact: teams cannot localize, tone-match, or map backend-specific error codes without replacing the entire normalizer.

Recommended config:

- `ui.copy.errors?: Partial<Record<AuthErrorCode, string>>`
- Keep `normalizeError` for structural mapping, but let copy be configured separately.

### 7. Motion Config Is Too Raw For Public API

`MotionSettings` exposes many low-level fields directly, with broad `string` types for `formJustify`, `formAlign`, and ease values.

Evidence:

- `packages/auth-drawer/src/types.ts:348-380`
- `showcase/src/components/debug/auth-drawer-lab.tsx:1425-1647`

Impact: the API is powerful but easy to misuse. Invalid CSS strings or invalid easing strings can ship directly into runtime style/motion values.

Recommended fix:

- Keep raw motion as an advanced escape hatch.
- Add release-friendly presets: `motionPreset?: "calm" | "snappy" | "minimal"`.
- Narrow `formJustify`, `formAlign`, `entryEase`, and `exitEase` to documented unions or validated values.

### 8. Controlled Form State Is Missing

Consumers cannot control or prefill `email`, current mode, remember-me, or reset state on close.

Impact: deep links, prefilled checkout email, invite flows, remembered emails, and external auth state cannot be cleanly integrated.

Recommended props/config:

- `initialEmail`
- `email`
- `onEmailChange`
- `mode`
- `onModeChange`
- `rememberMe`
- `onRememberMeChange`
- `resetOnClose`

## Redundant Or Confusing Configuration

### 1. `presentation.variant` And `motion.displayMode` Duplicate Each Other

The drawer resolves `presentation.variant`, then forces `motion.displayMode` from it.

Evidence:

- `packages/auth-drawer/src/ui/auth-drawer.tsx:116-141`
- `packages/auth-drawer/src/ui/auth-drawer.tsx:179-199`
- `showcase/src/components/debug/auth-drawer-lab.tsx:1036-1046`

Impact: users can set both and expect both to matter, but one wins. The public API should have one canonical surface mode.

Recommended fix:

- Keep `ui.presentation.variant` as canonical.
- Deprecate or internalize `motion.displayMode`.

### 2. Backdrop Config Exists Twice

Backdrop fields are exposed under both `ui.visual.backdrop` and `ui.motion.backdrop*`. The resolver gives `ui.visual.backdrop` precedence.

Evidence:

- `packages/auth-drawer/src/ui/auth-drawer.tsx:80-113`
- `packages/auth-drawer/src/types.ts:57-68`
- `packages/auth-drawer/src/types.ts:368-375`
- `showcase/src/components/debug/auth-drawer-lab.tsx:1362-1422`
- `showcase/src/components/debug/auth-drawer-lab.tsx:1561-1615`

Impact: the lab exposes two sets of backdrop controls, so users can change one and see no effect when the other overrides it.

Recommended fix:

- Make `ui.visual.backdrop` the only public backdrop API.
- Remove or mark motion backdrop fields as legacy/internal.

### 3. `className` Name Is Ambiguous

`className` styles only the trigger button, not the drawer root or panel.

Evidence:

- `packages/auth-drawer/src/ui/auth-drawer.tsx:36-44`
- `packages/auth-drawer/src/ui/auth-drawer.tsx:567-574`

Impact: consumers will reasonably expect `className` to style the component root.

Recommended fix:

- Rename to `triggerClassName`.
- Add `panelClassName`, `overlayClassName`, and `contentClassName` if styling hooks are needed.

### 4. `defaultOpen` Exists In Two Places

`defaultOpen` is both a direct prop and `ui.presentation.defaultOpen`.

Evidence:

- `packages/auth-drawer/src/ui/auth-drawer.tsx:36-44`
- `packages/auth-drawer/src/types.ts:130-138`
- `packages/auth-drawer/src/ui/auth-drawer.tsx:203-205`

Impact: it is unclear which one consumers should prefer.

Recommended fix:

- Keep direct `defaultOpen` as the React component convention.
- Remove `ui.presentation.defaultOpen`, or document it as config-only for generated presets.

### 5. Lab Config Code Omits Handlers

The lab generates usage code with only `ui` and `triggers`, while the actual live config also includes scenario auth handlers.

Evidence:

- `showcase/src/components/debug/auth-drawer-lab.tsx:1056-1057`
- `showcase/src/components/debug/auth-drawer-lab.tsx:1074-1081`

Impact: copied code looks complete but cannot authenticate unless users pass a real auth adapter.

Recommended fix:

- Include adapter setup in generated code.
- Add a warning when copied code omits `adapter={authAdapter}`.

## Missing Release Documentation

### 1. README Is Still Lab-Oriented

The root README describes a playground, not a public package.

Evidence:

- `README.md:1-25`

Required docs before marketing:

- Product positioning.
- Install instructions.
- CSS import instructions that actually work.
- Minimal usage.
- Controlled usage.
- OAuth/no-OAuth examples.
- Backend integration examples.
- Trigger examples.
- Props table.
- Styling/theming guide.
- Accessibility notes.
- Browser support.
- Release/version badge.

### 2. API Docs Point At Local Wrapper

`API.md` starts with imports from `@/components/auth/auth-drawer`, not from the npm package.

Evidence:

- `API.md:5-25`

Impact: public docs are not copy-pasteable for package consumers.

Required fix:

- Make `@remcostoeten/auth-drawer` the primary import path.
- Keep local wrapper notes only in a development section.

### 3. Showcase API Table Is Too High-Level

The docs page lists broad groups like `ui.auth` and `ui.motion`, but not every option.

Evidence:

- `showcase/src/components/docs/docs-page.tsx:82-110`
- `showcase/src/components/docs/docs-page.tsx:658-667`

Impact: the marketing/docs page is attractive, but not enough for adoption.

Required fix:

- Generate the docs table from the exported types or keep a manually complete table.
- Include defaults and examples for every public field.

## Missing Tests

Current tests cover error normalization, credential validation, and empty OAuth providers. That is not enough for release.

Add tests for:

- npm package contents: JS, CSS, declarations, package metadata.
- `@remcostoeten/auth-drawer/styles.css` import resolution.
- controlled `open` / `onOpenChange`.
- uncontrolled `defaultOpen`.
- `hideTrigger`.
- `className`/renamed trigger class behavior.
- empty providers hiding divider.
- register disabled forcing login mode.
- forgot-password hidden/visible behavior.
- live password match disabled/enabled behavior.
- trigger store policies: `once`, `cooldownMs`, `every`, `sampleRate`, `scope`.
- click trigger document listener.
- page-load trigger delay cleanup.
- scroll trigger hook behavior.
- keyboard Escape close and focus return.

## Release Checklist

- [ ] Make the package publishable.
- [ ] Emit `.d.ts` files.
- [ ] Ship working CSS export.
- [ ] Validate `npm pack` contents in CI.
- [ ] Add package lint script.
- [ ] Decide canonical config shape for presentation and backdrop.
- [ ] Add copy/legal configuration.
- [ ] Add trigger customization or render prop.
- [ ] Add provider registry/config support.
- [ ] Add form slots or render hooks.
- [ ] Add real README for package consumers.
- [ ] Rewrite API docs to use package imports.
- [ ] Expand test coverage around public behavior.
- [ ] Run packed-tarball smoke test in a clean consumer app.

## Suggested Release Positioning

Market this after the package surface is fixed as:

> A backend-agnostic React auth drawer with typed config, OAuth and credentials, controlled state, trigger policies, and production-ready motion.

Do not market it yet as production-ready until CSS, declarations, package metadata, and configurable copy/legal are fixed.
