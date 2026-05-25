import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";
import { authClient } from "@/lib/auth-client";
import { oauthProviders } from "@/lib/oauth-providers";

export const authAdapter = createBetterAuthAdapter({
  client: authClient,
  providers: oauthProviders,
  callbackURL: "/dashboard",
  newUserCallbackURL: "/dashboard",
  passwordResetRedirectTo: "/reset-password",
  requireName: true,
});
