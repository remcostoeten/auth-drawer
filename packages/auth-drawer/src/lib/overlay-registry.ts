const overlays = new Set<HTMLElement>();
const managed = new Set<HTMLElement>();
let overflow = "";
let captured = false;

function syncBody() {
  if (typeof document === "undefined") return;

  if (overlays.size === 0) {
    managed.forEach((element) => element.removeAttribute("inert"));
    managed.clear();
    document.body.style.overflow = overflow;
    overflow = "";
    captured = false;
    return;
  }

  if (!captured) {
    overflow = document.body.style.overflow;
    captured = true;
  }

  const targets = Array.from(document.body.children).filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      !overlays.has(element) &&
      !element.hasAttribute("data-skip-inert"),
  );

  managed.forEach((element) => {
    if (!targets.includes(element)) {
      element.removeAttribute("inert");
      managed.delete(element);
    }
  });

  targets.forEach((element) => {
    element.setAttribute("inert", "");
    managed.add(element);
  });

  document.body.style.overflow = "hidden";
}

/**
 * Registers an active overlay root for centralized inert ownership.
 *
 * @param element - Portal root that must remain interactive.
 * @returns Cleanup function that deregisters the overlay root.
 */
export function registerOverlay(element: HTMLElement): () => void {
  overlays.add(element);
  syncBody();

  return () => {
    overlays.delete(element);
    syncBody();
  };
}
