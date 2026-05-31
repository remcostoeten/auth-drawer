import type { AuthConfig } from "@remcostoeten/auth-drawer";

export const authDrawerConfig = {
  ui: {
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
        subtitle: "Sign in to the Passport example app",
      },
      register: {
        subtitle: "Create an account",
      },
    },
  },
} satisfies AuthConfig;
