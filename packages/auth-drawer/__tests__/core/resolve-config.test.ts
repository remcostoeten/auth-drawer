import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CONFIG,
  SETTINGS_KEY,
  resolveAuthConfig,
  resolveAuthGroup,
  resolveBackdropGroup,
  resolveMotionSettings,
  resolvePresentationGroup,
} from "../../src/core";
import { makeAdapter, ok } from "./helpers";

describe("resolveAuthGroup", () => {
  it("uses the config list when the adapter does not declare providers", () => {
    const adapter = makeAdapter({ providers: undefined });

    expect(resolveAuthGroup({ ui: { auth: { providers: ["apple"] } } }, adapter).providers).toEqual(
      ["apple"],
    );
  });

  it("uses the adapter list when the config has none", () => {
    const adapter = makeAdapter({ providers: ["discord"] });

    expect(resolveAuthGroup(undefined, adapter).providers).toEqual(["discord"]);
  });

  it("intersects the explicit list with the adapter's declared providers", () => {
    const adapter = makeAdapter({ providers: ["github", "google"] });
    const group = resolveAuthGroup(
      { ui: { auth: { providers: ["google", "apple", "github"] } } },
      adapter,
    );

    expect(group.providers).toEqual(["google", "github"]);
  });

  it("falls back to the defaults when neither side declares providers", () => {
    const adapter = makeAdapter({ providers: undefined });

    expect(resolveAuthGroup(undefined, adapter).providers).toEqual(
      DEFAULT_CONFIG.ui.auth.providers,
    );
  });

  it("ignores a non-array providers value from the adapter", () => {
    const adapter = makeAdapter({ providers: new Proxy({}, {}) as never });

    expect(resolveAuthGroup({ ui: { auth: { providers: ["apple"] } } }, adapter).providers).toEqual(
      ["apple"],
    );
    expect(resolveAuthGroup(undefined, adapter).providers).toEqual(
      DEFAULT_CONFIG.ui.auth.providers,
    );
  });

  it("shows no providers when the adapter cannot do OAuth", () => {
    const adapter = makeAdapter({ signInWithOAuth: undefined });

    expect(
      resolveAuthGroup({ ui: { auth: { providers: ["github"] } } }, adapter).providers,
    ).toEqual([]);
  });

  it("derives capability flags from the adapter", () => {
    const adapter = makeAdapter({ signUp: undefined, requestPasswordReset: undefined });
    const group = resolveAuthGroup(undefined, adapter);

    expect(group.allowRegister).toBe(false);
    expect(group.showForgotPassword).toBe(false);
    expect(group.magicLink.enabled).toBe(false);
    expect(group.passkey.enabled).toBe(false);
  });

  it("enables magic link and passkey only when implemented and not switched off", () => {
    const features = {
      magicLink: { signIn: vi.fn(async () => ok()) },
      passkey: { signIn: vi.fn(async () => ok()) },
    };
    const adapter = makeAdapter({ features });

    expect(resolveAuthGroup(undefined, adapter).magicLink.enabled).toBe(true);
    expect(resolveAuthGroup(undefined, adapter).passkey.enabled).toBe(true);
    expect(
      resolveAuthGroup(
        { ui: { auth: { magicLink: { enabled: false }, passkey: { enabled: false } } } },
        adapter,
      ),
    ).toMatchObject({ magicLink: { enabled: false }, passkey: { enabled: false } });
  });

  it("starts in magic link mode when it is the only way to sign in", () => {
    const adapter = makeAdapter({
      signIn: undefined,
      features: { magicLink: { signIn: vi.fn(async () => ok()) } },
    });

    expect(resolveAuthGroup(undefined, adapter).initialMode).toBe("magicLink");
  });

  it("drops a requested magic link mode when the feature is missing", () => {
    expect(
      resolveAuthGroup({ ui: { auth: { initialMode: "magicLink" } } }, makeAdapter()).initialMode,
    ).toBe("login");
  });

  it("clamps the overflow visible count", () => {
    const group = resolveAuthGroup(
      { ui: { auth: { oauthOverflow: { visibleCount: 0 } } } },
      makeAdapter(),
    );

    expect(group.oauthOverflow.visibleCount).toBe(1);
  });
});

describe("resolveBackdropGroup", () => {
  it("prefers visual.backdrop over legacy motion fields over defaults", () => {
    const backdrop = resolveBackdropGroup({
      ui: {
        visual: { backdrop: { blur: 12, gradient: { angle: 90 } } },
        motion: { backdropBlur: 3, backdropOpacity: 0.5, backdropAngle: 45 },
      },
    });

    expect(backdrop.blur).toBe(12);
    expect(backdrop.gradient.angle).toBe(90);
    expect(backdrop.opacity).toBe(0.5);
    expect(backdrop.color).toBe(DEFAULT_CONFIG.ui.visual.backdrop.color);
  });
});

describe("resolveMotionSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("merges defaults, saved studio settings and overrides in that order", () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ entryDuration: 2, entryScale: 0.5 }));

    const motion = resolveMotionSettings({ entryScale: 0.7 });

    expect(motion.entryDuration).toBe(2);
    expect(motion.entryScale).toBe(0.7);
    expect(motion.snapMass).toBe(DEFAULT_CONFIG.ui.motion.snapMass);
  });

  it("ignores malformed saved settings", () => {
    localStorage.setItem(SETTINGS_KEY, "{nope");

    expect(resolveMotionSettings().entryDuration).toBe(DEFAULT_CONFIG.ui.motion.entryDuration);
  });

  it("applies backdrop and display mode on top", () => {
    const motion = resolveMotionSettings(
      { backdropBlur: 1 },
      { blur: 9, gradient: { from: "red" } },
      "modal",
    );

    expect(motion.backdropBlur).toBe(9);
    expect(motion.backdropStartColor).toBe("red");
    expect(motion.displayMode).toBe("modal");
  });
});

describe("resolvePresentationGroup", () => {
  it("merges over the defaults", () => {
    expect(resolvePresentationGroup({ ui: { presentation: { variant: "modal" } } })).toEqual({
      variant: "modal",
      defaultOpen: false,
      dismissible: true,
    });
  });
});

describe("resolveAuthConfig", () => {
  it("returns the complete resolved shape", () => {
    const resolved = resolveAuthConfig(undefined, makeAdapter());

    expect(Object.keys(resolved.ui).sort()).toEqual(
      ["auth", "copy", "footer", "motion", "presentation", "success", "visual"].sort(),
    );
    expect(resolved.triggers).toEqual({});
    expect(resolved.ui.success.enabled).toBe(true);
  });

  it("merges triggers over the defaults and keeps their identity", () => {
    const pageLoad = { delayMs: 5 };

    expect(resolveAuthConfig({ triggers: { pageLoad } }, makeAdapter()).triggers.pageLoad).toBe(
      pageLoad,
    );
  });

  it("passes the footer node through", () => {
    const footer = { tag: "footer" };

    expect(
      resolveAuthConfig({ ui: { footer, success: { footer } } }, makeAdapter()).ui.footer,
    ).toBe(footer);
    expect(
      resolveAuthConfig({ ui: { success: { footer } } }, makeAdapter()).ui.success.footer,
    ).toBe(footer);
  });

  it("wires the default normalizer to the configured error copy", () => {
    const resolved = resolveAuthConfig(
      { ui: { copy: { errors: { network_error: "Offline right now." } } } },
      makeAdapter(),
    );

    const error = resolved.normalizeError(new TypeError("Failed to fetch"), {
      fallbackTarget: "form",
    });

    expect(error.code).toBe("network_error");
    expect(error.message).toBe("Offline right now.");
  });

  it("keeps a custom normalizer untouched", () => {
    const normalizeError = vi.fn();

    expect(resolveAuthConfig({ normalizeError }, makeAdapter()).normalizeError).toBe(
      normalizeError,
    );
  });
});
