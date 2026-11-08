import type { AuthSuccessAction, AuthSuccessConfig, ResolvedAuthSuccessConfig } from "./types";

export type AuthSuccessState = {
  action: AuthSuccessAction;
  startedAt: number;
};

export type AuthSuccessMessageMap = Record<AuthSuccessAction, string>;

export const DEFAULT_AUTH_SUCCESS_CONFIG: ResolvedAuthSuccessConfig<never> = {
  enabled: true,
  minVisibleMs: 650,
  maxVisibleMs: 3500,
  messages: {
    signIn: "Signed in",
    signUp: "Account created",
    oauth: "Signed in with provider",
    passkey: "Signed in with passkey",
  },
};

/**
 * @name resolveAuthSuccessConfig
 * @description Merges success timing and messages with the defaults and keeps
 * `maxVisibleMs` at or above `minVisibleMs`.
 *
 * @example
 * resolveAuthSuccessConfig({ minVisibleMs: 1000 }).maxVisibleMs; // 3500
 */
export function resolveAuthSuccessConfig<Node = unknown>(
  config?: AuthSuccessConfig<Node>,
): ResolvedAuthSuccessConfig<Node> {
  const minVisibleMs = config?.minVisibleMs ?? DEFAULT_AUTH_SUCCESS_CONFIG.minVisibleMs;
  const maxVisibleMs = Math.max(
    config?.maxVisibleMs ?? DEFAULT_AUTH_SUCCESS_CONFIG.maxVisibleMs,
    minVisibleMs,
  );

  return {
    enabled: config?.enabled ?? DEFAULT_AUTH_SUCCESS_CONFIG.enabled,
    minVisibleMs,
    maxVisibleMs,
    messages: {
      ...DEFAULT_AUTH_SUCCESS_CONFIG.messages,
      ...config?.messages,
    },
    footer: config?.footer,
  };
}

/**
 * @name resolveAuthSuccessMessage
 * @description Looks up the success message for an action.
 *
 * @example
 * resolveAuthSuccessMessage("signIn", DEFAULT_AUTH_SUCCESS_CONFIG.messages); // "Signed in"
 */
export function resolveAuthSuccessMessage(
  action: AuthSuccessAction,
  messages: AuthSuccessMessageMap,
): string {
  return messages[action];
}

/**
 * @name getAuthSuccessFooter
 * @description Returns the custom footer, the action message, or null when success
 * handling is disabled.
 *
 * @example
 * getAuthSuccessFooter(resolved, "signIn");
 */
export function getAuthSuccessFooter<Node>(
  config: ResolvedAuthSuccessConfig<Node>,
  action: AuthSuccessAction,
): Node | string | null {
  if (!config.enabled) return null;
  if (config.footer) return config.footer;

  return resolveAuthSuccessMessage(action, config.messages);
}

/**
 * @name getAuthSuccessCloseDelay
 * @description Computes how many milliseconds the success state should stay visible
 * before the surface closes. Returns null when there is nothing to schedule and 0 when
 * it should close immediately.
 *
 * @example
 * getAuthSuccessCloseDelay({ success, config, now: Date.now(), isAuthenticated: true, isSessionPending: false });
 */
export function getAuthSuccessCloseDelay(params: {
  success: AuthSuccessState | null;
  config: ResolvedAuthSuccessConfig<unknown>;
  now: number;
  isAuthenticated: boolean;
  isSessionPending: boolean;
}): number | null {
  const { success, config, now, isAuthenticated, isSessionPending } = params;

  if (!success || !config.enabled) return null;

  const elapsed = Math.max(0, now - success.startedAt);
  if (elapsed >= config.maxVisibleMs) return 0;

  const minRemaining = Math.max(0, config.minVisibleMs - elapsed);

  if (isAuthenticated && !isSessionPending) {
    return minRemaining;
  }

  return Math.max(minRemaining, config.maxVisibleMs - elapsed);
}
