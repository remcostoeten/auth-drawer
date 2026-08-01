"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { AuthDrawer, AuthProvider, useAuth } from "@remcostoeten/auth-drawer";
import { authAdapter } from "@/lib/auth-adapter";
import { authDrawerConfig } from "@/lib/auth-drawer-config";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  // A fresh sign-in/up/oauth sets this; the redirect waits until the Better
  // Auth session has actually settled (see RedirectAfterAuth).
  const pendingRedirectRef = useRef(false);

  const handleAuthSuccess = useCallback(
    (action: "signIn" | "signUp" | "signOut" | "oauth") => {
      if (action === "signIn" || action === "signUp" || action === "oauth") {
        pendingRedirectRef.current = true;
      }
    },
    [],
  );

  return (
    <AuthProvider adapter={authAdapter} onSuccess={handleAuthSuccess}>
      <RedirectAfterAuth pendingRedirectRef={pendingRedirectRef} />
      {children}
      <AuthDrawer adapter={authAdapter} config={authDrawerConfig} hideTrigger />
    </AuthProvider>
  );
}

/**
 * The drawer (v0.3+) keeps itself open through the connecting state and shows a
 * success commit until the session is fully loaded — no manual delay needed.
 * We only navigate once a *fresh* sign-in's session has settled, so we never
 * redirect a visitor whose session was simply restored on mount. Because
 * AuthShell lives in the root layout, the drawer stays mounted across the
 * client-side navigation and finishes its success animation on the dashboard.
 */
function RedirectAfterAuth({
  pendingRedirectRef,
}: {
  pendingRedirectRef: React.RefObject<boolean>;
}) {
  const router = useRouter();
  const { user, isPending } = useAuth();

  useEffect(() => {
    if (pendingRedirectRef.current && user && !isPending) {
      pendingRedirectRef.current = false;
      router.push("/dashboard");
    }
  }, [user, isPending, router, pendingRedirectRef]);

  return null;
}
