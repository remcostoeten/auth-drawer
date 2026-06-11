import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTH_SUCCESS_CONFIG,
  getAuthSuccessCloseDelay,
  resolveAuthSuccessConfig,
  resolveAuthSuccessMessage,
} from "./auth-success";

describe("resolveAuthSuccessConfig", () => {
  it("resolves the default commit timing and copy", () => {
    const resolved = resolveAuthSuccessConfig();

    expect(resolved).toEqual(DEFAULT_AUTH_SUCCESS_CONFIG);
  });

  it("keeps maxVisibleMs at or above minVisibleMs", () => {
    const resolved = resolveAuthSuccessConfig({
      minVisibleMs: 1200,
      maxVisibleMs: 300,
      messages: { signIn: "Welcome back" },
    });

    expect(resolved.minVisibleMs).toBe(1200);
    expect(resolved.maxVisibleMs).toBe(1200);
    expect(resolved.messages.signIn).toBe("Welcome back");
    expect(resolved.messages.oauth).toBe("Signed in with provider");
  });
});

describe("getAuthSuccessCloseDelay", () => {
  it("waits for the minimum visible duration while session loads", () => {
    const delay = getAuthSuccessCloseDelay({
      success: { action: "signIn", startedAt: 1000 },
      config: resolveAuthSuccessConfig(),
      now: 1300,
      isAuthenticated: false,
      isSessionPending: true,
    });

    expect(delay).toBe(3200);
  });

  it("closes after the minimum visible duration once the session is ready", () => {
    const delay = getAuthSuccessCloseDelay({
      success: { action: "oauth", startedAt: 1000 },
      config: resolveAuthSuccessConfig(),
      now: 1400,
      isAuthenticated: true,
      isSessionPending: false,
    });

    expect(delay).toBe(250);
  });

  it("returns zero after the maximum visible duration", () => {
    const delay = getAuthSuccessCloseDelay({
      success: { action: "signUp", startedAt: 1000 },
      config: resolveAuthSuccessConfig(),
      now: 5100,
      isAuthenticated: false,
      isSessionPending: true,
    });

    expect(delay).toBe(0);
  });
});

describe("resolveAuthSuccessMessage", () => {
  it("returns the action-specific message", () => {
    const resolved = resolveAuthSuccessConfig({
      messages: {
        oauth: "Provider connected",
      },
    });

    expect(resolveAuthSuccessMessage("oauth", resolved.messages)).toBe("Provider connected");
  });
});
