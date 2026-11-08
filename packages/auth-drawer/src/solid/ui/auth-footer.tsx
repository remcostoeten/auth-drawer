import { For, Show } from "solid-js";
import type { AuthFooterSegment } from "@remcostoeten/auth-drawer/core";

type Props = {
  segments: AuthFooterSegment[];
};

function Segment(props: { segment: AuthFooterSegment }) {
  const segment = props.segment;

  if (segment.type === "text") return <span>{segment.value}</span>;

  return (
    <a
      href={segment.href}
      target={segment.target}
      rel={segment.target === "_blank" ? "noreferrer noopener" : undefined}
      class="underline transition-colors hover:text-overlay-muted focus-visible:outline-hidden focus-visible:text-overlay-focus"
    >
      {segment.label}
    </a>
  );
}

export function AuthFooter(props: Props) {
  return (
    <Show when={props.segments.length > 0}>
      <p
        class="auth-rise mx-auto mt-5 max-w-sm text-center text-[0.6875rem] leading-relaxed text-overlay-subtle"
        style={{ "--auth-i": 5, "--auth-rise-y": "6px" }}
      >
        <For each={props.segments}>{(segment) => <Segment segment={segment} />}</For>
      </p>
    </Show>
  );
}
