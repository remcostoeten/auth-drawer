import {
  createContext,
  createEffect,
  on,
  onCleanup,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import {
  createAuthClient,
  type AuthAction,
  type AuthClient,
  type AuthResult,
  type AuthSessionState,
  type AuthUiError,
  type CredentialAuthInput,
} from "@remcostoeten/auth-drawer/core";
import { createControllerState } from "../lib/create-controller-state";
import type { AuthAdapter } from "../types";

export type AuthContextValue = {
  user: Accessor<AuthSessionState["user"]>;
  session: Accessor<AuthSessionState["session"]>;
  isPending: Accessor<boolean>;
  error: Accessor<unknown>;
  isDrawerOpen: Accessor<boolean>;
  signIn: (input: CredentialAuthInput) => Promise<AuthResult>;
  signUp: AuthClient["signUp"] | undefined;
  signInWithOAuth: AuthClient["signInWithOAuth"] | undefined;
  signInWithMagicLink: AuthClient["signInWithMagicLink"] | undefined;
  signInWithPasskey: AuthClient["signInWithPasskey"] | undefined;
  signOut: AuthClient["signOut"];
  openDrawer: () => void;
  closeDrawer: () => void;
};

export type AuthProviderProps = {
  adapter: AuthAdapter;
  children: JSX.Element;
  onSuccess?: (action: AuthAction) => void;
  onError?: (error: AuthUiError, action: AuthAction) => void;
};

const AuthContext = createContext<AuthContextValue>();

/**
 * @name AuthProvider
 * @description Provides session state and drawer controls to the tree below it. State is exposed
 * as accessors, and action methods exist only when the adapter implements them.
 *
 * @example
 * <AuthProvider adapter={adapter}>
 *   <App />
 * </AuthProvider>
 */
export function AuthProvider(props: AuthProviderProps) {
  const client = createAuthClient({
    adapter: props.adapter,
    onSuccess: (action) => props.onSuccess?.(action),
    onError: (error, action) => props.onError?.(error, action),
  });
  const state = createControllerState(client);

  createEffect(
    on(
      () => props.adapter,
      (adapter) => client.updateInputs({ adapter }),
      { defer: true },
    ),
  );

  onCleanup(() => client.destroy());

  const value: AuthContextValue = {
    user: () => state().user,
    session: () => state().session,
    isPending: () => state().isPending,
    error: () => state().error,
    isDrawerOpen: () => state().isDrawerOpen,
    signIn: client.signIn,
    get signUp() {
      return props.adapter.signUp ? client.signUp : undefined;
    },
    get signInWithOAuth() {
      return props.adapter.signInWithOAuth ? client.signInWithOAuth : undefined;
    },
    get signInWithMagicLink() {
      return props.adapter.features?.magicLink ? client.signInWithMagicLink : undefined;
    },
    get signInWithPasskey() {
      return props.adapter.features?.passkey ? client.signInWithPasskey : undefined;
    },
    signOut: client.signOut,
    openDrawer: client.openDrawer,
    closeDrawer: client.closeDrawer,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

/**
 * @name useAuth
 * @description Reads the nearest `AuthProvider`. Throws when there is none.
 *
 * @example
 * const auth = useAuth();
 * return <button onClick={auth.openDrawer}>{auth.user()?.email ?? "Sign in"}</button>;
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

/**
 * @name useOptionalAuth
 * @description Reads the nearest `AuthProvider`, or `undefined` when there is none.
 *
 * @example
 * const auth = useOptionalAuth();
 * const email = () => auth?.user()?.email;
 */
export function useOptionalAuth(): AuthContextValue | undefined {
  return useContext(AuthContext);
}
