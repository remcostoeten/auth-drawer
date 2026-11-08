import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { OAuthProvider } from "@remcostoeten/auth-drawer/react";
import { db } from "@/db/connection";
import * as schema from "@/db/schema";
import { oauthProviders } from "@/lib/oauth-providers";

function hasCredentials(clientId?: string, clientSecret?: string) {
  return Boolean(clientId?.trim() && clientSecret?.trim());
}

type SocialProviders = NonNullable<BetterAuthOptions["socialProviders"]>;

/** Better Auth names the X provider `twitter`. */
const betterAuthIds: Partial<Record<OAuthProvider, string>> = { x: "twitter" };

/**
 * Includes a provider only when it's listed in `oauthProviders` AND its
 * credentials are present, so the example runs with zero OAuth env configured.
 */
function socialProvider(id: OAuthProvider, clientId?: string, clientSecret?: string) {
  if (!oauthProviders.includes(id) || !hasCredentials(clientId, clientSecret)) {
    return {};
  }
  return { [betterAuthIds[id] ?? id]: { clientId: clientId!, clientSecret: clientSecret! } };
}

// Add a row here (and to .env.example + src/lib/oauth-providers.ts) to make
// another provider configurable.
const socialProviders = {
  ...socialProvider("github", process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET),
  ...socialProvider("google", process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET),
  ...socialProvider("discord", process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET),
  ...socialProvider("x", process.env.X_CLIENT_ID, process.env.X_CLIENT_SECRET),
} as SocialProviders;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[better-auth] Password reset for ${user.email}:\n${url}`);
      }
    },
  },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
});
