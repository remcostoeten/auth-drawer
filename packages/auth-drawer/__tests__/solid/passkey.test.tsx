import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  AuthDrawer,
  AuthProvider,
  readLastUsedMethod,
  recordLastUsedMethod,
  type AuthAction,
  type AuthAdapter,
  type AuthConfig,
} from "../../src/solid";
import { badges, click, createTestAdapter, flush } from "./helpers";

function passkeyAdapter(overrides: Partial<AuthAdapter> = {}) {
  return createTestAdapter({
    features: { passkey: { signIn: vi.fn(async () => ({ success: true })) } },
    ...overrides,
  });
}

function passkeyButton() {
  return document.body.querySelector<HTMLButtonElement>("[data-auth-passkey] button");
}

function renderDrawer(adapter: AuthAdapter, config?: AuthConfig, onSuccess?: (action: AuthAction) => void) {
  return render(() => (
    <AuthProvider adapter={adapter} onSuccess={onSuccess}>
      <AuthDrawer adapter={adapter} hideTrigger open config={config} />
    </AuthProvider>
  ));
}

describe("passkey sign in", () => {
  it("renders the button, and a separator, only when the adapter implements features.passkey", () => {
    const without = renderDrawer(createTestAdapter());
    expect(passkeyButton()).toBeNull();
    expect(document.body.querySelector('[role="separator"]')).toBeNull();
    without.unmount();

    renderDrawer(passkeyAdapter());
    expect(passkeyButton()?.textContent).toContain("Continue with a passkey");
    expect(document.body.querySelector('[role="separator"]')).toBeTruthy();
  });

  it("can be switched off with ui.auth.passkey.enabled", () => {
    renderDrawer(passkeyAdapter(), { ui: { auth: { passkey: { enabled: false } } } });
    expect(passkeyButton()).toBeNull();
  });

  it("signs in, reports the passkey action, remembers the method and shows success", async () => {
    const signIn = vi.fn(async () => ({ success: true }));
    const onSuccess = vi.fn();
    renderDrawer(passkeyAdapter({ features: { passkey: { signIn } } }), undefined, onSuccess);

    click(passkeyButton());
    await flush();

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("passkey");
    expect(readLastUsedMethod()).toBe("passkey");
    expect(passkeyButton()?.getAttribute("data-feedback-status")).toBe("success");
    expect(passkeyButton()?.textContent).toContain("Signed in with passkey");
  });

  it("shows the adapter's error on the form when the prompt fails", async () => {
    const signIn = vi.fn(async () => ({
      success: false,
      error: { code: "oauth_cancelled" as const, target: "form" as const, message: "Prompt closed." },
    }));
    renderDrawer(passkeyAdapter({ features: { passkey: { signIn } } }));

    click(passkeyButton());
    await flush();

    expect(document.body.textContent).toContain("Prompt closed.");
    expect(readLastUsedMethod()).toBeNull();
  });

  it("marks the passkey button as last used", () => {
    recordLastUsedMethod("passkey");
    renderDrawer(passkeyAdapter());

    expect(badges()).toEqual(["Continue with a passkey"]);
  });
});
