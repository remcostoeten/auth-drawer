import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AuthUiError } from "../auth-errors";
import type { AuthAdapter, AuthSessionState } from "../types";

type AuthAction = "signIn" | "signUp" | "signOut" | "oauth";

interface AuthContextType {
  user: AuthSessionState["user"] | null;
  session: any | null;
  isPending: boolean;
  error: any;
  signIn: AuthAdapter["signIn"];
  signUp: AuthAdapter["signUp"];
  signInWithOAuth: AuthAdapter["signInWithOAuth"];
  signOut: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  adapter: AuthAdapter;
  children: ReactNode;
  onSuccess?: (action: AuthAction) => void;
  onError?: (error: AuthUiError, action: AuthAction) => void;
}

/**
 * Global React wrapper providing session state and drawer controls.
 */
export function AuthProvider({ adapter, children, onSuccess, onError }: AuthProviderProps) {
  const { data, isPending, error } = adapter.useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const value = useMemo<AuthContextType>(
    () => ({
      user: data?.user ?? null,
      session: data?.session ?? null,
      isPending,
      error,
      signIn: adapter.signIn,
      signUp: adapter.signUp,
      signInWithOAuth: adapter.signInWithOAuth,
      signOut: async () => {
        try {
          const result = await adapter.signOut?.();
          if (result && !result.success && result.error) {
            onError?.(result.error, "signOut");
            return;
          }
          onSuccess?.("signOut");
        } catch (signOutError) {
          const normalized = adapter.normalizeError?.(signOutError);
          if (normalized) {
            onError?.(normalized, "signOut");
            return;
          }
          throw signOutError;
        }
      },
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      isDrawerOpen,
    }),
    [adapter, data, error, isDrawerOpen, isPending, onError, onSuccess],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Consumes global auth session state and drawer controls.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
