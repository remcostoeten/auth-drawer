import type { ReactNode } from "react";
import { CodeBlock } from "../code/server-code-block";

type SdkDoc = {
  id: string;
  name: string;
  install: string;
  importPath: string;
  supports: string[];
  notes: ReactNode;
  snippet: string;
};

const ADAPTER_CONTRACT = `type AuthAdapter = {
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

const SDK_DOCS: SdkDoc[] = [
  {
    id: "supabase",
    name: "Supabase",
    install: "bun add @remcostoeten/auth-drawer @supabase/supabase-js",
    importPath: "@remcostoeten/auth-drawer/adapters/supabase",
    supports: ["email/password", "signup", "OAuth", "forgot password", "reset password", "session", "magic link"],
    notes: (
      <>
        Pass a browser Supabase client. The adapter calls{" "}
        <code className="font-mono text-[0.72rem]">supabase.auth</code> methods
        directly and maps Supabase auth errors into drawer field/form errors.
      </>
    ),
    snippet: `import { createClient } from "@supabase/supabase-js";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createSupabaseAdapter } from "@remcostoeten/auth-drawer/adapters/supabase";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const adapter = createSupabaseAdapter({
  supabase,
  providers: ["github", "google"],
  redirectTo: window.location.origin,
  passwordResetRedirectTo: \`\${window.location.origin}/reset-password\`,
  requireName: true,
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "better-auth",
    name: "Better Auth",
    install: "bun add @remcostoeten/auth-drawer better-auth",
    importPath: "@remcostoeten/auth-drawer/adapters/better-auth",
    supports: ["email/password", "signup", "OAuth", "forgot password", "session", "magic link", "email OTP", "anonymous"],
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
    install: "bun add @remcostoeten/auth-drawer next-auth",
    importPath: "@remcostoeten/auth-drawer/adapters/next-auth",
    supports: ["credentials", "OAuth", "sign out", "session"],
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

const adapter = createNextAuthAdapter({
  client: { signIn, signOut, useSession },
  providers: ["github", "google"],
  callbackURL: "/dashboard",
});

export function Login() {
  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "clerk",
    name: "Clerk",
    install: "bun add @remcostoeten/auth-drawer @clerk/clerk-react",
    importPath: "@remcostoeten/auth-drawer/adapters/clerk",
    supports: ["email/password", "signup", "OAuth redirect", "sign out", "session"],
    notes: (
      <>
        Create this adapter inside a component rendered under Clerk's provider,
        because <code className="font-mono text-[0.72rem]">useSignIn</code>,{" "}
        <code className="font-mono text-[0.72rem]">useSignUp</code>, and{" "}
        <code className="font-mono text-[0.72rem]">useUser</code> are React hooks.
      </>
    ),
    snippet: `"use client";

import { useClerk, useSignIn, useSignUp, useUser } from "@clerk/clerk-react";
import { AuthDrawer } from "@remcostoeten/auth-drawer";
import { createClerkAdapter } from "@remcostoeten/auth-drawer/adapters/clerk";

export function Login() {
  const { signOut } = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const adapter = createClerkAdapter({
    client: { signIn, signUp, signOut, useUser },
    providers: ["github", "google"],
    callbackURL: "/dashboard",
    requireName: true,
  });

  return <AuthDrawer adapter={adapter} />;
}`,
  },
  {
    id: "firebase",
    name: "Firebase Auth",
    install: "bun add @remcostoeten/auth-drawer firebase",
    importPath: "@remcostoeten/auth-drawer/adapters/firebase",
    supports: ["email/password", "signup", "OAuth redirect", "forgot password", "reset password", "session"],
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
    name: "Mock adapter",
    install: "bun add @remcostoeten/auth-drawer",
    importPath: "@remcostoeten/auth-drawer/adapters/mock",
    supports: ["email/password", "signup", "OAuth", "forgot password", "reset password", "session"],
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

function FeaturePill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[999px] border border-foreground/10 bg-background px-2 py-1 text-[0.66rem] font-medium text-foreground/58">
      {children}
    </span>
  );
}

export function SdkDocsSection() {
  return (
    <div className="space-y-8">
      <div>
        <p className="max-w-2xl text-sm leading-6 text-foreground/58">
          The drawer never talks to a backend by itself. You pass one typed
          adapter, and the adapter decides which UI is available. If{" "}
          <code className="font-mono text-[0.72rem]">signUp</code> is missing,
          register mode is hidden. If{" "}
          <code className="font-mono text-[0.72rem]">signInWithOAuth</code> is
          missing, OAuth buttons are hidden. If{" "}
          <code className="font-mono text-[0.72rem]">requestPasswordReset</code>{" "}
          is missing, forgot-password is hidden.
        </p>
        <div className="mt-4 rounded-[8px] border border-foreground/10 bg-foreground/[0.03] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/45">
            Required adapter contract
          </p>
          <CodeBlock lang="ts" embedded>
            {ADAPTER_CONTRACT}
          </CodeBlock>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SDK_DOCS.map((doc) => (
          <a
            key={doc.id}
            href={`#sdk-${doc.id}`}
            className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-3 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.045]"
          >
            <p className="text-sm font-semibold text-foreground">{doc.name}</p>
            <p className="mt-1 font-mono text-[0.68rem] text-foreground/42">
              {doc.importPath}
            </p>
          </a>
        ))}
      </div>

      <div className="space-y-6">
        {SDK_DOCS.map((doc) => (
          <article
            key={doc.id}
            id={`sdk-${doc.id}`}
            className="scroll-mt-24 overflow-hidden rounded-[10px] border border-foreground/10 bg-foreground/[0.02]"
          >
            <div className="border-b border-foreground/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{doc.name}</h3>
                  <p className="mt-1 font-mono text-[0.7rem] text-foreground/44">
                    import from "{doc.importPath}"
                  </p>
                </div>
                <div className="rounded-[5px] border border-foreground/10 bg-background px-2.5 py-1.5 font-mono text-[0.68rem] text-foreground/58">
                  {doc.install}
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/58">
                {doc.notes}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {doc.supports.map((feature) => (
                  <FeaturePill key={`${doc.id}-${feature}`}>{feature}</FeaturePill>
                ))}
              </div>
            </div>
            <CodeBlock lang="tsx" embedded>
              {doc.snippet}
            </CodeBlock>
          </article>
        ))}
      </div>
    </div>
  );
}
