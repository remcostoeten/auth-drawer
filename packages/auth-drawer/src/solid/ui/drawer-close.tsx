import { CloseIcon } from "../icons/ui-icons";

type Props = {
  ref?: (element: HTMLButtonElement) => void;
  onClick: () => void;
  ariaLabel: string;
};

export function DrawerClose(props: Props) {
  return (
    <button
      ref={props.ref}
      onClick={() => props.onClick()}
      class="absolute -top-12 right-0 rounded-none p-2 text-overlay-text outline-hidden transition-colors hover:text-overlay-muted focus-visible:text-overlay-focus/60 focus-visible:outline-hidden"
      aria-label={props.ariaLabel}
      type="button"
    >
      <CloseIcon size={18} />
    </button>
  );
}
