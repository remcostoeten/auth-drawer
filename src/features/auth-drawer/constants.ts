/**
 * Drawer background gradient using shared overlay tokens.
 */
export const DRAWER_BG = `linear-gradient(
  to top,
  hsl(var(--surface-overlay)) 0%,
  hsl(var(--surface-overlay)) 35%,
  hsla(var(--surface-overlay) / var(--surface-overlay-alpha-high)) 55%,
  hsla(var(--surface-overlay) / var(--surface-overlay-alpha-mid)) 75%,
  hsla(var(--surface-overlay) / var(--surface-overlay-alpha-fade)) 90%,
  hsla(var(--surface-overlay) / 0) 100%
)`;

/**
 * Common email domains for inline completion.
 */
export const DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "yahoo.com",
] as const;

/**
 * Versioned localStorage key for motion settings.
 */
export const SETTINGS_KEY = "universal-drawer-settings";

/**
 * Same-tab settings broadcast event.
 */
export const SETTINGS_EVENT = "studio-settings-update";

/**
 * Standard button press easing.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Standard smooth movement easing.
 */
export const EASE_MOVE = [0.77, 0, 0.175, 1] as const;

/**
 * Drawer entry and exit movement easing.
 */
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/**
 * Standard exit opacity and scale easing.
 */
export const EASE_EXIT = [0.4, 0, 1, 1] as const;

/**
 * Press animation duration.
 */
export const DUR_PRESS = 0.16;

/**
 * Drawer entry animation duration.
 */
export const DUR_DRAWER = 0.9;

/**
 * Drawer exit animation duration.
 */
export const DUR_EXIT = 0.26;

/**
 * Downward fling velocity threshold.
 */
export const DISMISS_VELOCITY = 500;

/**
 * Upward drag limit as a viewport-height fraction.
 */
export const UPWARD_LIMIT = 0.5;

/**
 * Static portal root id.
 */
export const PORTAL_ID = "auth-drawer-portal";

/**
 * Attribute marking nodes exempt from overlay inert handling.
 */
export const PORTAL_ATTR = "data-skip-inert";

/**
 * Caps per-character motion node creation for animated headings.
 * Longer strings fade as a single node to avoid unbounded DOM growth.
 */
export const MAX_STAGGER = 60;

/**
 * Versioned localStorage key for remember-me state.
 */
export const REMEMBER_KEY = "auth-remember-me-v1";
