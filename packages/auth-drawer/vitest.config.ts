import { resolve } from "node:path";
import react from "@vitejs/plugin-react-swc";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

const coreSrc = resolve(import.meta.dirname, "src/core");

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@remcostoeten\/auth-drawer\/core\/adapters\/(.*)$/,
        replacement: `${coreSrc}/adapters/$1.ts`,
      },
      { find: /^@remcostoeten\/auth-drawer\/core$/, replacement: `${coreSrc}/index.ts` },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "core",
          include: ["__tests__/core/**/*.{test,spec}.ts"],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "react",
          include: ["__tests__/react/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        extends: true,
        plugins: [solid()],
        test: {
          name: "solid",
          include: ["__tests__/solid/**/*.{test,spec}.{ts,tsx}"],
          setupFiles: ["./vitest.setup.ts", "./vitest.setup.solid.ts"],
        },
      },
    ],
  },
});
