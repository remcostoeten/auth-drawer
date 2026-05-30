import type { OAuthProvider } from "@remcostoeten/auth-drawer";

/**
 * OAuth providers to surface in the drawer. For the custom-JWT adapter, OAuth
 * buttons only appear when you also pass an `oauthUrl` resolver in
 * `src/lib/auth-adapter.ts` (the adapter redirects the browser there). Leave as
 * [] for email/password only.
 */
export const oauthProviders = [] as OAuthProvider[];
