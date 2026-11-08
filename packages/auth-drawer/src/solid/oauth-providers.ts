import type { Component } from "solid-js";
import {
  OAUTH_PROVIDER_IDS,
  OAUTH_PROVIDER_LABELS,
  OAUTH_VISIBLE_COUNT,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
  type OAuthProvider,
} from "@remcostoeten/auth-drawer/core";
import { AppleIcon } from "./icons/apple-icon";
import { DiscordIcon } from "./icons/discord-icon";
import { GithubIcon } from "./icons/github-icon";
import { GoogleIcon } from "./icons/google-icon";
import { TikTokIcon } from "./icons/tiktok-icon";
import { XIcon } from "./icons/x-icon";
import type { ProviderDef } from "./types";

export {
  OAUTH_PROVIDER_IDS,
  OAUTH_VISIBLE_COUNT,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
  type OAuthProvider,
};

const ICONS: Record<OAuthProvider, Component<{ class?: string }>> = {
  github: GithubIcon,
  google: GoogleIcon,
  apple: AppleIcon,
  discord: DiscordIcon,
  tiktok: TikTokIcon,
  x: XIcon,
};

export const OAUTH_PROVIDER_REGISTRY: ReadonlyMap<OAuthProvider, ProviderDef> = new Map(
  OAUTH_PROVIDER_IDS.map((id) => [id, { id, label: OAUTH_PROVIDER_LABELS[id], icon: ICONS[id] }]),
);

export function resolveOAuthProviders(providers: OAuthProvider[]): ProviderDef[] {
  return providers.flatMap((id) => {
    const item = OAUTH_PROVIDER_REGISTRY.get(id);
    return item ? [item] : [];
  });
}
