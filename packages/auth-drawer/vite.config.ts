import { defineConfig } from "rolldown-vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "adapters/better-auth": resolve(__dirname, "src/adapters/better-auth.ts"),
        "adapters/supabase": resolve(__dirname, "src/adapters/supabase.ts"),
        "adapters/next-auth": resolve(__dirname, "src/adapters/next-auth.ts"),
        "adapters/clerk": resolve(__dirname, "src/adapters/clerk.ts"),
        "adapters/firebase": resolve(__dirname, "src/adapters/firebase.ts"),
        "adapters/custom-jwt": resolve(__dirname, "src/adapters/custom-jwt.ts"),
        "adapters/passport": resolve(__dirname, "src/adapters/passport.ts"),
        "adapters/mock": resolve(__dirname, "src/adapters/mock.ts"),
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
      ],
    },
    cssCodeSplit: false,
  },
});
