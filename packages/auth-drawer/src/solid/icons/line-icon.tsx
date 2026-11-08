import type { JSX } from "solid-js";

type Props = {
  size?: number;
  strokeWidth?: number;
  class?: string;
  children: JSX.Element;
};

export type LineIconProps = Omit<Props, "children">;

export function LineIcon(props: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={props.strokeWidth ?? 2}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={props.class}
    >
      {props.children}
    </svg>
  );
}
