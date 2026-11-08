import { LAST_USED_KEY } from "./constants";
import { OAUTH_PROVIDER_IDS, type OAuthProvider } from "./oauth-providers";

/**
 * A way of signing in that the drawer can remember: an OAuth provider id, the
 * password form, a magic link, or a passkey.
 */
export type LastUsedMethod = OAuthProvider | "email" | "magicLink" | "passkey";

const KNOWN_METHODS: ReadonlySet<string> = new Set([
  "email",
  "magicLink",
  "passkey",
  ...OAUTH_PROVIDER_IDS,
]);

const listeners = new Set<() => void>();

function isLastUsedMethod(value: string): value is LastUsedMethod {
  return KNOWN_METHODS.has(value);
}

function notify() {
  for (const listener of listeners) listener();
}

/**
 * @name readLastUsedMethod
 * @description Reads the sign-in method last used on this device, or `null` when none was
 * recorded. Synchronous, so the chip can render in the first frame.
 *
 * @example
 * const method = readLastUsedMethod();
 */
export function readLastUsedMethod(): LastUsedMethod | null {
  try {
    const raw = localStorage.getItem(LAST_USED_KEY);
    return raw !== null && isLastUsedMethod(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * @name recordLastUsedMethod
 * @description Remembers `method` as the last sign-in method on this device.
 *
 * @example
 * recordLastUsedMethod("github");
 */
export function recordLastUsedMethod(method: LastUsedMethod) {
  try {
    localStorage.setItem(LAST_USED_KEY, method);
  } catch {
    return;
  }
  notify();
}

/**
 * @name clearLastUsedMethod
 * @description Forgets the last-used sign-in method on this device.
 *
 * @example
 * clearLastUsedMethod();
 */
export function clearLastUsedMethod() {
  try {
    localStorage.removeItem(LAST_USED_KEY);
  } catch {
    return;
  }
  notify();
}

/**
 * @name subscribeLastUsed
 * @description Calls `listener` whenever the last-used method changes in this tab or,
 * through the `storage` event, in another tab. Returns an unsubscribe function.
 *
 * @example
 * const stop = subscribeLastUsed(() => render(readLastUsedMethod()));
 */
export function subscribeLastUsed(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", listener);
  };
}
