import { useEffect, useState } from "react";
import type { AuthAdapter, AuthResult, AuthSessionState, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

type FirebaseAuthLike = {
  currentUser?: any;
  onAuthStateChanged?: (callback: (user: any | null) => void, error?: (error: unknown) => void) => () => void;
};

export interface FirebaseAdapterOptions {
  auth: FirebaseAuthLike;
  createUserWithEmailAndPassword: (auth: FirebaseAuthLike, email: string, password: string) => Promise<any>;
  signInWithEmailAndPassword: (auth: FirebaseAuthLike, email: string, password: string) => Promise<any>;
  signOut: (auth: FirebaseAuthLike) => Promise<void>;
  sendPasswordResetEmail?: (auth: FirebaseAuthLike, email: string) => Promise<void>;
  updatePassword?: (user: any, newPassword: string) => Promise<void>;
  signInWithRedirect?: (auth: FirebaseAuthLike, provider: unknown) => Promise<void>;
  providerFactory?: (provider: string) => unknown;
  providers?: OAuthProvider[];
  requireName?: boolean;
}

function mapFirebaseError(error: unknown) {
  const code = String((error as { code?: string; message?: string })?.code ?? "").toLowerCase();
  if (code.includes("invalid-email")) return createAdapterError("invalid_email", "email", error);
  if (code.includes("email-already-in-use")) return createAdapterError("email_taken", "email", error);
  if (code.includes("weak-password")) return createAdapterError("weak_password", "password", error);
  if (code.includes("user-not-found")) return createAdapterError("user_not_found", "email", error);
  if (code.includes("wrong-password") || code.includes("invalid-credential")) {
    return createAdapterError("invalid_credentials", "form", error);
  }
  if (code.includes("too-many-requests")) return createAdapterError("rate_limited", "form", error);
  if (code.includes("network")) return createAdapterError("network_error", "form", error);
  return createAdapterError("unknown", "form", error);
}

function mapUser(user: any): AuthSessionState {
  return {
    user: {
      id: user.uid,
      email: user.email ?? "",
      name: user.displayName,
      image: user.photoURL,
    },
    session: user,
  };
}

export function createFirebaseAdapter(options: FirebaseAdapterOptions): AuthAdapter {
  const { auth } = options;

  return {
    id: "firebase",
    providers: options.providers ?? ["github", "google"],
    requiresName: options.requireName,
    async signIn(input) {
      try {
        const data = await options.signInWithEmailAndPassword(auth, input.email, input.password);
        return { success: true, data };
      } catch (error) {
        return { success: false, error: mapFirebaseError(error) };
      }
    },
    async signUp(input) {
      try {
        const data = await options.createUserWithEmailAndPassword(auth, input.email, input.password);
        return { success: true, data };
      } catch (error) {
        return { success: false, error: mapFirebaseError(error) };
      }
    },
    async signOut() {
      await options.signOut(auth);
      return { success: true };
    },
    requestPasswordReset: options.sendPasswordResetEmail
      ? async (email) => {
          try {
            await options.sendPasswordResetEmail?.(auth, email);
            return { success: true };
          } catch (error) {
            return { success: false, error: mapFirebaseError(error) };
          }
        }
      : undefined,
    resetPassword: options.updatePassword
      ? async ({ newPassword }): Promise<AuthResult> => {
          try {
            if (!auth.currentUser) {
              return { success: false, error: createAdapterError("user_not_found", "form") };
            }
            await options.updatePassword?.(auth.currentUser, newPassword);
            return { success: true };
          } catch (error) {
            return { success: false, error: mapFirebaseError(error) };
          }
        }
      : undefined,
    signInWithOAuth: options.signInWithRedirect && options.providerFactory
      ? async (provider) => {
          try {
            await options.signInWithRedirect?.(auth, options.providerFactory?.(provider));
            return new Promise(() => undefined);
          } catch (error) {
            return { success: false, error: mapFirebaseError(error) };
          }
        }
      : undefined,
    useSession: auth.onAuthStateChanged
      ? () => {
          const [sessionState, setSessionState] = useState<AuthSessionState | null>(
            auth.currentUser ? mapUser(auth.currentUser) : null,
          );
          const [isPending, setIsPending] = useState(true);
          const [error, setError] = useState<unknown>(null);

          useEffect(() => {
            const unsubscribe = auth.onAuthStateChanged?.(
              (user) => {
                setSessionState(user ? mapUser(user) : null);
                setIsPending(false);
              },
              (authError) => {
                setError(authError);
                setIsPending(false);
              },
            );
            return () => unsubscribe?.();
          }, []);

          return { data: sessionState, isPending, error };
        }
      : undefined,
    normalizeError: mapFirebaseError,
  };
}
