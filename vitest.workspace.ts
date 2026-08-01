import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/auth-drawer",
  {
    test: {
      name: "auth-drawer-tests",
      root: ".",
      include: ["packages/__tests__/**/*.{test,spec}.{ts,tsx}"],
      environment: "jsdom",
      globals: true,
      server: {
        fs: { allow: ["."] },
      },
      plugins: [],
    },
  },
]);
