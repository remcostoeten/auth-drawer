import { Show } from "solid-js";
import { cn } from "../lib/cn";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

export function RememberMe(props: Props) {
  return (
    <label class="group flex cursor-pointer select-none items-center gap-2.5">
      <div class="relative flex items-center justify-center">
        <input
          type="checkbox"
          class="sr-only"
          checked={props.checked}
          onChange={(event) => props.onChange(event.currentTarget.checked)}
        />
        <div
          class={cn(
            "flex h-4 w-4 items-center justify-center border transition-colors duration-200",
            "group-has-[:focus-visible]:border-overlay-focus/70",
            props.checked
              ? "border-overlay-text bg-overlay-text"
              : "border-overlay-border/20 bg-transparent group-hover:border-overlay-border/40",
          )}
        >
          <Show when={props.checked}>
            <svg
              class="auth-check-in h-3 w-3 text-overlay-bg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline class="auth-check-draw" points="20 6 9 17 4 12" pathLength="1" />
            </svg>
          </Show>
        </div>
      </div>
      <span class="text-[0.8125rem] font-medium text-overlay-muted transition-colors group-hover:text-overlay-text group-has-[:focus-visible]:text-overlay-focus">
        {props.label}
      </span>
    </label>
  );
}
