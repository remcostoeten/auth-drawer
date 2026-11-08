import { Match, Show, Switch, children, createEffect, createSignal, on, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { CheckCircleIcon, XCircleIcon } from "../icons/ui-icons";

export type ButtonFeedback = {
  status: "error" | "success";
  message: string;
};

type Props = {
  children: JSX.Element;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline-solid";
  type?: "button" | "submit";
  icon?: JSX.Element;
  ariaLabel?: string;
  class?: string;
  feedback?: ButtonFeedback;
  /** Small chip at the trailing edge, e.g. "Last used". Hidden while loading or showing feedback. */
  badge?: string;
};

const BASE =
  "h-11 w-full rounded-none flex items-center justify-center gap-3 border px-5 text-sm font-medium leading-none tracking-[0.01em] cursor-pointer outline-hidden focus-visible:outline-hidden focus-visible:border-overlay-focus/45 focus-visible:bg-overlay-surface-hover/55 overflow-hidden transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.97] disabled:active:scale-100";

const VARIANTS = {
  primary:
    "bg-overlay-surface/36 border-overlay-border/10 text-overlay-text fine-hover:bg-overlay-surface-hover/44 fine-hover:border-overlay-border/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] dark:bg-overlay-surface/48 dark:fine-hover:bg-overlay-surface-hover/52 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
  "outline-solid":
    "bg-overlay-surface/22 border-overlay-border/10 text-overlay-text fine-hover:bg-overlay-surface-hover/30 fine-hover:border-overlay-border/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.025)] dark:bg-overlay-surface/28 dark:fine-hover:bg-overlay-surface-hover/34 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
} as const;

export function AuthButton(props: Props) {
  const status = () => (props.isLoading ? "loading" : (props.feedback?.status ?? "idle"));
  const showBadge = () => Boolean(props.badge) && !props.isLoading && !props.feedback;
  const [swapped, setSwapped] = createSignal(false);

  createEffect(on(status, () => setSwapped(true), { defer: true }));

  const icon = children(() => props.icon);

  const swapClass = () => cn("flex items-center", swapped() && "auth-swap-in");

  return (
    <button
      type={props.type ?? "button"}
      onClick={() => props.onClick?.()}
      disabled={props.disabled || props.isLoading}
      aria-label={props.ariaLabel}
      aria-busy={props.isLoading || undefined}
      data-feedback-status={status()}
      class={cn(
        BASE,
        VARIANTS[props.variant ?? "primary"],
        "disabled:cursor-not-allowed disabled:opacity-50",
        status() === "error" && "border-overlay-error/30",
        showBadge() && "relative pr-[4.5rem]",
        props.class,
      )}
    >
      <Show when={showBadge()}>
        <span
          data-auth-badge=""
          class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-overlay-text/10 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.04em] leading-none text-overlay-muted"
        >
          {props.badge}
        </span>
      </Show>
      <Switch>
        <Match when={status() === "loading"}>
          <span class={cn(swapClass(), "justify-center")}>
            <span
              role="status"
              aria-label="Loading"
              class="h-4 w-4 animate-spinner rounded-full border-2 border-overlay-subtle border-t-overlay-text"
            />
          </span>
        </Match>
        <Match when={status() === "error"}>
          <span class={cn(swapClass(), "min-w-0 gap-2 text-overlay-error")}>
            <XCircleIcon size={14} class="shrink-0" />
            <span class="truncate">{props.feedback?.message}</span>
          </span>
        </Match>
        <Match when={status() === "success"}>
          <span class={cn(swapClass(), "min-w-0 gap-2")}>
            <CheckCircleIcon size={14} class="shrink-0" />
            <span class="truncate">{props.feedback?.message}</span>
          </span>
        </Match>
        <Match when={status() === "idle"}>
          <span class={cn(swapClass(), "gap-3")}>
            <Show when={icon()}>
              <span class="shrink-0">{icon()}</span>
            </Show>
            {props.children}
          </span>
        </Match>
      </Switch>
    </button>
  );
}
