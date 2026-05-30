import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { normalizeAuthError, type AuthUiError } from "../auth-errors";
import type { AuthAdapter, AuthResult, AuthSessionState } from "../types";

type AuthAction = "signIn" | "signUp" | "signOut" | "oauth";

interface AuthContextType {
  user: AuthSessionState["user"] | null;
  session: any | null;
  isPending: boolean;
  error: any;
  signIn: AuthAdapter["signIn"];
  signUp: AuthAdapter["signUp"];
  signInWithOAuth: AuthAdapter["signInWithOAuth"];
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

function fallbackUnavailableError(action: AuthAction) {
  return new Error(`${action} is unavailable for this auth adapter.`);
}

function normalizeProviderError(
  adapter: AuthAdapter,
  error: unknown,
  action: AuthAction,
): AuthUiError {
  return adapter.normalizeError?.(error) ?? normalizeAuthError(error, {
    fallbackTarget: action === "oauth" ? "oauth" : "form",
  });
}

/**
 * Global React wrapper providing session state and drawer controls.
 */
export function AuthProvider({ adapter, children, onSuccess, onError }: AuthProviderProps) {
  const { data, isPending, error } = adapter.useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSuccess = useMemo(
    () => (action: AuthAction) => {
      adapter.onSuccess?.(action);
      onSuccess?.(action);
    },
    [adapter, onSuccess],
  );

  const handleError = useMemo(
    () => (authError: AuthUiError, action: AuthAction) => {
      adapter.onError?.(authError, action);
      onError?.(authError, action);
    },
    [adapter, onError],
  );

  const runAction = useMemo(
    () =>
      async (
        action: AuthAction,
        runner: (() => Promise<AuthResult>) | undefined,
      ): Promise<AuthResult> => {
        if (!runner) {
          const authError = normalizeProviderError(
            adapter,
            fallbackUnavailableError(action),
            action,
          );
          handleError(authError, action);
          return { success: false, error: authError };
        }

        try {
          const result = await runner();

          if (result.success) {
            handleSuccess(action);
            return result;
          }

          const authError =
            result.error ??
            normalizeProviderError(adapter, fallbackUnavailableError(action), action);
          handleError(authError, action);
          return result;
        } catch (error) {
          const authError = normalizeProviderError(adapter, error, action);
          handleError(authError, action);
          return { success: false, error: authError };
        }
      },
    [adapter, handleError, handleSuccess],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user: data?.user ?? null,
      session: data?.session ?? null,
      isPending,
      error,
      signIn: (input) => runAction("signIn", () => adapter.signIn(input)),
      signUp: adapter.signUp
        ? (input) => runAction("signUp", () => adapter.signUp!(input))
        : undefined,
      signInWithOAuth: adapter.signInWithOAuth
        ? (provider) => runAction("oauth", () => adapter.signInWithOAuth!(provider))
        : undefined,
      signOut: () => runAction("signOut", adapter.signOut ? () => adapter.signOut!() : undefined),
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      isDrawerOpen,
    }),
    [adapter, data, error, isDrawerOpen, isPending, runAction],
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
