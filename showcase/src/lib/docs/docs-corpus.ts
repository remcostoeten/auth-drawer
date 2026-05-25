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
    id: "handlers",
    title: "Auth handlers and adapters",
    href: "/docs#start",
    body: "Bring your own auth backend. Pass async handlers through onCredential and onOAuth, or use a typed AuthAdapter that routes signIn, signUp, signOut, OAuth, forgot-password, and reset-password actions directly. Supported adapter factories include Better Auth, Supabase, NextAuth, Clerk, Firebase, Custom JWT, Passport, and the built-in mock adapter.",
  },
  {
    id: "defaults",
    title: "Default configuration",
    href: "/docs#showcase",
    body: "DEFAULT_CONFIG includes GitHub and Google OAuth, login and register tabs, remember-me, forgot-password, backdrop, drag behavior, trigger hooks, drawer and modal presentation, desktop width, position, and open trigger defaults.",
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
    body: "AuthDrawer top-level props include config, adapter, open, defaultOpen, onOpenChange, hideTrigger, onSuccess, and onError. When adapter is present, unsupported UI is hidden automatically and registration can request a name field via adapter.requiresName.",
  },
  {
    id: "api-auth-provider",
    title: "AuthProvider",
    href: "/docs#api",
    body: "AuthProvider exposes global auth state and drawer controls through useAuth. It calls adapter.useSession internally and shares user, session, loading, and signOut behavior across the app.",
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
    id: "api-visual",
    title: "ui.visual config",
    href: "/docs#api-visual",
    body: "ui.visual controls static visual backdrop properties. Animated backdrop values that move with open and close transitions live under ui.motion.",
  },
  {
    id: "api-motion",
    title: "ui.motion config",
    href: "/docs#api-motion",
    body: "ui.motion controls drawer and modal layout, display, entry and exit animation, easing, drag physics, mobile drag-to-dismiss thresholds, and animated backdrop behavior.",
  },
];
