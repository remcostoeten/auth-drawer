import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdapter } from "../../../src/react/create-adapter";
import { AuthDrawer } from "../../../src/react/ui/auth-drawer";
import { AuthProvider } from "../../../src/react/ui/auth-provider";

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("StrictMode", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
  });

  it("opens, submits and reports success with the double-invoked effects", async () => {
    const signIn = vi.fn(async () => ({ success: true }));
    const onSuccess = vi.fn();
    const adapter = createAdapter({ id: "strict", signIn });

    act(() => {
      root.render(
        <StrictMode>
          <AuthProvider adapter={adapter}>
            <AuthDrawer adapter={adapter} onSuccess={onSuccess} />
          </AuthProvider>
        </StrictMode>,
      );
    });

    act(() => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();

    const email = document.body.querySelector<HTMLInputElement>('input[type="email"]');
    const password = document.body.querySelector<HTMLInputElement>('input[type="password"]');
    act(() => {
      if (email) setInputValue(email, "ada@example.com");
      if (password) setInputValue(password, "password123");
    });

    await act(async () => {
      document.body
        .querySelector("form")
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("signIn");
  });
});
