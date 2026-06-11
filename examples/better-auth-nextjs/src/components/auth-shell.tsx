"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer";
import { authAdapter } from "@/lib/auth-adapter";
import { authDrawerConfig } from "@/lib/auth-drawer-config";

const SUCCESS_COMMIT_MS = 700;

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  const router = useRouter();

  const handleAuthSuccess = useCallback(
    (action: "signIn" | "signUp" | "signOut" | "oauth") => {
      if (action === "signIn" || action === "signUp" || action === "oauth") {
        window.setTimeout(() => {
          router.push("/dashboard");
        }, SUCCESS_COMMIT_MS);
      }
    },
    [router],
  );

  return (
    <AuthProvider adapter={authAdapter} onSuccess={handleAuthSuccess}>
      {children}
      <AuthDrawer adapter={authAdapter} config={authDrawerConfig} hideTrigger />
    </AuthProvider>
  );
}
