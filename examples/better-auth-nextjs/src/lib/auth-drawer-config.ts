import type { AuthConfig } from "@remcostoeten/auth-drawer";
import { oauthProviders } from "@/lib/oauth-providers";

export const authDrawerConfig = {
  ui: {
    auth: {
      // The Better Auth adapter advertises `oauthProviders` to the drawer, so
      // these render with their bundled v0.3 icons. Set `showProviderIcons:
      // false` for label-only buttons.
      providers: oauthProviders,
      showProviderIcons: true,
      // Showcase: lay the six providers out as a compact 2-up grid and show them
      // all (no overflow disclosure) so the new v0.3 icons are visible at a glance.
      oauthLayout: "column",
      oauthOverflow: { visibleCount: 2 },
      // Rich entries — custom provider ids, custom/light-dark logos, or
      // per-provider label-only — apply when the adapter does NOT advertise a
      // provider list (e.g. a custom `createAdapter` adapter, or passing
      // `providers` only via this config). With Better Auth's advertised list,
      // the bare ids above take precedence. Example shape:
      //
      // providers: [
      //   "github",                                             // built-in icon
      //   { id: "google", label: "Continue with Google" },      // custom label
      //   { id: "acme", label: "Acme SSO", icon: "/acme.svg" }, // image-url logo
      //   { id: "keycloak", label: "Keycloak",
      //     iconLight: "/keycloak-dark.svg",                    // light surfaces
      //     iconDark: "/keycloak-white.svg" },                  // dark (.dark)
      //   { id: "okta", label: "Okta", showIcon: false },       // label-only
      // ],
    },
    visual: {
      backdrop: {
        opacity: 0.96,
        blur: 4,
        gradient: {
          angle: 180,
          from: "rgba(7, 7, 8, 0.34)",
          to: "#050505",
          fromPos: 0,
          toPos: 100,
        },
      },
    },
    copy: {
      login: {
        subtitle: "Sign in to the Better Auth example app",
      },
    },
    // New-style loading: the drawer stays open through the connecting phase and
    // holds a success confirmation until the Better Auth session is fully
    // loaded, then closes. `minVisibleMs` is the dwell *after* the session is
    // ready; `maxVisibleMs` caps how long it waits while the session is pending.
    success: {
      enabled: true,
      minVisibleMs: 900,
      maxVisibleMs: 4000,
      messages: {
        signIn: "Welcome back",
        signUp: "Account created",
        oauth: "Welcome back",
      },
    },
  },
} satisfies AuthConfig;
