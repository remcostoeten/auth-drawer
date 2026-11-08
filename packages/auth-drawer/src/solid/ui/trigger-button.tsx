import { cn } from "../lib/cn";
import { UserRoundIcon } from "../icons/ui-icons";

type Props = {
  ref?: (element: HTMLButtonElement) => void;
  open: boolean;
  title: string;
  openLabel: string;
  closeLabel: string;
  class?: string;
  onClick: () => void;
};

export function TriggerButton(props: Props) {
  return (
    <button
      ref={props.ref}
      type="button"
      onClick={() => props.onClick()}
      aria-haspopup="dialog"
      aria-expanded={props.open}
      class={cn(
        "group relative flex items-center gap-2.5 rounded-none border px-4 py-2 text-sm",
        "bg-overlay-surface/10 backdrop-blur-xl",
        "text-overlay-text transition-all duration-200",
        "shadow-[0_8px_30px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.05)]",
        "hover:bg-overlay-surface/20 hover:border-overlay-border/20 hover:scale-[1.015] active:scale-[0.97]",
        "auth-drawer-focus-scope focus-visible:outline-hidden focus-visible:bg-overlay-surface/20 focus-visible:border-overlay-focus/45",
        "border-overlay-border/10",
        props.class,
      )}
    >
      <div class="relative flex items-center justify-center">
        <UserRoundIcon
          size={16}
          class="text-overlay-muted transition-colors duration-200 group-hover:text-overlay-text"
        />
      </div>
      <span class="flex flex-col text-left leading-tight">
        <span class="text-xs font-semibold tracking-tight text-overlay-text transition-colors group-hover:text-overlay-text/90">
          {props.title}
        </span>
        <span class="text-[10px] font-medium uppercase tracking-wide text-overlay-subtle transition-colors group-hover:text-overlay-muted">
          {props.open ? props.closeLabel : props.openLabel}
        </span>
      </span>
    </button>
  );
}
