import type { AuthConfig } from "@remcostoeten/auth-drawer/react";
import { oauthProviders } from "@/lib/oauth-providers";

export const authDrawerConfig = {
  ui: {
    auth: {
      // The Better Auth adapter advertises `oauthProviders` to the drawer, so
      // they render with their bundled icons.
      providers: oauthProviders,
      oauthLayout: "column",
      oauthOverflow: { visibleCount: 2 },
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
