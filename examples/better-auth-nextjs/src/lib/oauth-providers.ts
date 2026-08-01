import type { OAuthProvider } from "@remcostoeten/auth-drawer";

/**
 * OAuth providers shown in the drawer AND configured on the Better Auth server.
 *
 * v0.3 ships bundled icons for 16 providers: `github`, `google`, `apple`,
 * `discord`, `tiktok`, `x`, `facebook`, `microsoft`, `gitlab`, `twitch`,
 * `linkedin`, `spotify`, `slack`, `reddit`, `notion`, `figma`. List any of them
 * here and the drawer renders its button with the bundled icon (monochrome
 * marks adapt to light/dark automatically via `currentColor`).
 *
 * The ids below are also native Better Auth social providers, so each one starts
 * working the moment you add its `*_CLIENT_ID` / `*_CLIENT_SECRET` to `.env`
 * (see `.env.example` and `src/lib/auth.ts`). Providers without credentials still
 * render — they just return an error on click — so trim this list (or set it to
 * `[]`) for an email/password-only demo.
 *
 * Note: the Better Auth adapter advertises these ids to the drawer, which renders
 * them with their built-in icons. To use *custom* provider ids or custom /
 * light-dark / label-only logos (the rich `OAuthProviderConfig` entry form), see
 * the commented example in `auth-drawer-config.ts`.
 */
export const oauthProviders: OAuthProvider[] = [
  "github",
  "google",
  "discord",
  "twitch",
  "gitlab",
  "spotify",
];
