import type { AuthConfig } from "@/components/auth/auth-drawer";

export type MockAuthProviderSlug =
  | "supabase"
  | "better-auth"
  | "auth-js"
  | "clerk"
  | "custom-backend";

export type MockAuthProvider = {
  slug: MockAuthProviderSlug;
  name: string;
  label: string;
  description: string;
  env: string[];
  callbacks: string[];
  config: Partial<AuthConfig>;
  serverNotes: string[];
};

export const MOCK_AUTH_PROVIDERS: MockAuthProvider[] = [
  {
    slug: "supabase",
    name: "Supabase",
    label: "Database-backed auth",
    description:
      "Mock Supabase flow for email/password, GitHub, and Google OAuth using the same adapter contract as a real Supabase client.",
    env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    callbacks: ["/auth/callback", "/examples/supabase"],
    config: {
      ui: {
        copy: {
          login: {
            title: "Sign in to Supabase",
            subtitle: "Mocked project auth flow",
            submit: "Continue with Supabase",
          },
          fields: {
            email: {
              label: "Project email",
            },
          },
        },
      },
    },
    serverNotes: [
      "Exchange OAuth code inside a route handler.",
      "Keep service role keys server-only.",
      "Use createSupabaseAdapter to route drawer actions into Supabase client methods.",
    ],
  },
  {
    slug: "better-auth",
    name: "Better Auth",
    label: "Framework-native auth",
    description:
      "Mock Better Auth integration showing how the drawer delegates credentials and social providers to a Better Auth client adapter.",
    env: ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"],
    callbacks: ["/api/auth/callback/:provider", "/examples/better-auth"],
    config: {
      ui: {
        copy: {
          login: {
            title: "Continue with Better Auth",
            subtitle: "Server actions and provider callbacks",
            submit: "Sign in",
          },
        },
      },
    },
    serverNotes: [
      "Mount the Better Auth handler under a Next route.",
      "Use createBetterAuthAdapter to call signIn.email or social sign-in.",
      "Map backend validation errors into normalized drawer copy.",
    ],
  },
  {
    slug: "auth-js",
    name: "Auth.js",
    label: "Provider-rich auth",
    description:
      "Mock Auth.js provider setup with credential and OAuth examples that map to the NextAuth adapter.",
    env: ["AUTH_SECRET", "AUTH_URL", "GITHUB_ID", "GITHUB_SECRET"],
    callbacks: ["/api/auth/callback/github", "/api/auth/callback/google"],
    config: {
      ui: {
        copy: {
          login: {
            title: "Sign in with Auth.js",
            subtitle: "Credentials and OAuth providers",
            submit: "Use credentials",
          },
        },
      },
    },
    serverNotes: [
      "Keep provider secrets in server env vars.",
      "Use server-side callbacks to create sessions.",
      "Pass signIn, signOut, and useSession to createNextAuthAdapter.",
    ],
  },
  {
    slug: "clerk",
    name: "Clerk",
    label: "Hosted user management",
    description:
      "Mock Clerk flow for teams that want Auth Drawer as a branded entrypoint before calling Clerk methods.",
    env: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
    callbacks: ["/sso-callback", "/examples/clerk"],
    config: {
      ui: {
        copy: {
          login: {
            title: "Welcome back",
            subtitle: "Mock Clerk handoff",
            submit: "Continue",
          },
        },
      },
    },
    serverNotes: [
      "Use Clerk's client methods for public sign-in starts.",
      "Keep secret-key operations inside route handlers.",
      "Preserve Auth Drawer visual control while delegating session logic.",
    ],
  },
  {
    slug: "custom-backend",
    name: "Custom Backend",
    label: "Bring your own API",
    description:
      "Mock custom API flow for teams with their own credential endpoint, OAuth broker, or session service.",
    env: ["AUTH_API_URL", "AUTH_API_SECRET"],
    callbacks: ["/api/session", "/api/oauth/callback"],
    config: {
      ui: {
        copy: {
          login: {
            title: "Sign in to your app",
            subtitle: "Custom backend example",
            submit: "Create session",
          },
        },
      },
    },
    serverNotes: [
      "POST credentials to your server route, not directly to a private API.",
      "Normalize backend errors before passing them to the drawer.",
      "Store HTTP-only session cookies from the route handler.",
    ],
  },
];

export function getMockAuthProvider(slug: string) {
  return MOCK_AUTH_PROVIDERS.find((provider) => provider.slug === slug);
}
