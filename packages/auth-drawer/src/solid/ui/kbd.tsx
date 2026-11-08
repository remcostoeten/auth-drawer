import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
};

export function Kbd(props: Props) {
  return (
    <kbd class="ml-1.5 inline-flex h-5 items-center rounded-none border border-overlay-border/20 bg-overlay-surface/60 px-1.5 text-[10px] font-medium text-overlay-subtle">
      {props.children}
    </kbd>
  );
}
