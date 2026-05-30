import { useEffect, useState } from "react";
import type { AuthAdapter, AuthSessionState } from "../types";
import { createAdapterError } from "../errors";

export interface MockAdapterOptions {
  latencyMs?: number;
  mockEmail?: string;
  mockPassword?: string;
  requireName?: boolean;
}

let mockAuthenticated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function mockSession(): AuthSessionState | null {
  if (!mockAuthenticated) return null;
  return {
    user: { id: "mock-user-123", email: "admin@example.com", name: "Mock User" },
    session: { id: "mock-session-456" },
  };
}

export function createMockAdapter(options: MockAdapterOptions = {}): AuthAdapter {
  const { latencyMs = 800, mockEmail = "admin@example.com", mockPassword = "password" } = options;
  const wait = () => new Promise((resolve) => window.setTimeout(resolve, latencyMs));

  return {
    id: "mock",
    providers: ["github", "google", "discord"],
    demoCredentials: {
      email: mockEmail,
      password: mockPassword,
    },
    requiresName: options.requireName,
    async signIn({ email, password }) {
      await wait();
      if (email === "spam@example.com") {
        return { success: false, error: createAdapterError("rate_limited", "form") };
      }
      if (email !== mockEmail || password !== mockPassword) {
        return { success: false, error: createAdapterError("invalid_credentials", "form") };
      }
      mockAuthenticated = true;
      notify();
      return { success: true, data: mockSession() };
    },
    async signUp({ email }) {
      await wait();
      if (email === mockEmail) {
        return { success: false, error: createAdapterError("email_taken", "email") };
      }
      mockAuthenticated = true;
      notify();
      return { success: true, data: mockSession() };
    },
    async signOut() {
      await wait();
      mockAuthenticated = false;
      notify();
      return { success: true };
    },
    async requestPasswordReset(email) {
      await wait();
      if (!email) return { success: false, error: createAdapterError("required", "email") };
      return { success: true };
    },
    async resetPassword() {
      await wait();
      return { success: true };
    },
    async signInWithOAuth() {
      await wait();
      mockAuthenticated = true;
      notify();
      return { success: true, data: mockSession() };
    },
    useSession() {
      const [data, setData] = useState<AuthSessionState | null>(mockSession());

      useEffect(() => {
        function listener() {
          setData(mockSession());
        }

        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      }, []);

      return { data, isPending: false, error: null };
    },
  };
}
