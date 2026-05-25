import { useEffect, useState } from "react";
import type { AuthAdapter, AuthResult, AuthSessionState, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

type SupabaseClientLike = {
  auth: {
    signInWithPassword: (input: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
    signUp: (input: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
    signOut: () => Promise<{ error?: unknown }>;
    resetPasswordForEmail: (email: string, options?: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
    updateUser: (input: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
    signInWithOAuth: (input: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
    signInWithOtp?: (input: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
    getSession: () => Promise<{ data: { session: any | null }; error?: unknown }>;
    onAuthStateChange: (
      callback: (event: string, session: any | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
  };
};

export interface SupabaseAdapterOptions {
  supabase: SupabaseClientLike;
  redirectTo?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
  passwordResetRedirectTo?: string;
}

function mapSupabaseError(error: unknown) {
  const record = error && typeof error === "object" ? (error as { code?: string; status?: number; message?: string }) : {};
  const code = String(record.code ?? record.message ?? "").toLowerCase();
  if (code.includes("invalid_credentials")) return createAdapterError("invalid_credentials", "form", error);
  if (code.includes("email_exists") || code.includes("already")) return createAdapterError("email_taken", "email", error);
  if (code.includes("validation_failed") && code.includes("password")) return createAdapterError("weak_password", "password", error);
  if (code.includes("validation_failed") || code.includes("invalid email")) return createAdapterError("invalid_email", "email", error);
  if (code.includes("email_not_confirmed")) return createAdapterError("email_not_verified", "form", error);
  if (code.includes("user_not_found")) return createAdapterError("user_not_found", "email", error);
  if (record.status === 429) return createAdapterError("rate_limited", "form", error);
  if (record.status && record.status >= 500) return createAdapterError("server_error", "form", error);
  return createAdapterError("unknown", "form", error);
}

function mapSession(session: any): AuthSessionState {
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.user_metadata?.name,
      image: session.user.user_metadata?.avatar_url,
    },
    session,
  };
}

function result(data: unknown, error: unknown): AuthResult {
  if (error) return { success: false, error: mapSupabaseError(error) };
  return { success: true, data };
}

export function createSupabaseAdapter(options: SupabaseAdapterOptions): AuthAdapter {
  const { supabase, redirectTo = typeof window !== "undefined" ? window.location.origin : "", passwordResetRedirectTo } = options;

  return {
    id: "supabase",
    providers: options.providers ?? ["github", "google"],
    requiresName: options.requireName,
    async signIn(input) {
      const response = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
      return result(response.data, response.error);
    },
    async signUp(input) {
      const response = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { name: input.name }, emailRedirectTo: redirectTo },
      });
      return result(response.data, response.error);
    },
    async signOut() {
      const response = await supabase.auth.signOut();
      return result(null, response.error);
    },
    async requestPasswordReset(email) {
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: passwordResetRedirectTo ?? `${window.location.origin}/reset-password`,
      });
      return result(response.data, response.error);
    },
    async resetPassword({ newPassword }) {
      const response = await supabase.auth.updateUser({ password: newPassword });
      return result(response.data, response.error);
    },
    async signInWithOAuth(provider) {
      const response = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
      return result(response.data, response.error);
    },
    useSession() {
      const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
      const [isPending, setIsPending] = useState(true);
      const [error, setError] = useState<unknown>(null);

      useEffect(() => {
        supabase.auth.getSession().then(({ data, error: sessionError }) => {
          if (sessionError) setError(sessionError);
          setSessionState(data.session ? mapSession(data.session) : null);
          setIsPending(false);
        });

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSessionState(session ? mapSession(session) : null);
          setIsPending(false);
        });

        return () => data.subscription.unsubscribe();
      }, []);

      return { data: sessionState, isPending, error };
    },
    features: supabase.auth.signInWithOtp
      ? {
          magicLink: {
            signIn: async (email) => {
              const response = await supabase.auth.signInWithOtp?.({
                email,
                options: { emailRedirectTo: redirectTo },
              });
              return result(response?.data, response?.error);
            },
          },
        }
      : undefined,
    normalizeError: mapSupabaseError,
  };
}
