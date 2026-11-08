import {
  createAdapter as createCoreAdapter,
  type AuthAdapter as CoreAuthAdapter,
  type SessionSource,
} from "@remcostoeten/auth-drawer/core";
import { withReactSession } from "./hooks/use-adapter-session";
import type { AuthAdapter } from "./types";

type CustomAuthAdapter = Omit<CoreAuthAdapter, "session"> &
  Partial<Pick<AuthAdapter, "useSession">> & { session?: SessionSource };

/**
 * Wraps a partial adapter with sensible defaults for missing methods.
 * Adapters written against the old contract can still pass a `useSession` hook.
 */
export function createAdapter(partial: CustomAuthAdapter): AuthAdapter {
  const { useSession, ...rest } = partial;
  const adapter = createCoreAdapter(rest);

  return useSession ? { ...adapter, useSession } : withReactSession(adapter);
}
