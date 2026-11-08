import { defineConfig } from "rolldown-vite";
import react from "@vitejs/plugin-react-swc";
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
  plugins: [react()],
  build: {
    outDir: "dist/react",
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/react/index.ts"),
        ...Object.fromEntries(
          ADAPTERS.map((name) => [
            `adapters/${name}`,
            resolve(__dirname, `src/react/adapters/${name}.ts`),
          ]),
        ),
      },
      formats: ["es"],
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "framer-motion",
        "lucide-react",
        /^@remcostoeten\/auth-drawer\/core(\/.*)?$/,
      ],
    },
    cssCodeSplit: false,
  },
});
