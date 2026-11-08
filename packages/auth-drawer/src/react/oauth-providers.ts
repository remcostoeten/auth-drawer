import type { ComponentType } from "react";
import {
  OAUTH_PROVIDER_IDS,
  OAUTH_PROVIDER_LABELS,
  OAUTH_VISIBLE_COUNT,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
  type OAuthProvider,
} from "@remcostoeten/auth-drawer/core";
import type { ProviderDef } from "./types";
import { AppleIcon } from "./ui/apple-icon";
import { DiscordIcon } from "./ui/discord-icon";
import { GithubIcon } from "./ui/github-icon";
import { GoogleIcon } from "./ui/google-icon";
import { TikTokIcon } from "./ui/tiktok-icon";
import { XIcon } from "./ui/x-icon";

export {
  OAUTH_PROVIDER_IDS,
  OAUTH_VISIBLE_COUNT,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
  type OAuthProvider,
};

const ICONS: Record<OAuthProvider, ComponentType> = {
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

export function iconForOAuthProvider(provider: OAuthProvider): ComponentType | undefined {
  return OAUTH_PROVIDER_REGISTRY.get(provider)?.icon;
}
