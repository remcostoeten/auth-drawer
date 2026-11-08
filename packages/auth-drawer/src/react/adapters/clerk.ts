import {
  createClerkAdapter as createCoreClerkAdapter,
  mapClerkUser,
  type ClerkAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/clerk";
import type { AuthAdapter } from "../types";

export type { ClerkAdapterOptions };

type ClerkUserHook = {
  useUser?: () => { user?: any; isLoaded?: boolean };
};

export function createClerkAdapter(options: ClerkAdapterOptions): AuthAdapter {
  const clerk = options.client as ClerkUserHook;

  return {
    ...createCoreClerkAdapter(options),
    useSession: () => {
      const { user, isLoaded } = clerk.useUser?.() ?? {};
      return {
        data: mapClerkUser(user),
        isPending: clerk.useUser ? !isLoaded : false,
        error: null,
      };
    },
  };
}
