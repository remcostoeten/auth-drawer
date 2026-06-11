import type { ReactNode } from "react";
import type {
  AuthSuccessAction,
  AuthSuccessConfig,
  ResolvedAuthSuccessConfig,
} from "../types";

export type AuthSuccessState = {
  action: AuthSuccessAction;
  startedAt: number;
};

export type AuthSuccessMessageMap = Record<AuthSuccessAction, string>;

export const DEFAULT_AUTH_SUCCESS_CONFIG: ResolvedAuthSuccessConfig = {
  enabled: true,
  minVisibleMs: 650,
  maxVisibleMs: 3500,
  messages: {
    signIn: "Signed in",
    signUp: "Account created",
    oauth: "Signed in with provider",
  },
};

export function resolveAuthSuccessConfig(
  config?: AuthSuccessConfig,
): ResolvedAuthSuccessConfig {
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

export function resolveAuthSuccessMessage(
  action: AuthSuccessAction,
  messages: AuthSuccessMessageMap,
): string {
  return messages[action];
}

export function getAuthSuccessFooter(
  config: ResolvedAuthSuccessConfig,
  action: AuthSuccessAction,
): ReactNode | null {
  if (!config.enabled) return null;
  if (config.footer) return config.footer;

  return resolveAuthSuccessMessage(action, config.messages);
}

export function getAuthSuccessCloseDelay(params: {
  success: AuthSuccessState | null;
  config: ResolvedAuthSuccessConfig;
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
