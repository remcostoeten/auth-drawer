"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AuthDrawer, AuthProvider, type AuthAction } from "@remcostoeten/auth-drawer/react";
import { authAdapter } from "@/lib/auth-adapter";
import { authDrawerConfig } from "@/lib/auth-drawer-config";

const SUCCESS_COMMIT_MS = 700;

export function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSuccess = useCallback(
    (action: AuthAction) => {
      if (action === "signIn" || action === "signUp") {
        window.setTimeout(() => {
          router.push("/dashboard");
        }, SUCCESS_COMMIT_MS);
      }
    },
    [router],
  );

  return (
    <AuthProvider adapter={authAdapter} onSuccess={handleSuccess}>
      {children}
      <AuthDrawer adapter={authAdapter} config={authDrawerConfig} hideTrigger />
    </AuthProvider>
  );
}
