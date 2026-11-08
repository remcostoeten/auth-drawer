import {
  createBetterAuthAdapter as createCoreBetterAuthAdapter,
  mapBetterAuthSession,
  type BetterAuthAdapterOptions,
  type BetterAuthFeature,
} from "@remcostoeten/auth-drawer/core/adapters/better-auth";
import type { AuthAdapter } from "../types";

export type { BetterAuthAdapterOptions, BetterAuthFeature };

export function createBetterAuthAdapter(options: BetterAuthAdapterOptions): AuthAdapter {
  const { client } = options;

  return {
    ...createCoreBetterAuthAdapter(options),
    useSession: () => {
      const session = client.useSession?.();
      return {
        data: mapBetterAuthSession(session?.data),
        isPending: Boolean(session?.isPending),
        error: session?.error ?? null,
      };
    },
  };
}
