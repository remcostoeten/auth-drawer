import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { OAuthProvider } from "@remcostoeten/auth-drawer";
import { db } from "@/db/connection";
import * as schema from "@/db/schema";
import { oauthProviders } from "@/lib/oauth-providers";

function hasCredentials(clientId?: string, clientSecret?: string) {
  return Boolean(clientId?.trim() && clientSecret?.trim());
}

/**
 * Includes a provider only when it's listed in `oauthProviders` AND its
 * credentials are present, so the example runs with zero OAuth env configured.
 * Returns a single-key partial so the spread below keeps Better Auth's typed
 * provider keys.
 */
function socialProvider<K extends OAuthProvider>(
  id: K,
  clientId?: string,
  clientSecret?: string,
): Partial<Record<K, { clientId: string; clientSecret: string }>> {
  if (!oauthProviders.includes(id) || !hasCredentials(clientId, clientSecret)) {
    return {};
  }
  return { [id]: { clientId: clientId!, clientSecret: clientSecret! } } as Partial<
    Record<K, { clientId: string; clientSecret: string }>
  >;
}

// Add a row here (and to .env.example + src/lib/oauth-providers.ts) to make
// another provider configurable.
const socialProviders = {
  ...socialProvider("github", process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET),
  ...socialProvider("google", process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET),
  ...socialProvider("discord", process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET),
  ...socialProvider("twitch", process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET),
  ...socialProvider("gitlab", process.env.GITLAB_CLIENT_ID, process.env.GITLAB_CLIENT_SECRET),
  ...socialProvider("spotify", process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET),
};

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
