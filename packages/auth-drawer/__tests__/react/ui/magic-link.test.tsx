import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthError } from "@remcostoeten/auth-drawer/core";
import type { AuthAdapter, AuthConfig } from "../../../src/react/types";
import { AuthDrawer } from "../../../src/react/ui/auth-drawer";
import { AuthProvider } from "../../../src/react/ui/auth-provider";

function createMagicLinkAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    id: "magic",
    useSession: vi.fn(() => ({ data: null, isPending: false, error: null })),
    features: {
      magicLink: { signIn: vi.fn(async () => ({ success: true })) },
    },
    ...overrides,
  };
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function click(element: Element | null | undefined) {
  element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function findButton(label: string) {
  return Array.from(document.body.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(label),
  );
}

describe("magic link flow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    vi.useRealTimers();
    document.body.removeChild(container);
  });

  function render(adapter: AuthAdapter, config?: AuthConfig) {
    act(() => {
      root.render(
        <AuthProvider adapter={adapter}>
          <AuthDrawer adapter={adapter} hideTrigger open config={config} />
        </AuthProvider>,
      );
    });
  }

  it("drops the password field when the adapter has no password sign-in", () => {
    render(createMagicLinkAdapter());

    expect(document.body.querySelector('input[type="email"]')).toBeTruthy();
    expect(document.body.querySelector('input[type="password"]')).toBeNull();
  });

  it("sends the link and shows the sent state without closing the drawer", async () => {
    const signIn = vi.fn(async () => ({ success: true }));
    const adapter = createMagicLinkAdapter({ features: { magicLink: { signIn } } });

    render(adapter);

    const email = document.body.querySelector('input[type="email"]') as HTMLInputElement;

    await act(async () => {
      setInputValue(email, " user@example.com ");
    });

    await act(async () => {
      click(document.body.querySelector('button[type="submit"]'));
    });

    expect(signIn).toHaveBeenCalledWith("user@example.com");
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Check your inbox");
    expect(document.body.textContent).toContain("user@example.com");
  });

  it("keeps resend disabled until the cooldown elapses", async () => {
    vi.useFakeTimers();
    const adapter = createMagicLinkAdapter();

    render(adapter, { ui: { auth: { magicLink: { resendMs: 2000 } } } });

    const email = document.body.querySelector('input[type="email"]') as HTMLInputElement;

    await act(async () => {
      setInputValue(email, "user@example.com");
    });

    await act(async () => {
      click(document.body.querySelector('button[type="submit"]'));
    });

    const resend = findButton("You can send another link in 2s");
    expect(resend).toBeTruthy();
    expect((resend as HTMLButtonElement).disabled).toBe(true);

    for (let tick = 0; tick < 2; tick += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    const ready = findButton("Send the link again") as HTMLButtonElement;
    expect(ready).toBeTruthy();
    expect(ready.disabled).toBe(false);
  });

  it("surfaces adapter errors and stays on the form", async () => {
    const adapter = createMagicLinkAdapter({
      features: {
        magicLink: {
          signIn: vi.fn(async () => ({
            success: false,
            error: createAuthError("rate_limited", "form", { message: "Too many attempts." }),
          })),
        },
      },
    });

    render(adapter);

    const email = document.body.querySelector('input[type="email"]') as HTMLInputElement;

    await act(async () => {
      setInputValue(email, "user@example.com");
    });

    await act(async () => {
      click(document.body.querySelector('button[type="submit"]'));
    });

    expect(document.body.textContent).toContain("Too many attempts.");
    expect(document.body.textContent).not.toContain("Check your inbox");
  });

  it("switches between the password form and the link form when both exist", async () => {
    const adapter = createMagicLinkAdapter({
      signIn: vi.fn(async () => ({ success: true })),
    });

    render(adapter);

    expect(document.body.querySelector('input[type="password"]')).toBeTruthy();

    await act(async () => {
      click(findButton("Email me a sign-in link instead"));
    });

    expect(document.body.querySelector('input[type="password"]')).toBeNull();

    await act(async () => {
      click(findButton("Sign in with a password"));
    });

    expect(document.body.querySelector('input[type="password"]')).toBeTruthy();
  });

  it("drops every dismiss affordance when presentation is not dismissible", () => {
    const adapter = createMagicLinkAdapter();

    act(() => {
      root.render(
        <AuthDrawer
          adapter={adapter}
          hideTrigger
          defaultOpen
          config={{ ui: { presentation: { dismissible: false } } }}
        />,
      );
    });

    expect(document.body.querySelector('[aria-label="Close sign in dialog"]')).toBeNull();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it("ignores the magic-link flow when it is disabled by config", () => {
    const adapter = createMagicLinkAdapter({
      signIn: vi.fn(async () => ({ success: true })),
    });

    act(() => {
      root.render(
        <AuthDrawer
          adapter={adapter}
          hideTrigger
          open
          config={{ ui: { auth: { magicLink: { enabled: false } } } }}
        />,
      );
    });

    expect(findButton("Email me a sign-in link instead")).toBeUndefined();
  });
});
