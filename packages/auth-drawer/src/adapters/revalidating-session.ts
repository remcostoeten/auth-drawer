import { useEffect, useState } from "react";
import type { AuthSessionState } from "../types";

export type SessionFetch = () => Promise<{
  data: AuthSessionState | null;
  error: unknown;
}>;

/**
 * Session helper for adapters that own their session state (REST backends with
 * no reactive SDK, e.g. custom-jwt and passport). It pairs a `useSession` hook
 * with a `notifySession` trigger:
 *
 *   - `useSession` fetches once on mount, then re-fetches whenever
 *     `notifySession` fires or the tab regains focus.
 *   - adapters call `notifySession()` after signIn / signUp / signOut so the UI
 *     reflects the new session immediately, without a page reload.
 *
 * This mirrors how the SDK-backed adapters stay live (Better Auth's reactive
 * `useSession`, Supabase/Firebase auth-state subscriptions) and the focus
 * revalidation used by SWR / TanStack Query.
 */
export function createRevalidatingSession(fetchSession: SessionFetch) {
  const listeners = new Set<() => void>();

  function notifySession(): void {
    listeners.forEach((listener) => listener());
  }

  function useSession() {
    const [data, setData] = useState<AuthSessionState | null>(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
      let active = true;

      function load() {
        fetchSession().then((result) => {
          if (!active) return;
          setData(result.data);
          setError(result.error);
          setIsPending(false);
        });
      }

      load();
      listeners.add(load);

      // Revalidate when the user returns to the tab (also catches cross-tab
      // sign-in/out once the cookie/token has changed).
      const onFocus = () => load();
      if (typeof window !== "undefined") {
        window.addEventListener("focus", onFocus);
      }

      return () => {
        active = false;
        listeners.delete(load);
        if (typeof window !== "undefined") {
          window.removeEventListener("focus", onFocus);
        }
      };
    }, []);

    return { data, isPending, error };
  }

  return { notifySession, useSession };
}
