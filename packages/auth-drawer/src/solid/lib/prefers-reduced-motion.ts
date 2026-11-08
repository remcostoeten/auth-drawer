/**
 * @name prefersReducedMotion
 * @description Reads the `prefers-reduced-motion: reduce` media query. Returns false on the
 * server and in environments without `matchMedia`.
 *
 * @example
 * const exitMs = prefersReducedMotion() ? 0 : 260;
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
