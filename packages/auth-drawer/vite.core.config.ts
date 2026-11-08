import { defineConfig } from "rolldown-vite";
import { resolve } from "path";

const ADAPTERS = [
  "better-auth",
  "supabase",
  "next-auth",
  "clerk",
  "firebase",
  "custom-jwt",
  "passport",
  "mock",
] as const;

export default defineConfig({
  build: {
    outDir: "dist/core",
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/core/index.ts"),
        ...Object.fromEntries(
          ADAPTERS.map((name) => [
            `adapters/${name}`,
            resolve(__dirname, `src/core/adapters/${name}.ts`),
          ]),
        ),
      },
      formats: ["es"],
    },
    sourcemap: false,
  },
});
