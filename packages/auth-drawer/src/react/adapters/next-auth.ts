import {
  createNextAuthAdapter as createCoreNextAuthAdapter,
  mapNextAuthSession,
  type NextAuthAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/next-auth";
import type { AuthAdapter } from "../types";

export type { NextAuthAdapterOptions };

export function createNextAuthAdapter(options: NextAuthAdapterOptions): AuthAdapter {
  const { client } = options;

  return {
    ...createCoreNextAuthAdapter(options),
    useSession: () => {
      const session = client.useSession?.();
      return {
        data: mapNextAuthSession(session?.data),
        isPending: session?.status === "loading",
        error: null,
      };
    },
  };
}
