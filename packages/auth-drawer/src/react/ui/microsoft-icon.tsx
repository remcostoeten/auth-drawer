import { memo } from "react";

/**
 * Renders the Microsoft provider mark (the four-square logo).
 *
 * Brand-colored rather than `currentColor`, so it reads the same on light and
 * dark surfaces.
 *
 * @returns Decorative Microsoft icon.
 */
function Icon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M1 1h10v10H1z" fill="#F25022" />
      <path d="M13 1h10v10H13z" fill="#7FBA00" />
      <path d="M1 13h10v10H1z" fill="#00A4EF" />
      <path d="M13 13h10v10H13z" fill="#FFB900" />
    </svg>
  );
}

/**
 * Memoized Microsoft provider mark.
 *
 * @returns Decorative Microsoft icon.
 */
export const MicrosoftIcon = memo(Icon);
