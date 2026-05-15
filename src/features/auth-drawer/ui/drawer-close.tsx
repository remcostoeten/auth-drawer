import type { RefObject } from "react";
import { X } from "lucide-react";

type Props = {
  buttonRef: RefObject<HTMLButtonElement>;
  onClick: () => void;
};

/**
 * Renders the dialog close button.
 *
 * @param props - Button ref and close action.
 * @returns Accessible close control.
 */
export function DrawerClose({ buttonRef, onClick }: Props) {
  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className="absolute -top-12 right-0 rounded-none p-2 text-overlay-text outline-none transition-colors hover:text-overlay-muted focus-visible:text-overlay-muted focus-visible:outline-none"
      aria-label="Close sign in dialog"
      type="button"
    >
      <X size={18} aria-hidden="true" />
    </button>
  );
}
