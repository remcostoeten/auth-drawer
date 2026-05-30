import { ReactNode } from "react";

export type SdkDoc = {
  id: string;
  name: string;
  install: string;
  importPath: string;
  supports: string[];
  clientShape: string;
  setup: string[];
  gotchas: string[];
  notes: ReactNode;
  snippet: string;
};

export type GuideStepFile = {
  name: string;
  lang: string;
  code: string;
};

export type GuideStepOption = {
  name: string;
  description?: string;
  command?: string;
  file?: GuideStepFile;
  docsUrl?: string;
};

export type GuideStep = {
  id: string;
  number: number;
  title: string;
  description: string;
  type: "command" | "single-file" | "split-adapters";
  command?: string;
  file?: GuideStepFile;
  docsUrl?: string;
  options?: {
    prisma: GuideStepOption;
    drizzle: GuideStepOption;
  };
};

export const ADAPTER_CONTRACT = `type AuthAdapter = {
  id: string;
  providers?: OAuthProvider[];
  requiresName?: boolean;
  signIn: (input: { email: string; password: string; rememberMe: boolean }) => Promise<AuthResult>;
  signUp?: (input: { email: string; password: string; rememberMe: boolean; name: string }) => Promise<AuthResult>;
  signOut?: () => Promise<AuthResult>;
  signInWithOAuth?: (provider: string) => Promise<AuthResult>;
  requestPasswordReset?: (email: string) => Promise<AuthResult>;
  resetPassword?: (input: { newPassword: string }) => Promise<AuthResult>;
  useSession: () => {
    data: AuthSessionState | null;
    isPending: boolean;
    error: unknown;
  };
};`;

export const SNIPPET_FILENAMES: Record<string, string> = {
  supabase: "components/auth/SupabaseLogin.tsx",
  "better-auth": "components/auth/BetterAuthLogin.tsx",
  "next-auth": "components/auth/NextAuthLogin.tsx",
  clerk: "components/auth/ClerkLogin.tsx",
  firebase: "components/auth/FirebaseLogin.tsx",
  "custom-jwt": "components/auth/CustomJwtLogin.tsx",
  passport: "components/auth/PassportLogin.tsx",
  mock: "components/auth/MockLogin.tsx",
};

export const SDK_DOCS: SdkDoc[] = [
  {
    id: "supabase",
    name: "Supabase",
    install: "bun add @remcostoeten/auth-drawer @supabase/supabase-js @supabase/ssr",
    importPath: "@remcostoeten/auth-drawer/adapters/supabase",
    supports: ["email/password", "signup", "OAuth", "forgot password", "reset password", "session", "magic link"],
    clientShape: `{
  auth: {
    signInWithPassword,
    signUp,
    signOut,
    resetPasswordForEmail,
    signInWithOAuth,
    signInWithOtp?,
    getSession,
    onAuthStateChange,
  },
}`,
    setup: [
      "Use the browser Supabase client, not the service-role server client.",
      "Pass redirectTo when your app needs OAuth or password-reset redirects.",
      "Keep provider order in ui.auth.providers to match your intended UI order.",
    ],
    gotchas: [
      "The adapter maps Supabase error shapes into the drawer's normalized AuthUiError target model.",
      "Magic link support is available through adapter.features.magicLink when signInWithOtp exists.",
    ],
    notes: (
      <>
        Pass a browser Supabase client. The adapter calls{" "}
        <code className="font-mono text-[0.72rem]">supabase.auth</code> methods
        directly and maps Supabase auth errors into drawer field/form errors.
      </>
    ),
    snippet: `"use client";

import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createSupabaseAdapter } from "@remcostoeten/auth-drawer/adapters/supabase";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";

export function Login() {
  const adapter = useMemo(() => {
    const origin = window.location.origin;

    return createSupabaseAdapter({
      supabase: createClient(),
      providers: ["github", "google"],
      redirectTo: \`\${origin}/auth/callback\`,
      passwordResetRedirectTo: \`\${origin}/reset-password\`,
      requireName: true,
    });
  }, []);

  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "better-auth",
    name: "Better Auth",
    install: "bun add @remcostoeten/auth-drawer better-auth",
    importPath: "@remcostoeten/auth-drawer/adapters/better-auth",
    supports: ["email/password", "signup", "OAuth", "forgot password", "session", "magic link", "email OTP", "anonymous"],
    clientShape: `better-auth/react client with:
  signIn.email
  signIn.social
  signIn.magicLink?
  signIn.emailOtp?
  signIn.anonymous?
  signUp.email
  signOut
  requestPasswordReset
  useSession`,
    setup: [
      "Create the adapter once in client code. When AuthDrawer is inside AuthProvider, useAuth controls the drawer unless you pass open/onOpenChange.",
      "Use callbackURL/newUserCallbackURL to control redirects after sign-in and registration.",
      "Keep provider ids aligned with your Better Auth social provider config.",
    ],
    gotchas: [
      "If the client exposes optional plugins, they are surfaced through adapter.features rather than separate drawer props.",
      "The adapter normalizes Better Auth's nested error objects, so the drawer stays field-aware even when the backend shape changes.",
    ],
    notes: (
      <>
        Pass the client from{" "}
        <code className="font-mono text-[0.72rem]">better-auth/react</code>.
        Optional Better Auth plugins are exposed through{" "}
        <code className="font-mono text-[0.72rem]">adapter.features</code> when
        the client implements them.
      </>
    ),
    snippet: `import { createAuthClient } from "better-auth/react";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createBetterAuthAdapter } from "@remcostoeten/auth-drawer/adapters/better-auth";

const betterAuthClient = createAuthClient();

const adapter = createBetterAuthAdapter({
  client: betterAuthClient,
  providers: ["github", "google"],
  callbackURL: "/dashboard",
  newUserCallbackURL: "/onboarding",
  passwordResetRedirectTo: "/reset-password",
  requireName: true,
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "next-auth",
    name: "NextAuth / Auth.js",
    install: "bun add @remcostoeten/auth-drawer next-auth@beta",
    importPath: "@remcostoeten/auth-drawer/adapters/next-auth",
    supports: ["credentials", "OAuth", "sign out", "session"],
    clientShape: `{
  signIn: (provider, options) => Promise<...>,
  signOut?: (options) => Promise<...>,
  useSession?: () => { data?: any; status?: "loading" | "authenticated" | "unauthenticated" }
}`,
    setup: [
      "Use redirect: false for credential sign-in so the drawer can close itself on success.",
      "Pass useSession to keep the drawer from showing when the user is already authenticated.",
      "Use callbackURL to control OAuth return behavior.",
    ],
    gotchas: [
      "OAuth redirects are still handled by NextAuth itself; the drawer only starts the flow.",
      "If signIn returns an error string, the adapter converts it into a normalized field/form error.",
    ],
    notes: (
      <>
        Pass the client functions from{" "}
        <code className="font-mono text-[0.72rem]">next-auth/react</code>.
        Credentials use <code className="font-mono text-[0.72rem]">redirect: false</code>;
        OAuth redirects through NextAuth.
      </>
    ),
    snippet: `"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createNextAuthAdapter } from "@remcostoeten/auth-drawer/adapters/next-auth";
import { useMemo, useState } from "react";

export function Login() {
  const [open, setOpen] = useState(false);
  const adapter = useMemo(
    () =>
      createNextAuthAdapter({
        client: { signIn, signOut, useSession },
        providers: ["github", "google"],
        callbackURL: "/dashboard",
      }),
    [],
  );

  return <AuthDrawer adapter={adapter} open={open} onOpenChange={setOpen} />;
}`,
  },
  {
    id: "clerk",
    name: "Clerk",
    install: "bun add @remcostoeten/auth-drawer @clerk/nextjs",
    importPath: "@remcostoeten/auth-drawer/adapters/clerk",
    supports: ["email/password", "signup", "OAuth redirect", "sign out", "session"],
    clientShape: `{
  signIn.create?,
  signIn.authenticateWithRedirect?,
  signUp.create?,
  signOut?,
  useUser?
}`,
    setup: [
      "Create the adapter inside a client component under Clerk's provider tree.",
      "Use callbackURL to control the redirect target after OAuth or sign-in.",
      "Set requireName when your Clerk sign-up flow needs the name field in the drawer.",
    ],
    gotchas: [
      "The adapter expects Clerk hooks to be available only on the client.",
      "If you render it outside Clerk's provider, useUser/signIn/signUp will not be available.",
    ],
    notes: (
      <>
        Create this adapter inside a component rendered under Clerk's provider,
        because <code className="font-mono text-[0.72rem]">useSignIn</code>,{" "}
        <code className="font-mono text-[0.72rem]">useSignUp</code>, and{" "}
        <code className="font-mono text-[0.72rem]">useUser</code> are React hooks.
      </>
    ),
    snippet: `"use client";

import { useClerk, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";
import { useMemo } from "react";

export function Login() {
  const { signOut } = useClerk();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const adapter = useMemo(
    () =>
      createClerkAdapter({
        client: {
          signIn: {
            ...signIn,
            create: async (input) => {
              const result = await signIn?.create(input);

              if (result?.status === "complete" && result.createdSessionId) {
                await setSignInActive?.({ session: result.createdSessionId });
              }

              return result;
            },
            authenticateWithRedirect: signIn?.authenticateWithRedirect?.bind(signIn),
          },
          signUp: {
            ...signUp,
            create: async (input) => {
              const result = await signUp?.create(input);

              if (result?.status === "complete" && result.createdSessionId) {
                await setSignUpActive?.({ session: result.createdSessionId });
              }

              return result;
            },
          },
          signOut,
          useUser,
        },
        providers: ["github", "google"],
        callbackURL: "/dashboard",
        requireName: true,
      }),
    [signIn, signUp, signOut, setSignInActive, setSignUpActive],
  );

  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "firebase",
    name: "Firebase Auth",
    install: "bun add @remcostoeten/auth-drawer firebase",
    importPath: "@remcostoeten/auth-drawer/adapters/firebase",
    supports: ["email/password", "signup", "OAuth redirect", "forgot password", "reset password", "session"],
    clientShape: `{
  auth: {
    signInWithPassword,
    signUp,
    signOut,
    resetPasswordForEmail,
    updateUser,
    signInWithRedirect?,
    onAuthStateChanged,
    getSession,
  }
}`,
    setup: [
      "Pass the modular Firebase auth methods explicitly so your bundle only includes the APIs you use.",
      "Use providerFactory to translate provider ids into Firebase auth provider instances.",
      "Keep the auth listener inside the client; the adapter turns it into useSession for the drawer.",
    ],
    gotchas: [
      "If you use redirect sign-in, the drawer closes before navigation and rehydrates on return through useSession.",
      "Password reset and profile password update are separate flows in the adapter contract.",
    ],
    notes: (
      <>
        The Firebase adapter accepts the modular SDK functions explicitly so
        bundlers only include the auth APIs your app imports.
      </>
    ),
    snippet: `import {
  GithubAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updatePassword,
} from "firebase/auth";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createFirebaseAdapter } from "@remcostoeten/auth-drawer/adapters/firebase";

const auth = getAuth();

const adapter = createFirebaseAdapter({
  auth: {
    currentUser: auth.currentUser,
    onAuthStateChanged: (next, error) => onAuthStateChanged(auth, next, error),
  },
  createUserWithEmailAndPassword: (_auth, email, password) =>
    createUserWithEmailAndPassword(auth, email, password),
  signInWithEmailAndPassword: (_auth, email, password) =>
    signInWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  sendPasswordResetEmail: (_auth, email) => sendPasswordResetEmail(auth, email),
  updatePassword,
  signInWithRedirect: (_auth, provider) => signInWithRedirect(auth, provider),
  providerFactory: (provider) =>
    provider === "github" ? new GithubAuthProvider() : new GoogleAuthProvider(),
  providers: ["github", "google"],
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "custom-jwt",
    name: "Custom JWT / REST",
    install: "bun add @remcostoeten/auth-drawer",
    importPath: "@remcostoeten/auth-drawer/adapters/custom-jwt",
    supports: ["email/password", "signup", "OAuth redirect", "forgot password", "reset password", "session"],
    clientShape: `{
  POST /login
  POST /register
  POST /logout
  POST /forgot-password
  POST /reset-password
  GET /me
  optional OAuth redirect handler
}`,
    setup: [
      "Use the adapter when your backend returns JWTs and a profile endpoint.",
      "Set tokenStorageKey to match your app's storage policy.",
      "Point oauthUrl at a server route that initiates provider auth and returns to the app.",
    ],
    gotchas: [
      "The adapter stores tokens in localStorage by default, so pair it with your own storage strategy if you need stricter handling.",
      "Your /me endpoint should return the current user shape expected by the adapter.",
    ],
    notes: (
      <>
        Use this when your backend returns a bearer token and a{" "}
        <code className="font-mono text-[0.72rem]">/me</code> style profile
        endpoint. The adapter stores the token in localStorage by default.
      </>
    ),
    snippet: `import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createCustomJwtAdapter } from "@remcostoeten/auth-drawer/adapters/custom-jwt";

const adapter = createCustomJwtAdapter({
  baseUrl: "/api/auth",
  loginUrl: "/login",
  registerUrl: "/register",
  logoutUrl: "/logout",
  profileUrl: "/me",
  forgotPasswordUrl: "/forgot-password",
  resetPasswordUrl: "/reset-password",
  tokenStorageKey: "app_token",
  providers: ["github"],
  oauthUrl: (provider) => \`/api/auth/oauth/\${provider}\`,
  requireName: true,
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "passport",
    name: "Passport / cookie sessions",
    install: "bun add @remcostoeten/auth-drawer",
    importPath: "@remcostoeten/auth-drawer/adapters/passport",
    supports: ["email/password", "signup", "sign out", "session"],
    clientShape: `{
  POST /login
  POST /register
  POST /logout
  GET /user
}`,
    setup: [
      "Keep credentials on the server with cookie-based sessions.",
      "Expose a /user endpoint that returns the current session user.",
      "Use credentials: \"include\" end-to-end so the drawer and backend stay in sync.",
    ],
    gotchas: [
      "This adapter assumes a server-driven cookie session model, not a JWT-in-localStorage model.",
      "If your backend uses different field names, normalize them before returning from /user.",
    ],
    notes: (
      <>
        Use this for server-managed cookie sessions. Requests are sent with{" "}
        <code className="font-mono text-[0.72rem]">credentials: "include"</code>.
      </>
    ),
    snippet: `import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createPassportAdapter } from "@remcostoeten/auth-drawer/adapters/passport";

const adapter = createPassportAdapter({
  loginUrl: "/login",
  registerUrl: "/register",
  logoutUrl: "/logout",
  userProfileUrl: "/user",
  requireName: true,
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "mock",
    name: "createMockAdapter",
    install: "bun add @remcostoeten/auth-drawer",
    importPath: "@remcostoeten/auth-drawer/adapters/mock",
    supports: ["email/password", "signup", "OAuth", "forgot password", "reset password", "session"],
    clientShape: `createMockAdapter options:
  signIn
  signUp
  signOut
  signInWithOAuth
  requestPasswordReset
  resetPassword
  useSession`,
    setup: [
      "Use this for UI development, docs, and regression checks when the real backend is not wired yet.",
      "The docs demo preloads admin@example.com and password so the email/password flow succeeds immediately.",
      "Change mockEmail and mockPassword to simulate successful and failed sign-in paths.",
      "Use latencyMs to test loading states and motion timing.",
    ],
    gotchas: [
      "Mock session state is process-local and should not be used for production behavior.",
      "Because the adapter is stateful, tests should reset it between scenarios if they depend on a clean session.",
    ],
    notes: (
      <>
        Use this for demos, local UI work, and documentation. Default success
        credentials are <code className="font-mono text-[0.72rem]">admin@example.com</code>{" "}
        and <code className="font-mono text-[0.72rem]">password</code>.
      </>
    ),
    snippet: `import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createMockAdapter } from "@remcostoeten/auth-drawer/adapters/mock";

const adapter = createMockAdapter({
  latencyMs: 500,
  mockEmail: "admin@example.com",
  mockPassword: "password",
  requireName: false,
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
];

export const SUPABASE_STEPS: GuideStep[] = [
  {
    id: "supabase-install",
    number: 1,
    title: "Install Packages",
    description: "Install Auth Drawer, the Supabase JavaScript client, and Supabase's Next.js SSR helpers.",
    type: "command",
    command: "bun add @remcostoeten/auth-drawer @supabase/supabase-js @supabase/ssr",
    docsUrl: "https://supabase.com/docs/guides/getting-started/quickstarts/nextjs",
  },
  {
    id: "supabase-env",
    number: 2,
    title: "Declare Environment Variables",
    description: "Use the project URL and publishable key from your Supabase project's Connect dialog. Do not expose the secret/service role key to the browser.",
    type: "single-file",
    docsUrl: "https://supabase.com/docs/guides/getting-started/quickstarts/nextjs#declare-supabase-environment-variables",
    file: {
      name: ".env.local",
      lang: "bash",
      code: `NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`,
    },
  },
  {
    id: "supabase-dashboard",
    number: 3,
    title: "Configure Auth Redirects & Providers",
    description: "Enable email/password and any OAuth providers in the Supabase dashboard, then allow the URLs the drawer redirects to.",
    type: "command",
    docsUrl: "https://supabase.com/docs/guides/auth/social-login",
    command: `# Supabase Dashboard -> Authentication -> URL Configuration
# Site URL:
http://localhost:3000

# Redirect URLs:
http://localhost:3000/auth/callback
http://localhost:3000/reset-password

# Supabase Dashboard -> Authentication -> Providers
# Enable Email, then enable GitHub/Google if you use those providers.`,
  },
  {
    id: "supabase-client",
    number: 4,
    title: "Create the Browser Client",
    description: "Create a browser Supabase client for Client Components. This is the client Auth Drawer receives through the adapter.",
    type: "single-file",
    docsUrl: "https://supabase.com/docs/guides/with-nextjs",
    file: {
      name: "lib/supabase/client.ts",
      lang: "ts",
      code: `import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}`,
    },
  },
  {
    id: "supabase-mount",
    number: 5,
    title: "Mount AuthDrawer With Supabase",
    description: "Wrap the browser client with Auth Drawer's Supabase adapter and pass it into the drawer.",
    type: "single-file",
    docsUrl: "https://supabase.com/docs/reference/javascript/auth-signinwithpassword",
    file: {
      name: "components/auth/SupabaseLogin.tsx",
      lang: "tsx",
      code: `"use client";

import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createSupabaseAdapter } from "@remcostoeten/auth-drawer/adapters/supabase";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";

export function SupabaseLogin() {
  const adapter = useMemo(() => {
    const origin = window.location.origin;

    return createSupabaseAdapter({
      supabase: createClient(),
      providers: ["github", "google"],
      redirectTo: \`\${origin}/auth/callback\`,
      passwordResetRedirectTo: \`\${origin}/reset-password\`,
      requireName: true,
    });
  }, []);

  return <AuthDrawer adapter={adapter} />;
}`,
    },
  },
  {
    id: "supabase-reset",
    number: 6,
    title: "Create the Reset Password Route",
    description: "Point Supabase password reset emails here. The drawer starts in reset-password mode and calls `supabase.auth.updateUser` through the adapter.",
    type: "single-file",
    docsUrl: "https://supabase.com/docs/guides/auth/passwords#resetting-a-password",
    file: {
      name: "app/reset-password/page.tsx",
      lang: "tsx",
      code: `"use client";

import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createSupabaseAdapter } from "@remcostoeten/auth-drawer/adapters/supabase";
import { createClient } from "@/lib/supabase/client";
import { useMemo } from "react";

export default function ResetPasswordPage() {
  const adapter = useMemo(() => createSupabaseAdapter({ supabase: createClient() }), []);

  return (
    <AuthDrawer
      adapter={adapter}
      defaultOpen
      hideTrigger
      config={{
        ui: {
          auth: {
            allowRegister: false,
            initialMode: "resetPassword",
          },
        },
      }}
    />
  );
}`,
    },
  },
];

export const NEXT_AUTH_STEPS: GuideStep[] = [
  {
    id: "next-auth-install",
    number: 1,
    title: "Install Packages",
    description: "Install Auth Drawer and the current Auth.js package for Next.js.",
    type: "command",
    command: "bun add @remcostoeten/auth-drawer next-auth@beta",
    docsUrl: "https://authjs.dev/getting-started/installation?framework=next-js",
  },
  {
    id: "next-auth-env",
    number: 2,
    title: "Declare Environment Variables",
    description: "Generate `AUTH_SECRET`, then add provider credentials for any OAuth providers you enable.",
    type: "single-file",
    docsUrl: "https://authjs.dev/getting-started/installation?framework=next-js#setup-environment",
    file: {
      name: ".env.local",
      lang: "bash",
      code: `AUTH_SECRET=
AUTH_URL=http://localhost:3000

AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=`,
    },
  },
  {
    id: "next-auth-server",
    number: 3,
    title: "Create Auth.js Server Config",
    description: "Configure Credentials for the drawer's email/password form and OAuth providers for social sign-in.",
    type: "single-file",
    docsUrl: "https://authjs.dev/getting-started/providers/credentials",
    file: {
      name: "auth.ts",
      lang: "ts",
      code: `import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub,
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");

        // Replace this with your user lookup and password verification.
        if (email !== "admin@example.com" || password !== "password") {
          return null;
        }

        return {
          id: "user_1",
          email,
          name: "Admin",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
});`,
    },
  },
  {
    id: "next-auth-route",
    number: 4,
    title: "Expose the Auth Route Handler",
    description: "Wire Auth.js into the standard App Router catch-all route.",
    type: "single-file",
    docsUrl: "https://authjs.dev/getting-started/installation?framework=next-js#configure",
    file: {
      name: "app/api/auth/[...nextauth]/route.ts",
      lang: "ts",
      code: `import { handlers } from "@/auth";

export const { GET, POST } = handlers;`,
    },
  },
  {
    id: "next-auth-session-provider",
    number: 5,
    title: "Add SessionProvider",
    description: "The Auth Drawer adapter calls `useSession` from `next-auth/react`, so render it under `SessionProvider`.",
    type: "single-file",
    docsUrl: "https://authjs.dev/getting-started/session-management/get-session",
    file: {
      name: "app/providers.tsx",
      lang: "tsx",
      code: `"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}`,
    },
  },
  {
    id: "next-auth-mount",
    number: 6,
    title: "Mount AuthDrawer With NextAuth",
    description: "Pass `next-auth/react` client functions into Auth Drawer's NextAuth adapter.",
    type: "single-file",
    docsUrl: "https://authjs.dev/getting-started/session-management/login",
    file: {
      name: "components/auth/NextAuthLogin.tsx",
      lang: "tsx",
      code: `"use client";

import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createNextAuthAdapter } from "@remcostoeten/auth-drawer/adapters/next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { useMemo, useState } from "react";

export function NextAuthLogin() {
  const [open, setOpen] = useState(false);

  const adapter = useMemo(
    () =>
      createNextAuthAdapter({
        client: { signIn, signOut, useSession },
        providers: ["github", "google"],
        callbackURL: "/dashboard",
      }),
    [],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-[5px] bg-foreground px-4 py-2 text-sm font-semibold text-background"
      >
        Open login portal
      </button>

      <AuthDrawer adapter={adapter} open={open} onOpenChange={setOpen} />
    </>
  );
}`,
    },
  },
];

export const CLERK_STEPS: GuideStep[] = [
  {
    id: "clerk-install",
    number: 1,
    title: "Install Packages",
    description: "Install Auth Drawer and Clerk's Next.js SDK. Use `@clerk/nextjs` for Next.js apps.",
    type: "command",
    command: "bun add @remcostoeten/auth-drawer @clerk/nextjs",
    docsUrl: "https://clerk.com/docs/nextjs/user-object",
  },
  {
    id: "clerk-env",
    number: 2,
    title: "Declare Environment Variables",
    description: "Copy the publishable and secret keys from Clerk Dashboard -> API keys.",
    type: "single-file",
    docsUrl: "https://clerk.com/docs/nextjs/user-object",
    file: {
      name: ".env.local",
      lang: "bash",
      code: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=`,
    },
  },
  {
    id: "clerk-middleware",
    number: 3,
    title: "Add Clerk Middleware",
    description: "Expose Clerk auth state to Next.js. In Next 16 use `proxy.ts`; in Next 15 and below use `middleware.ts` with the same contents.",
    type: "single-file",
    docsUrl: "https://clerk.com/docs/reference/nextjs/clerk-middleware",
    file: {
      name: "proxy.ts",
      lang: "ts",
      code: `import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};`,
    },
  },
  {
    id: "clerk-provider",
    number: 4,
    title: "Wrap the App With ClerkProvider",
    description: "Clerk hooks only work below `ClerkProvider`. Put it at the app entry so Auth Drawer can call `useUser`, `useSignIn`, and `useSignUp`.",
    type: "single-file",
    docsUrl: "https://clerk.com/docs/reference/components/clerk-provider",
    file: {
      name: "app/layout.tsx",
      lang: "tsx",
      code: `import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}`,
    },
  },
  {
    id: "clerk-dashboard",
    number: 5,
    title: "Configure Sign-In Methods",
    description: "Enable email/password and any OAuth providers you pass to the adapter. Add the same callback target you use in `callbackURL`.",
    type: "command",
    docsUrl: "https://clerk.com/docs/authentication/custom-flows/password",
    command: `# Clerk Dashboard -> Configure -> Email, phone, username
# Enable email address and password if you want drawer email/password auth.

# Clerk Dashboard -> Configure -> SSO connections
# Enable GitHub/Google if you pass providers: ["github", "google"].

# Clerk Dashboard -> Configure -> Paths / Redirect URLs
# Allow your local and production app URLs, for example:
http://localhost:3000
http://localhost:3000/dashboard`,
  },
  {
    id: "clerk-mount",
    number: 6,
    title: "Mount AuthDrawer With Clerk",
    description: "Create the adapter inside a Client Component under `ClerkProvider`. The wrapper activates completed Clerk custom-flow sessions.",
    type: "single-file",
    docsUrl: "https://clerk.com/docs/reference/hooks/use-sign-in",
    file: {
      name: "components/auth/ClerkLogin.tsx",
      lang: "tsx",
      code: `"use client";

import { useClerk, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";
import { useMemo } from "react";

export function ClerkLogin() {
  const { signOut } = useClerk();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const adapter = useMemo(
    () =>
      createClerkAdapter({
        client: {
          signIn: {
            ...signIn,
            create: async (input) => {
              const result = await signIn?.create(input);

              if (result?.status === "complete" && result.createdSessionId) {
                await setSignInActive?.({ session: result.createdSessionId });
              }

              return result;
            },
            authenticateWithRedirect: signIn?.authenticateWithRedirect?.bind(signIn),
          },
          signUp: {
            ...signUp,
            create: async (input) => {
              const result = await signUp?.create(input);

              if (result?.status === "complete" && result.createdSessionId) {
                await setSignUpActive?.({ session: result.createdSessionId });
              }

              return result;
            },
          },
          signOut,
          useUser,
        },
        providers: ["github", "google"],
        callbackURL: "/dashboard",
        requireName: true,
      }),
    [signIn, signUp, signOut, setSignInActive, setSignUpActive],
  );

  return <AuthDrawer adapter={adapter} />;
}`,
    },
  },
];

export const BETTER_AUTH_STEPS: GuideStep[] = [
  {
    id: "ba-install",
    number: 1,
    title: "Install Core Packages",
    description: "Install the `@remcostoeten/auth-drawer` package alongside the core Better Auth client and server package.",
    type: "command",
    command: "bun add @remcostoeten/auth-drawer better-auth",
    docsUrl: "https://www.better-auth.com/docs/installation",
  },
  {
    id: "ba-env",
    number: 2,
    title: "Set Environment Variables",
    description: "Better Auth requires a secret and base URL. Add provider credentials for any social providers you enable.",
    type: "single-file",
    docsUrl: "https://www.better-auth.com/docs/installation#set-environment-variables",
    file: {
      name: ".env.local",
      lang: "bash",
      code: `BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
# Match your app origin (the monorepo example uses port 3005)

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=`,
    },
  },
  {
    id: "ba-schema",
    number: 3,
    title: "Generate Database Schema & Models",
    description: "Better Auth manages active sessions, account linking, and credentials in your database. Choose the ORM you already use, then generate the Better Auth schema for it.",
    type: "split-adapters",
    docsUrl: "https://www.better-auth.com/docs/installation",
    options: {
      prisma: {
        name: "Option A: Prisma",
        description: "Generate the Better Auth Prisma schema, then review and apply it with your normal Prisma migration flow.",
        command: "npx auth@latest generate",
        docsUrl: "https://www.better-auth.com/docs/installation#prisma",
      },
      drizzle: {
        name: "Option B: Drizzle",
        description: "Generate the Better Auth Drizzle schema, then create and run your Drizzle migration.",
        command: "npx auth@latest generate\nnpx drizzle-kit generate\nnpx drizzle-kit migrate",
        docsUrl: "https://www.better-auth.com/docs/installation#drizzle",
      },
    },
  },
  {
    id: "ba-server",
    number: 4,
    title: "Initialize Server Authentication Configuration",
    description: "Create the Better Auth server instance, connect your database adapter, and register the authentication methods you want to expose.",
    type: "split-adapters",
    docsUrl: "https://www.better-auth.com/docs/installation#initialize-better-auth",
    options: {
      prisma: {
        name: "Option A: Prisma",
        file: {
          name: "lib/auth.ts (Prisma)",
          lang: "ts",
          code: `import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});`,
        },
        docsUrl: "https://www.better-auth.com/docs/installation#initialize-better-auth",
      },
      drizzle: {
        name: "Option B: Drizzle",
        file: {
          name: "lib/auth.ts (Drizzle)",
          lang: "ts",
          code: `import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // pg, mysql, sqlite
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});`,
        },
        docsUrl: "https://www.better-auth.com/docs/installation#initialize-better-auth",
      },
    },
  },
  {
    id: "ba-route",
    number: 5,
    title: "Set Up the Next.js Catch-All Route",
    description: "Expose Better Auth under the standard Next.js App Router catch-all route. This handles credential, session, and redirect requests for `/api/auth/*`.",
    type: "single-file",
    docsUrl: "https://www.better-auth.com/docs/integrations/next#create-api-route",
    file: {
      name: "app/api/auth/[...all]/route.ts",
      lang: "ts",
      code: `import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);`,
    },
  },
  {
    id: "ba-client",
    number: 6,
    title: "Initialize Client-Side SDK Instance",
    description: "Create the React client used by the drawer adapter. Omit `baseURL` when the auth route runs on the same origin, or set it when your auth server lives elsewhere.",
    type: "single-file",
    docsUrl: "https://www.better-auth.com/docs/installation#client-setup",
    file: {
      name: "lib/auth-client.ts",
      lang: "ts",
      code: `import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();`,
    },
  },
  {
    id: "ba-mount",
    number: 7,
    title: "Mount AuthDrawer Component & Pass Adapter",
    description:
      "Wrap the app in AuthProvider when you need useAuth() across the tree. Add a portal mount in your root layout so the drawer renders above page content.",
    type: "single-file",
    docsUrl: "https://www.better-auth.com/docs/installation#react",
    file: {
      name: "components/auth-shell.tsx",
      lang: "tsx",
      code: `"use client";

import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer";
import { authAdapter } from "@/lib/auth-adapter";
import { authDrawerConfig } from "@/lib/auth-drawer-config";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider adapter={authAdapter}>
      {children}
      <AuthDrawer adapter={authAdapter} config={authDrawerConfig} hideTrigger />
    </AuthProvider>
  );
}

// app/layout.tsx — add once near the document root:
// <div id="auth-drawer-portal" />`,
    },
  },
];
