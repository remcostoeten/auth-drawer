import { memo } from "react";

/**
 * Renders the drawer drag affordance.
 *
 * @returns Presentational handle bar.
 */
function Handle() {
  return (
    <div
      className="sticky top-0 z-3 flex w-full cursor-grab justify-center pb-2 pt-3"
      aria-hidden="true"
    >
      <div className="h-1 w-10 rounded-none bg-overlay-text/40" />
    </div>
  );
}

/**
 * Memoized drawer handle.
 *
 * @returns Presentational handle bar.
 */
export const DrawerHandle = memo(Handle);
