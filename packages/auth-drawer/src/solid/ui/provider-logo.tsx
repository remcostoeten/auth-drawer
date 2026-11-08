import { Dynamic } from "solid-js/web";
import { Show, type JSX } from "solid-js";
import type { OAuthIconSource } from "../types";

const IMG_CLASS = "h-[18px] w-[18px] shrink-0 object-contain";

type LogoSources = {
  base?: OAuthIconSource;
  light?: OAuthIconSource;
  dark?: OAuthIconSource;
};

function IconSource(props: { source: OAuthIconSource | undefined }): JSX.Element {
  const source = props.source;
  if (source == null) return null;
  if (typeof source === "string") {
    return <img src={source} alt="" aria-hidden="true" class={IMG_CLASS} />;
  }
  if (typeof source === "function") return <Dynamic component={source} />;
  return source;
}

export function hasOAuthLogo(sources: LogoSources): boolean {
  return sources.base != null || sources.light != null || sources.dark != null;
}

export function ProviderLogo(props: LogoSources) {
  return (
    <Show
      when={props.light != null || props.dark != null}
      fallback={<IconSource source={props.base} />}
    >
      <span class="auth-oauth-logo-light">
        <IconSource source={props.light ?? props.base} />
      </span>
      <span class="auth-oauth-logo-dark">
        <IconSource source={props.dark ?? props.base} />
      </span>
    </Show>
  );
}
