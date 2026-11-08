import { useSyncExternalStore } from "react";
import { createSessionStore, type SessionFetch } from "@remcostoeten/auth-drawer/core";

export type { SessionFetch };

/**
 * Session helper for adapters that own their session state (REST backends with
 * no reactive SDK). It pairs a `useSession` hook with a `notifySession` trigger:
 *
 *   - `useSession` fetches on first use, then re-fetches whenever
 *     `notifySession` fires or the tab regains focus.
 *   - adapters call `notifySession()` after signIn / signUp / signOut so the UI
 *     reflects the new session immediately, without a page reload.
 *
 * It is a React binding over the core `createSessionStore`.
 */
export function createRevalidatingSession(fetchSession: SessionFetch) {
  const { source, refresh } = createSessionStore(fetchSession);

  function useSession() {
    return useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  }

  return { notifySession: refresh, useSession };
}
