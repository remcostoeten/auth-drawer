import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";
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

/**
 * @name useLastUsedMethod
 * @description Accessor for the sign-in method last used on this device, kept in sync with storage
 * and with other tabs. It is `null` on the server and until the component has mounted.
 *
 * @example
 * const lastUsed = useLastUsedMethod();
 * return <Show when={lastUsed() === "github"}>Welcome back</Show>;
 */
export function useLastUsedMethod(): Accessor<LastUsedMethod | null> {
  const [method, setMethod] = createSignal<LastUsedMethod | null>(null);

  onMount(() => {
    setMethod(readLastUsedMethod());
    onCleanup(subscribeLastUsed(() => setMethod(readLastUsedMethod())));
  });

  return method;
}
