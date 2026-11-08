import { vi } from "vitest";
import {
  createAuthError,
  createPushSession,
  resolveAuthConfig,
  type AuthAdapter,
  type AuthConfig,
  type AuthResult,
  type SessionSnapshot,
} from "../../src/core";

export const CREDENTIALS = {
  email: "ada@example.com",
  password: "password123",
  rememberMe: false,
};

export const SIGNED_IN: SessionSnapshot = {
  data: { user: { id: "1", email: "ada@example.com" }, session: { id: "s1" } },
  isPending: false,
  error: null,
};

export const SIGNED_OUT: SessionSnapshot = { data: null, isPending: false, error: null };

export function ok(data?: unknown): AuthResult {
  return { success: true, data };
}

export function fail(
  code: Parameters<typeof createAuthError>[0],
  target: Parameters<typeof createAuthError>[1],
) {
  return {
    success: false,
    error: createAuthError(code, target, { message: `${code} message` }),
  } as const;
}

export function makeAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  const { source } = createPushSession(SIGNED_OUT);

  return {
    id: "test",
    providers: ["github", "google"],
    session: source,
    signIn: vi.fn(async () => ok()),
    signUp: vi.fn(async () => ok()),
    signOut: vi.fn(async () => ok()),
    signInWithOAuth: vi.fn(async () => ok()),
    requestPasswordReset: vi.fn(async () => ok()),
    resetPassword: vi.fn(async () => ok()),
    ...overrides,
  };
}

export function resolveFor(adapter: AuthAdapter, config?: AuthConfig) {
  return resolveAuthConfig(config, adapter);
}

export function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function idle() {
  return () => undefined;
}
