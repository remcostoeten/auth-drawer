import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/connection";
import * as schema from "@/db/schema";
import { oauthProviders } from "@/lib/oauth-providers";

function hasCredentials(clientId?: string, clientSecret?: string) {
  return Boolean(clientId?.trim() && clientSecret?.trim());
}

const socialProviders = {
  ...(oauthProviders.includes("github") &&
  hasCredentials(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET)
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
      }
    : {}),
  ...(oauthProviders.includes("google") &&
  hasCredentials(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {}),
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
