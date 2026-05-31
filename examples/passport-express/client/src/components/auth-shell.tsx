"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AuthDrawer, AuthProvider } from "@remcostoeten/auth-drawer";
import { authAdapter } from "@/lib/auth-adapter";
import { authDrawerConfig } from "@/lib/auth-drawer-config";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSuccess = useCallback(
    (action: "signIn" | "signUp" | "signOut" | "oauth") => {
      if (action === "signIn" || action === "signUp") router.push("/dashboard");
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
