import { isValidElement, type ComponentType, type ReactNode } from "react";
import type { OAuthIconSource } from "../types";

const IMG_CLASS = "h-[18px] w-[18px] shrink-0 object-contain";

/**
 * Renders one icon source — a component, a React element, or an image URL.
 */
export function renderOAuthIcon(source: OAuthIconSource | undefined): ReactNode {
  if (source == null) return null;
  if (typeof source === "string") {
    return <img src={source} alt="" aria-hidden="true" className={IMG_CLASS} />;
  }
  if (isValidElement(source)) return source;
  const Component = source as ComponentType<{ className?: string }>;
  return <Component />;
}

export type ProviderLogoSources = {
  base?: OAuthIconSource;
  light?: OAuthIconSource;
  dark?: OAuthIconSource;
};

/** Whether any renderable logo source is present. */
export function hasOAuthLogo(sources: ProviderLogoSources): boolean {
  return sources.base != null || sources.light != null || sources.dark != null;
}

/**
 * Renders a provider logo.
 *
 * With light/dark variants it renders both and toggles them via the `.dark`
 * ancestor class in CSS (SSR-safe, no flash, follows the package's class-based
 * dark mode). Otherwise it renders a single icon. Built-in marks use
 * `currentColor`, so they adapt to the surface without explicit variants.
 */
export function ProviderLogo({ base, light, dark }: ProviderLogoSources) {
  if (light == null && dark == null) {
    return <>{renderOAuthIcon(base)}</>;
  }

  return (
    <>
      <span className="auth-oauth-logo-light">{renderOAuthIcon(light ?? base)}</span>
      <span className="auth-oauth-logo-dark">{renderOAuthIcon(dark ?? base)}</span>
    </>
  );
}
