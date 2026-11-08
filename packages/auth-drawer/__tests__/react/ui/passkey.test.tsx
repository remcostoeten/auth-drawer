import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readLastUsedMethod } from "../../../src/react/last-used";
import type { AuthAction, AuthAdapter, AuthConfig } from "../../../src/react/types";
import { AuthDrawer } from "../../../src/react/ui/auth-drawer";
import { AuthProvider } from "../../../src/react/ui/auth-provider";

function createAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    id: "test",
    providers: [],
    signIn: vi.fn(async () => ({ success: true })),
    useSession: () => ({ data: null, isPending: false, error: null }),
    features: { passkey: { signIn: vi.fn(async () => ({ success: true })) } },
    ...overrides,
  };
}

function passkeyButton() {
  return document.body.querySelector("[data-auth-passkey] button");
}

describe("passkey sign-in", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  function render(
    adapter: AuthAdapter,
    config?: AuthConfig,
    onSuccess?: (action: AuthAction) => void,
  ) {
    act(() => {
      root.render(
        <AuthProvider adapter={adapter} onSuccess={onSuccess}>
          <AuthDrawer adapter={adapter} hideTrigger open config={config} />
        </AuthProvider>,
      );
    });
  }

  it("renders the button only when the adapter implements features.passkey", () => {
    render(createAdapter({ features: undefined }));
    expect(passkeyButton()).toBeNull();

    render(createAdapter());
    expect(passkeyButton()?.textContent).toContain("Continue with a passkey");
    expect(document.body.querySelector('[role="separator"]')).toBeTruthy();
  });

  it("can be switched off with ui.auth.passkey.enabled", () => {
    render(createAdapter(), { ui: { auth: { passkey: { enabled: false } } } });
    expect(passkeyButton()).toBeNull();
  });

  it("signs in, reports the passkey action, and remembers the method", async () => {
    const signIn = vi.fn(async () => ({ success: true }));
    const onSuccess = vi.fn();
    render(createAdapter({ features: { passkey: { signIn } } }), undefined, onSuccess);

    await act(async () => {
      passkeyButton()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("passkey");
    expect(readLastUsedMethod()).toBe("passkey");
    expect(passkeyButton()?.getAttribute("data-feedback-status")).toBe("success");
  });

  it("shows the adapter's error on the form when the prompt fails", async () => {
    const signIn = vi.fn(async () => ({
      success: false,
      error: {
        code: "oauth_cancelled" as const,
        target: "form" as const,
        message: "Prompt closed.",
      },
    }));
    render(createAdapter({ features: { passkey: { signIn } } }));

    await act(async () => {
      passkeyButton()?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("Prompt closed.");
    expect(readLastUsedMethod()).toBeNull();
  });
});
