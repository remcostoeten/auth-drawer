import { Show } from "solid-js";
import { cn } from "../lib/cn";

type Props = {
  error?: string | null;
  id?: string;
  tone?: "error" | "success";
  live?: boolean;
  variant?: "default" | "chip";
};

function roleFor(props: Props) {
  if (props.live) return "status";
  return (props.tone ?? "error") === "error" ? "alert" : "status";
}

export function ValidationMessage(props: Props) {
  return (
    <Show when={props.error} keyed>
      {(message) => (
        <p
          id={props.id}
          role={roleFor(props)}
          aria-live={props.live ? "polite" : undefined}
          class={cn(
            "auth-message-in mt-1.5 flex items-center gap-1.5 text-[0.8125rem]",
            props.variant === "chip" &&
              "flex w-fit rounded-full border border-overlay-border/12 bg-overlay-surface/45 px-2.5 py-1 text-[0.76rem] leading-none",
            (props.tone ?? "error") === "error"
              ? "text-overlay-error"
              : props.variant === "chip"
                ? "text-overlay-text/80"
                : "text-overlay-muted",
          )}
        >
          {message}
        </p>
      )}
    </Show>
  );
}
