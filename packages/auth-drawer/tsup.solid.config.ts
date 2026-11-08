import { defineConfig, type Options } from "tsup";
import { generateTsupOptions, parsePresetOptions, type PresetOptions } from "tsup-preset-solid";

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

const CORE_SPECIFIER = /^@remcostoeten\/auth-drawer\/core(\/.*)?$/;

const presetOptions: PresetOptions = {
  entries: [
    { name: "index", entry: "src/solid/index.tsx" },
    ...ADAPTERS.map((name) => ({ name: `adapters/${name}`, entry: `src/solid/adapters/${name}.ts` })),
  ],
};

function flatEntryName(key: string, isSource: boolean) {
  const name = key.replace(/\/index$/, "");
  return isSource ? `source/${name}` : name;
}

function flattenEntries(options: Options): Options {
  const isSource = !options.dts;
  const entries = Object.fromEntries(
    Object.entries(options.entry ?? {}).map(([key, file]) => [flatEntryName(key, isSource), file]),
  );
  return {
    ...options,
    clean: false,
    entry: entries,
    outDir: "dist/solid",
    external: [...(options.external ?? []), CORE_SPECIFIER],
    tsconfig: "src/solid/tsconfig.build.json",
  };
}

export default defineConfig((config) => {
  const parsed = parsePresetOptions(presetOptions, Boolean(config.watch));
  return generateTsupOptions(parsed).map(flattenEntries);
});
