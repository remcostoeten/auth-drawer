export type DocsSnippet = {
  id: string;
  title: string;
  href: string;
  body: string;
};

export const docsCorpus: DocsSnippet[] = [
  {
    id: "start",
    title: "What Auth Drawer is",
    href: "/docs#start",
    body: "Auth Drawer is a configurable animated authentication surface for React. It can render as a mobile bottom-sheet drawer or a centered desktop modal. A type-safe config object controls visual, motion, behavior, copy, OAuth, and trigger details.",
  },
  {
    id: "install",
    title: "Install Auth Drawer",
    href: "/docs#installation",
    body: "Install @remcostoeten/auth-drawer and render AuthDrawer. Styles ship with the component import. No Tailwind setup and no separate CSS file are required for consumers.",
  },
  {
    id: "adapters",
    title: "Auth adapters",
    href: "/docs#start",
    body: "Use a typed AuthAdapter to route signIn, signUp, signOut, OAuth, forgot-password, and reset-password actions directly. Supported adapter factories include Better Auth, Supabase, NextAuth, Clerk, Firebase, Custom JWT, Passport, and createMockAdapter. AuthProvider and useAuth expose the same adapter-backed session state across the app.",
  },
  {
    id: "defaults",
    title: "Default configuration",
    href: "/docs#showcase",
    body: "DEFAULT_CONFIG includes GitHub and Google OAuth, login and register tabs, remember-me, forgot-password, backdrop, drag behavior, trigger hooks, drawer and modal presentation, desktop width, position, and open trigger defaults.",
  },
  {
    id: "sdk-adapters",
    title: "SDK adapter setup",
    href: "/docs#sdk-adapters",
    body: "SDK adapter docs show complete frontend setup for Supabase, Better Auth, NextAuth/Auth.js, Clerk, Firebase Auth, Custom JWT/REST, Passport cookie sessions, and createMockAdapter. Each provider documents install commands, import paths, supported features, required client shape, AuthDrawer usage, AuthProvider compatibility, and adapter options.",
  },
  {
    id: "sdk-supabase",
    title: "Supabase SDK adapter",
    href: "/docs#sdk-supabase",
    body: "The Supabase subsection shows the browser client shape, required auth.auth methods, redirect parameters, session mapping, and magic-link support exposed through adapter.features.",
  },
  {
    id: "sdk-better-auth",
    title: "Better Auth SDK adapter",
    href: "/docs#sdk-better-auth",
    body: "The Better Auth subsection shows createAuthClient usage, required signIn/signUp/signOut/requestPasswordReset/session hooks, and optional plugin support surfaced through adapter.features.",
  },
  {
    id: "sdk-next-auth",
    title: "NextAuth SDK adapter",
    href: "/docs#sdk-next-auth",
    body: "The NextAuth subsection shows the client object passed into createNextAuthAdapter, credential redirect:false behavior, OAuth redirects, and session mapping through useSession.",
  },
  {
    id: "sdk-clerk",
    title: "Clerk SDK adapter",
    href: "/docs#sdk-clerk",
    body: "The Clerk subsection shows the client hook shape required by createClerkAdapter, including useSignIn, useSignUp, useUser, callbackURL handling, and the requireName option.",
  },
  {
    id: "sdk-firebase",
    title: "Firebase SDK adapter",
    href: "/docs#sdk-firebase",
    body: "The Firebase subsection shows the modular auth functions the adapter expects, providerFactory usage, onAuthStateChanged session mapping, and password reset/update flows.",
  },
  {
    id: "sdk-custom-jwt",
    title: "Custom JWT adapter",
    href: "/docs#sdk-custom-jwt",
    body: "The Custom JWT subsection shows how to bind login/register/logout/profile endpoints, control token storage, and point OAuth redirects at your own backend.",
  },
  {
    id: "sdk-passport",
    title: "Passport adapter",
    href: "/docs#sdk-passport",
    body: "The Passport subsection shows the cookie-session endpoints expected by createPassportAdapter and how the drawer maps them into login, signup, and session state.",
  },
  {
    id: "sdk-mock",
    title: "createMockAdapter",
    href: "/docs#sdk-mock",
    body: "The createMockAdapter subsection shows how to use the built-in demo adapter for local development, docs, and visual regression checks when no backend is connected.",
  },
  {
    id: "oauth",
    title: "OAuth providers",
    href: "/docs#oauth",
    body: "Built-in OAuth providers: GitHub, Google, Apple, Discord, and TikTok. Pass them via ui.auth.providers; array order is display order. DEFAULT_CONFIG uses GitHub and Google. OAuth docs also cover visible provider count, overflow disclosure, social sign-in copy, and previewing default or overflow provider layouts.",
  },
  {
    id: "triggers",
    title: "Open triggers",
    href: "/docs#triggers",
    body: "Triggers can open the auth surface on page load, scroll progress, click selectors, state changes, idle timers, or custom events. Shared trigger policy fields include once, cooldown, sampleRate, and persistence scope.",
  },
  {
    id: "configurator",
    title: "Configurator",
    href: "/docs#configurator",
    body: "The configurator edits auth flags, visual styles, copy, motion, and behavior. It previews the drawer and outputs usage code for the selected configuration.",
  },
  {
    id: "api-auth-drawer",
    title: "AuthDrawer props",
    href: "/docs#api",
    body: "AuthDrawer top-level props include config, adapter, open, defaultOpen, onOpenChange, hideTrigger, onSuccess, and onError. The config can also enable a built-in success commit state via ui.success so successful sign-in, sign-up, and OAuth actions keep the drawer open until the session is fully loaded, show a confirmation, then close. When adapter is present, unsupported UI is hidden automatically and registration can request a name field via adapter.requiresName.",
  },
  {
    id: "api-auth-provider",
    title: "AuthProvider",
    href: "/docs#api",
    body: "AuthProvider exposes global auth state and drawer controls through the useAuth hook: user, session, isPending, error, signIn, signUp, signInWithOAuth, signOut, openDrawer, closeDrawer, and isDrawerOpen. useAuth throws when used outside an AuthProvider; useOptionalAuth returns the same value or null, for shared components that may render without a provider. When AuthDrawer is rendered inside the provider without open/onOpenChange props, it follows provider openDrawer and closeDrawer controls and reuses the provider's adapter-backed session state. Add a root div with id auth-drawer-portal so the drawer portals above page content. Explicit controlled props remain available.",
  },
  {
    id: "api-auth",
    title: "ui.auth config",
    href: "/docs#api-auth",
    body: "ui.auth controls form surface flags and initial state, including login/register availability, initial tab, OAuth providers, overflow behavior, forgot password, and remember me.",
  },
  {
    id: "api-copy",
    title: "ui.copy config",
    href: "/docs#api-copy",
    body: "ui.copy controls user-facing strings in the drawer, including headings, field labels, button text, OAuth labels, validation messages, and normalized error copy.",
  },
  {
    id: "api-success",
    title: "ui.success config",
    href: "/docs#api-success",
    body: "ui.success controls the post-auth success commit state: the drawer stays open until the session is fully loaded, shows a confirmation, then closes. Enable or disable it, set minVisibleMs (the dwell after the session is ready, default 900), cap the maximum hold time with maxVisibleMs (failsafe while pending, default 3500), and override the success text for sign-in, sign-up, and OAuth actions.",
  },
  {
    id: "api-visual",
    title: "ui.visual config",
    href: "/docs#api-visual",
    body: "ui.visual controls static visual backdrop properties. Animated backdrop values that move with open and close transitions live under ui.motion. Override the bundled CSS theme with --surface-overlay, --text-on-overlay, and --border-overlay tokens.",
  },
  {
    id: "api-motion",
    title: "ui.motion config",
    href: "/docs#api-motion",
    body: "ui.motion controls drawer and modal layout, display, entry and exit animation, easing, drag physics, mobile drag-to-dismiss thresholds, and animated backdrop behavior.",
  },
];
