import { Show, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { createPresence } from "../lib/create-presence";

type Props = {
  open: boolean;
  class?: string;
  children: JSX.Element;
};

const EXIT_MS = 200;

export function Collapse(props: Props) {
  const presence = createPresence(() => props.open, EXIT_MS);

  return (
    <Show when={presence.present()}>
      <div class={cn("auth-collapse", props.class)} data-state={presence.state()}>
        <div>{props.children}</div>
      </div>
    </Show>
  );
}
