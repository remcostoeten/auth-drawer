import type { OAuthProvider } from "@remcostoeten/auth-drawer/react";

/**
 * OAuth providers shown in the drawer AND configured on the Better Auth server.
 *
 * The drawer ships icons for `github`, `google`, `apple`, `discord`, `tiktok`
 * and `x`. List any of them here and the drawer renders its button with the
 * bundled icon. Each one starts working once its `*_CLIENT_ID` /
 * `*_CLIENT_SECRET` is in `.env` (see `.env.example` and `src/lib/auth.ts`).
 * Providers without credentials still render and return an error on click, so
 * trim this list (or set it to `[]`) for an email/password-only demo.
 */
export const oauthProviders: OAuthProvider[] = [
  "github",
  "google",
  "discord",
  "x",
];
