# Configuration (`AuthConfig`)

`AuthDrawer` takes an optional `config?: AuthConfig`. Every field is optional and
deep-merged over `DEFAULT_CONFIG`. Import `DEFAULT_CONFIG` from the package to
read or extend the defaults.

```ts
type AuthConfig = {
  ui?: AuthUiConfig;            // appearance + form behavior
  triggers?: AuthTriggerConfig; // see triggers.md
  normalizeError?: AuthErrorNormalizer; // see errors.md
};
```

## The `ui` namespace

```ts
type AuthUiConfig = {
  auth?: AuthConfigGroup;          // providers, flags, initial mode, email autocomplete
  copy?: AuthCopyConfig;           // all user-facing strings
  presentation?: AuthPresentationConfig;  // drawer vs modal, defaultOpen
  visual?: { backdrop?: AuthBackdropConfig };
  motion?: Partial<MotionSettings>; // low-level drag/entry/exit/layout tuning
  footer?: ReactNode;              // fully custom footer; overrides copy.footer
  success?: AuthSuccessConfig;     // post-auth success commit timing and copy
};
```

### `ui.auth` — form behavior and providers

```ts
type AuthConfigGroup = {
  providers?: AuthProviderEntry[];  // [] disables OAuth entirely
  oauthLayout?: "row" | "column";
  oauthOverflow?: { visibleCount?: number; showPreviewIcons?: boolean };
  showProviderIcons?: boolean;      // default logo visibility, default true
  allowRegister?: boolean;
  showRememberMe?: boolean;
  initialMode?: "login" | "register" | "resetPassword";
  showForgotPassword?: boolean;
  showLivePasswordMatch?: boolean;
  showFooter?: boolean;
  emailAutocomplete?: { enabled?: boolean; domains?: string[] };
};
```

Built-in `OAuthProvider` ids (each ships an icon + label): `github`, `google`,
`apple`, `discord`, `tiktok`, `x`, `facebook`, `microsoft`, `gitlab`, `twitch`,
`linkedin`, `spotify`, `slack`, `reddit`, `notion`, `figma`. The type also
accepts **any other string** for custom providers.

**Provider entries** can be a bare id or a rich object — use the object form for
custom icons, labels, light/dark logos, or to hide a logo:

```ts
type OAuthIconSource =
  | ComponentType<{ className?: string }>  // component
  | ReactElement                           // <MyLogo />
  | string;                                // image URL -> <img>

type OAuthProviderConfig = {
  id: OAuthProvider;            // built-in id or any custom string
  label?: string;              // overrides default/copy label
  showIcon?: boolean;          // overrides showProviderIcons for this provider
  icon?: OAuthIconSource;      // logo for all themes
  iconLight?: OAuthIconSource; // logo on light surfaces (falls back to icon)
  iconDark?: OAuthIconSource;  // logo on dark surfaces (falls back to icon)
};

type AuthProviderEntry = OAuthProvider | OAuthProviderConfig;
```

```ts
providers: [
  "github",                                              // built-in icon + label
  { id: "google", label: "Continue with Google" },
  { id: "acme", label: "Acme SSO", icon: "/acme.svg" }, // custom image logo
  { id: "sso", label: "Company SSO", showIcon: false }, // label-only button
  { id: "keycloak", label: "Keycloak",
    iconLight: "/keycloak-dark.svg",                     // light surfaces
    iconDark: "/keycloak-white.svg" },                   // dark surfaces (.dark)
]
```

- **No logos:** set `showProviderIcons: false` (global) or `showIcon: false` (per provider).
- **Light/dark:** `iconLight`/`iconDark` switch via the `.dark` ancestor class (CSS, SSR-safe). Built-in monochrome marks use `currentColor` and adapt automatically.
- Custom provider ids must match what the adapter's `signInWithOAuth(provider)` expects.

> Note: these flags refine UI that the **adapter already enables**. They cannot
> reveal a tab the adapter doesn't support — e.g. `allowRegister: true` does
> nothing if the adapter has no `signUp`. See adapters.md feature detection.

### `ui.presentation` — drawer or modal

```ts
type AuthPresentationConfig = {
  variant?: "drawer" | "modal";   // default "drawer"
  defaultOpen?: boolean;          // open on mount (uncontrolled)
};
```

### `ui.visual.backdrop` — backdrop styling

```ts
type AuthBackdropConfig = {
  color?: string;
  opacity?: number;
  blur?: number;                  // px
  gradient?: { angle?: number; from?: string; to?: string; fromPos?: number; toPos?: number };
};
```

### `ui.motion` — drag/animation/layout (advanced)

`Partial<MotionSettings>` — fine-grained Framer Motion + layout tuning. Keys
include `displayMode`, `desktopWidth`, `desktopPosition` (`center`/`left`/`right`),
drag physics (`upwardResistance`, `downwardThreshold`, `velocityThreshold`,
`snapStiffness`, `snapDamping`, `snapMass`), entry/exit timing (`entryDuration`,
`entryDelay`, `entryScale`, `entryY`, `entryEase`, and the `exit*` equivalents),
backdrop motion, and form layout (`formPaddingTop`, `formJustify`, etc.). Only set
what you need; the rest come from defaults. Most apps never touch this.

### `ui.success` — post-auth commit state

After sign-in, sign-up, or OAuth succeeds, the drawer does **not** close
immediately. It stays open through the connecting/loading phase, shows a
confirmation once the session is fully loaded, then closes — so the drawer never
disappears before the session is ready. Tune it with `ui.success`:

```ts
type AuthSuccessConfig = {
  enabled?: boolean;               // default true; false = close immediately on success
  minVisibleMs?: number;           // dwell AFTER the session is ready (ms), default 900
  maxVisibleMs?: number;           // failsafe cap while the session is pending (ms), default 3500
  messages?: Partial<Record<"signIn" | "signUp" | "oauth", string>>;
  footer?: ReactNode;              // replaces default success message
};
```

`minVisibleMs` is measured from when the session becomes ready (authenticated
and no longer pending), not from when the banner appears — so the confirmation
never flashes and vanishes the instant auth completes. `maxVisibleMs` only kicks
in while the session is still pending, as a failsafe for one that never loads.
Set `enabled: false` to close immediately on success. `onSuccess` callbacks still
fire when the action completes; this only controls visible confirmation timing.

### `ui.copy` — text overrides

Override any label, heading, button text, or message via `AuthCopyConfig`. Groups
include fields, form, oauth, rememberMe, forgotPassword, footer, validation,
close, and trigger copy. For a fully custom footer node, use `ui.footer` (it
overrides `copy.footer` segments). Use `formatCopy` / `resolveCopyGroup` /
`DEFAULT_COPY` (exported from the package) if you need to compute copy.

## `DEFAULT_CONFIG` (current defaults)

```ts
{
  ui: {
    auth: {
      providers: ["github", "google"],
      oauthLayout: "column",
      showProviderIcons: true,
      allowRegister: true,
      showRememberMe: true,
      initialMode: "login",
      showForgotPassword: true,
      showLivePasswordMatch: true,
      emailAutocomplete: {
        enabled: true,
        domains: ["gmail.com", "outlook.com", "hotmail.com", "icloud.com", "yahoo.com"],
      },
    },
    presentation: { variant: "drawer", defaultOpen: false },
    visual: {
      backdrop: {
        color: "#070708", opacity: 0.85, blur: 6,
        gradient: { angle: 180, from: "transparent", to: "#070708", fromPos: 100, toPos: 100 },
      },
    },
    motion: { displayMode: "drawer", desktopWidth: "448px", desktopPosition: "center" /* + drag/entry/exit */ },
    success: {
      enabled: true,
      minVisibleMs: 900,
      maxVisibleMs: 3500,
      messages: { signIn: "Signed in", signUp: "Account created", oauth: "Signed in with provider" },
    },
  },
  triggers: {},
}
```

## Email autocomplete

The email field offers inline domain completion when the user types `@`.

```ts
// disable
config = { ui: { auth: { emailAutocomplete: { enabled: false } } } };

// custom domains
config = { ui: { auth: { emailAutocomplete: { enabled: true, domains: ["company.com", "gmail.com"] } } } };
```

## CSS theme tokens

Override the shipped overlay theme with the existing CSS custom properties. The
tokens use HSL components, not hex values:

```css
:root {
  --surface-overlay: 34 12% 82%;
  --text-on-overlay: 24 18% 14%;
  --border-overlay: 28 12% 54%;
}

.dark {
  --surface-overlay: 0 0% 7.5%;
  --text-on-overlay: 0 0% 96%;
  --border-overlay: 0 0% 100%;
}
```

There is no `cad-*` theme API; use the tokens above when documenting
customization.

## Controlled vs uncontrolled open state

`AuthDrawer` props beyond `adapter`/`config`:

- `hideTrigger?: boolean` — hide the built-in floating trigger button; open the
  drawer from your own UI instead.
- `open?: boolean` + `onOpenChange?: (open) => void` — controlled mode. If you
  pass `open`, it takes precedence over provider-managed and uncontrolled state,
  and you must update it from `onOpenChange` (fires on drag-dismiss, backdrop
  click, Escape, close button).
- `defaultOpen?: boolean` — uncontrolled initial open state (ignored if `open`
  is set).
- `className?: string` — classes on the built-in trigger button.
- `onSuccess` / `onError` — lifecycle callbacks (`action` is
  `"signIn" | "signUp" | "signOut" | "oauth"`).
- `triggerStore?: AuthTriggerStore` — see triggers.md.
