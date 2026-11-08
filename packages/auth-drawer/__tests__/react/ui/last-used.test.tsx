import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LAST_USED_KEY } from "@remcostoeten/auth-drawer/core";
import { clearLastUsedMethod, readLastUsedMethod, recordLastUsedMethod } from "../../../src/react/last-used";
import type { AuthAdapter, AuthConfig } from "../../../src/react/types";
import { AuthDrawer } from "../../../src/react/ui/auth-drawer";
import { AuthProvider } from "../../../src/react/ui/auth-provider";

function createAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    id: "test",
    providers: ["github", "google"],
    signIn: vi.fn(async () => ({ success: true })),
    signInWithOAuth: vi.fn(async () => ({ success: true })),
    useSession: () => ({ data: null, isPending: false, error: null }),
    ...overrides,
  };
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function findButton(label: string) {
  return Array.from(document.body.querySelectorAll("button")).find(
    (button) => button.getAttribute("aria-label") === label || button.textContent?.includes(label),
  );
}

function badges() {
  return Array.from(document.body.querySelectorAll("[data-auth-badge]")).map(
    (node) =>
      node.closest("button")?.getAttribute("aria-label") ?? node.closest("button")?.textContent,
  );
}

describe("last used sign-in method", () => {
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

  function render(adapter: AuthAdapter, config?: AuthConfig) {
    act(() => {
      root.render(
        <AuthProvider adapter={adapter}>
          <AuthDrawer adapter={adapter} hideTrigger open config={config} />
        </AuthProvider>,
      );
    });
  }

  it("reads, records, and clears the method in versioned storage", () => {
    expect(readLastUsedMethod()).toBeNull();

    recordLastUsedMethod("google");
    expect(localStorage.getItem(LAST_USED_KEY)).toBe("google");
    expect(readLastUsedMethod()).toBe("google");

    localStorage.setItem(LAST_USED_KEY, "not-a-method");
    expect(readLastUsedMethod()).toBeNull();

    recordLastUsedMethod("email");
    clearLastUsedMethod();
    expect(readLastUsedMethod()).toBeNull();
  });

  it("shows no chip until a method has been used", () => {
    render(createAdapter());
    expect(badges()).toEqual([]);
  });

  it("marks the provider used last, in the first render", () => {
    recordLastUsedMethod("google");
    render(createAdapter());

    expect(badges()).toEqual(["Continue with Google"]);
    expect(document.body.querySelector("[data-auth-badge]")?.textContent).toBe("Last used");
  });

  it("records an OAuth sign-in and moves the chip to that provider", async () => {
    recordLastUsedMethod("google");
    render(createAdapter());

    await act(async () => {
      findButton("Continue with GitHub")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(readLastUsedMethod()).toBe("github");

    act(() => {
      root.render(null);
    });
    render(createAdapter());
    expect(badges()).toEqual(["Continue with GitHub"]);
  });

  it("marks the password form after a password sign-in", async () => {
    render(createAdapter());

    const email = document.body.querySelector('input[type="email"]') as HTMLInputElement;
    const password = document.body.querySelector('input[type="password"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(email, "user@example.com");
      setInputValue(password, "correct-horse-battery");
    });
    await act(async () => {
      document.body.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    expect(readLastUsedMethod()).toBe("email");
  });

  it("honours ui.auth.showLastUsed and copy.lastUsed.label", () => {
    recordLastUsedMethod("github");
    render(createAdapter(), { ui: { auth: { showLastUsed: false } } });
    expect(badges()).toEqual([]);

    render(createAdapter(), { ui: { copy: { lastUsed: { label: "Recent" } } } });
    expect(document.body.querySelector("[data-auth-badge]")?.textContent).toBe("Recent");
  });
});
