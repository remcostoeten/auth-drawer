import { useSyncExternalStore } from "react";
import {
  readLastUsedMethod,
  subscribeLastUsed,
  type LastUsedMethod,
} from "@remcostoeten/auth-drawer/core";

export {
  clearLastUsedMethod,
  readLastUsedMethod,
  recordLastUsedMethod,
  type LastUsedMethod,
} from "@remcostoeten/auth-drawer/core";

function serverSnapshot(): LastUsedMethod | null {
  return null;
}

/**
 * The sign-in method last used on this device, kept in sync with storage.
 * Returns `null` on the server and until something is recorded.
 */
export function useLastUsedMethod(): LastUsedMethod | null {
  return useSyncExternalStore(subscribeLastUsed, readLastUsedMethod, serverSnapshot);
}
