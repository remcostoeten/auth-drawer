import type { ComponentType } from "react";
import type { ProviderDef } from "./types";
import { AppleIcon } from "./ui/apple-icon";
import { DiscordIcon } from "./ui/discord-icon";
import { GithubIcon } from "./ui/github-icon";
import { GoogleIcon } from "./ui/google-icon";
import { TikTokIcon } from "./ui/tiktok-icon";

/**
 * Built-in OAuth provider ids shipped with icons and default labels.
 * Array order is the display order consumers pass via `ui.auth.providers`.
 */
export const OAUTH_PROVIDER_IDS = [
  "github",
  "google",
  "apple",
  "discord",
  "tiktok",
] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDER_IDS)[number];

export const OAUTH_PROVIDER_REGISTRY: ReadonlyMap<OAuthProvider, ProviderDef> = new Map([
  ["github", { id: "github", label: "GitHub", icon: GithubIcon }],
  ["google", { id: "google", label: "Google", icon: GoogleIcon }],
  ["apple", { id: "apple", label: "Apple", icon: AppleIcon }],
  ["discord", { id: "discord", label: "Discord", icon: DiscordIcon }],
  ["tiktok", { id: "tiktok", label: "TikTok", icon: TikTokIcon }],
]);

/** Default number of OAuth buttons shown before the overflow disclosure. */
export const OAUTH_VISIBLE_COUNT = 2;

export function resolveOAuthVisibleCount(value?: number) {
  const count = value ?? OAUTH_VISIBLE_COUNT;
  if (!Number.isFinite(count)) return OAUTH_VISIBLE_COUNT;
  return Math.max(1, Math.floor(count));
}

export function resolveOAuthProviders(providers: OAuthProvider[]): ProviderDef[] {
  return providers.flatMap((id) => {
    const item = OAUTH_PROVIDER_REGISTRY.get(id);
    return item ? [item] : [];
  });
}

export function defaultLabelForOAuthProvider(provider: OAuthProvider) {
  return OAUTH_PROVIDER_REGISTRY.get(provider)?.label ?? provider;
}

export function iconForOAuthProvider(provider: OAuthProvider): ComponentType | undefined {
  return OAUTH_PROVIDER_REGISTRY.get(provider)?.icon;
}
