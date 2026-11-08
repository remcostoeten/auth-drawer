/**
 * Built-in OAuth provider ids shipped with default labels.
 * Array order is the display order consumers pass via `ui.auth.providers`.
 */
export const OAUTH_PROVIDER_IDS = ["github", "google", "apple", "discord", "tiktok", "x"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDER_IDS)[number];

export type OAuthProviderMeta = {
  id: OAuthProvider;
  label: string;
};

/**
 * Default display labels for the built-in OAuth providers.
 */
export const OAUTH_PROVIDER_LABELS: Readonly<Record<OAuthProvider, string>> = {
  github: "GitHub",
  google: "Google",
  apple: "Apple",
  discord: "Discord",
  tiktok: "TikTok",
  x: "X",
};

/**
 * Provider registry without icons. Renderers pair it with their own icon map.
 */
export const OAUTH_PROVIDER_REGISTRY: ReadonlyMap<OAuthProvider, OAuthProviderMeta> = new Map(
  OAUTH_PROVIDER_IDS.map((id) => [id, { id, label: OAUTH_PROVIDER_LABELS[id] }]),
);

/** Default number of OAuth buttons shown before the overflow disclosure. */
export const OAUTH_VISIBLE_COUNT = 2;

/**
 * @name resolveOAuthVisibleCount
 * @description Clamps the number of visible OAuth buttons to an integer of at least 1,
 * falling back to the default for missing or non-finite values.
 *
 * @example
 * resolveOAuthVisibleCount(0); // 1
 */
export function resolveOAuthVisibleCount(value?: number) {
  const count = value ?? OAUTH_VISIBLE_COUNT;
  if (!Number.isFinite(count)) return OAUTH_VISIBLE_COUNT;
  return Math.max(1, Math.floor(count));
}

/**
 * @name resolveOAuthProviders
 * @description Maps provider ids to registry entries, dropping unknown ids.
 *
 * @example
 * resolveOAuthProviders(["github"]); // [{ id: "github", label: "GitHub" }]
 */
export function resolveOAuthProviders(providers: OAuthProvider[]): OAuthProviderMeta[] {
  return providers.flatMap((id) => {
    const item = OAUTH_PROVIDER_REGISTRY.get(id);
    return item ? [item] : [];
  });
}

/**
 * @name defaultLabelForOAuthProvider
 * @description Returns the built-in label for a provider, or the id itself when unknown.
 *
 * @example
 * defaultLabelForOAuthProvider("github"); // "GitHub"
 */
export function defaultLabelForOAuthProvider(provider: OAuthProvider) {
  return OAUTH_PROVIDER_LABELS[provider] ?? provider;
}
