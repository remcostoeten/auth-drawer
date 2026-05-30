import type { AuthConfig } from "@remcostoeten/auth-drawer";
import { oauthProviders } from "@/lib/oauth-providers";

export const authDrawerConfig = {
  ui: {
    auth: {
      providers: oauthProviders,
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
        subtitle: "Sign in to the custom JWT example app",
      },
    },
  },
} satisfies AuthConfig;
