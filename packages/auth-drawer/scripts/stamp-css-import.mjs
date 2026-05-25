import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "../dist");
const entryPath = resolve(distDir, "index.js");
const cssFile = "styles.css";
const stamp = `import "./${cssFile}";\n`;

const source = readFileSync(entryPath, "utf8");

if (!source.includes(cssFile)) {
  writeFileSync(entryPath, stamp + source);
}
