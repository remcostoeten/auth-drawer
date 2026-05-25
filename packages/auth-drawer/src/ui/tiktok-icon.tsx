import { memo } from "react";

const NOTE_PATH =
  "M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.738 2.738 0 0 1-2.66 2.67 2.738 2.738 0 0 1-2.65-2.67 2.738 2.738 0 0 1 2.65-2.66c.25 0 .49.04.72.11v-3.14a5.956 5.956 0 0 0-.72-.05 5.946 5.946 0 0 0-5.95 5.95 5.946 5.946 0 0 0 5.95 5.95 5.946 5.946 0 0 0 5.95-5.95V8.69a8.186 8.186 0 0 0 4.76 1.54V7.19a4.282 4.282 0 0 1-1.05-.13z";

/**
 * Renders the TikTok provider mark.
 *
 * @returns Decorative TikTok icon.
 */
function Icon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={NOTE_PATH} fill="#25F4EE" transform="translate(0.6, 0.6)" />
      <path d={NOTE_PATH} fill="#FE2C55" transform="translate(0.3, 0.3)" />
      <path d={NOTE_PATH} fill="currentColor" />
    </svg>
  );
}

/**
 * Memoized TikTok provider mark.
 *
 * @returns Decorative TikTok icon.
 */
export const TikTokIcon = memo(Icon);
