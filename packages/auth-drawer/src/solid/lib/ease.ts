const NAMED_EASES: Readonly<Record<string, string>> = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  circIn: "cubic-bezier(0.55, 0, 1, 0.45)",
  circOut: "cubic-bezier(0, 0.55, 0.45, 1)",
  circInOut: "cubic-bezier(0.85, 0, 0.15, 1)",
  backIn: "cubic-bezier(0.36, 0, 0.66, -0.56)",
  backOut: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  backInOut: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
};

function parseBezier(value: string): string | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length !== 4) return null;
    if (!parsed.every((point) => typeof point === "number")) return null;
    return `cubic-bezier(${parsed.join(", ")})`;
  } catch {
    return null;
  }
}

/**
 * @name easeToCss
 * @description Converts a motion-settings ease (a JSON bezier array such as `[0.23,1,0.32,1]` or a
 * name such as `easeIn`) to a CSS timing function. Unknown values fall back to `ease`.
 *
 * @example
 * easeToCss("[0.23,1,0.32,1]"); // "cubic-bezier(0.23, 1, 0.32, 1)"
 */
export function easeToCss(value: string): string {
  return parseBezier(value) ?? NAMED_EASES[value] ?? "ease";
}
