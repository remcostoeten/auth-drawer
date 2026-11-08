import { useSyncExternalStore } from "react";
import {
  STATIC_SESSION,
  sessionOf,
  type AuthAdapter as CoreAuthAdapter,
  type SessionSnapshot,
} from "@remcostoeten/auth-drawer/core";
import type { AuthAdapter } from "../types";

/**
 * Adds the React `useSession` hook to a core adapter by reading its `session` source with
 * `useSyncExternalStore`.
 */
export function withReactSession<Adapter extends CoreAuthAdapter>(
  adapter: Adapter,
): Adapter & { useSession: () => SessionSnapshot } {
  const { session } = adapter;

  return {
    ...adapter,
    useSession: () =>
      useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot),
  };
}

/**
 * Reads an adapter's session. An adapter that provides its own `useSession` hook (a framework
 * client's reactive session) wins; otherwise the adapter's `session` source is subscribed.
 */
export function useAdapterSession(adapter: AuthAdapter): SessionSnapshot {
  const source = adapter.useSession ? STATIC_SESSION : sessionOf(adapter);
  const external = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  const fromHook = adapter.useSession?.();

  return fromHook ?? external;
}
