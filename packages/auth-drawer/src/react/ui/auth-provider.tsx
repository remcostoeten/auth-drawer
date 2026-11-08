import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  createAuthClient,
  createPushSession,
  type AuthAction,
  type AuthResult,
  type AuthSessionState,
  type AuthUiError,
  type CredentialAuthInput,
} from "@remcostoeten/auth-drawer/core";
import { useAdapterSession } from "../hooks/use-adapter-session";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { useStore } from "../hooks/use-store";
import type { AuthAdapter } from "../types";

interface AuthContextType {
  user: AuthSessionState["user"] | null;
  session: any | null;
  isPending: boolean;
  error: any;
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp: AuthAdapter["signUp"];
  signInWithOAuth: AuthAdapter["signInWithOAuth"];
  signInWithMagicLink: ((email: string) => Promise<AuthResult>) | undefined;
  signInWithPasskey: (() => Promise<AuthResult>) | undefined;
  signOut: NonNullable<AuthAdapter["signOut"]>;
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
  const snapshot = useAdapterSession(adapter);
  const { data, isPending, error } = snapshot;
  const [pushed] = useState(() => createPushSession(snapshot));
  const clientAdapter = useMemo<AuthAdapter>(
    () => ({ ...adapter, session: pushed.source }),
    [adapter, pushed],
  );
  const [client] = useState(() => createAuthClient({ adapter: clientAdapter, onSuccess, onError }));

  useIsomorphicLayoutEffect(() => {
    pushed.push({ data, isPending, error });
    client.updateInputs({ adapter: clientAdapter, onSuccess, onError });
  }, [client, clientAdapter, pushed, data, isPending, error, onSuccess, onError]);

  const { isDrawerOpen } = useStore(client);

  const value = useMemo<AuthContextType>(
    () => ({
      user: data?.user ?? null,
      session: data?.session ?? null,
      isPending,
      error,
      signIn: client.signIn,
      signInWithMagicLink: adapter.features?.magicLink ? client.signInWithMagicLink : undefined,
      signInWithPasskey: adapter.features?.passkey ? client.signInWithPasskey : undefined,
      signUp: adapter.signUp ? client.signUp : undefined,
      signInWithOAuth: adapter.signInWithOAuth ? client.signInWithOAuth : undefined,
      signOut: client.signOut,
      openDrawer: client.openDrawer,
      closeDrawer: client.closeDrawer,
      isDrawerOpen,
    }),
    [adapter, client, data, error, isDrawerOpen, isPending],
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

export function useOptionalAuth() {
  return useContext(AuthContext);
}
