import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "../dist/solid");

const targets = [
  { file: resolve(distDir, "index.js"), stamp: 'import "./styles.css";\n' },
  { file: resolve(distDir, "source/index.jsx"), stamp: 'import "../styles.css";\n' },
];

for (const { file, stamp } of targets) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("styles.css")) writeFileSync(file, stamp + source);
}
