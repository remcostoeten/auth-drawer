import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthError, type AuthUiError } from "../../src/auth-errors";
import type { AuthAdapter } from "../../src/types";
import { AuthDrawer } from "../../src/ui/auth-drawer";
import { AuthProvider, useAuth } from "../../src/ui/auth-provider";

const credentials = {
  email: "test@example.com",
  password: "password123",
  rememberMe: false,
};

function createAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    id: "test",
    signIn: vi.fn(async () => ({ success: true })),
    useSession: vi.fn(() => ({ data: null, isPending: false, error: null })),
    ...overrides,
  };
}

function createSessionAwareAdapter(): AuthAdapter {
  const listeners = new Set<() => void>();
  const session = {
    current: {
      data: null as {
        user: { id: string; email: string };
        session: { id: string };
      } | null,
      isPending: false,
      error: null as unknown,
    },
  };

  function notify() {
    listeners.forEach((listener) => listener());
  }

  return {
    id: "test",
    signIn: vi.fn(async () => {
      session.current = {
        data: {
          user: { id: "user_1", email: "test@example.com" },
          session: { id: "session_1" },
        },
        isPending: false,
        error: null,
      };
      notify();
      return { success: true, data: session.current.data };
    }),
    useSession() {
      const [snapshot, setSnapshot] = useState(session.current);

      useEffect(() => {
        const listener = () => {
          setSnapshot(session.current);
        };

        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      }, []);

      return snapshot;
    },
  };
}

function ProviderControls() {
  const auth = useAuth();

  return (
    <>
      <button type="button" onClick={auth.openDrawer}>
        Open from provider
      </button>
      <button type="button" onClick={auth.closeDrawer}>
        Close from provider
      </button>
    </>
  );
}

function SignInControl({ onResult }: { onResult: (result: unknown) => void }) {
  const auth = useAuth();

  return (
    <button type="button" onClick={() => void auth.signIn(credentials).then(onResult)}>
      Sign in
    </button>
  );
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("AuthDrawer provider open state", () => {
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

  it("uses AuthProvider drawer state when open props are omitted", () => {
    const adapter = createAdapter();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter}>
          <ProviderControls />
          <AuthDrawer adapter={adapter} hideTrigger />
        </AuthProvider>,
      );
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();

    act(() => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it("keeps explicit controlled open props ahead of provider state", () => {
    const adapter = createAdapter();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter}>
          <ProviderControls />
          <AuthDrawer adapter={adapter} hideTrigger open={false} />
        </AuthProvider>,
      );
    });

    act(() => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it("uses the provider session instead of subscribing twice inside AuthProvider", () => {
    const adapter = createAdapter();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter}>
          <AuthDrawer adapter={adapter} hideTrigger />
        </AuthProvider>,
      );
    });

    expect(adapter.useSession).toHaveBeenCalledTimes(1);
  });

  it("falls back to the adapter session outside AuthProvider", () => {
    const adapter = createAdapter();

    act(() => {
      root.render(<AuthDrawer adapter={adapter} hideTrigger />);
    });

    expect(adapter.useSession).toHaveBeenCalledTimes(1);
  });

  it("keeps drawer callbacks when submitting through provider-backed actions", async () => {
    const adapter = createAdapter({
      signIn: vi.fn(async () => ({ success: true })),
      onSuccess: vi.fn(),
    });
    const providerSuccess = vi.fn();
    const drawerSuccess = vi.fn();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter} onSuccess={providerSuccess}>
          <ProviderControls />
          <AuthDrawer adapter={adapter} hideTrigger onSuccess={drawerSuccess} />
        </AuthProvider>,
      );
    });

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const email = document.body.querySelector('input[type="email"]') as HTMLInputElement;
    const password = document.body.querySelector('input[type="password"]') as HTMLInputElement;
    const submit = document.body.querySelector('button[type="submit"]') as HTMLButtonElement;

    await act(async () => {
      setInputValue(email, credentials.email);
      setInputValue(password, credentials.password);
      submit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adapter.onSuccess).toHaveBeenCalledWith("signIn");
    expect(providerSuccess).toHaveBeenCalledWith("signIn");
    expect(drawerSuccess).toHaveBeenCalledWith("signIn");
  });

  it("keeps the drawer open briefly after successful sign in before closing", async () => {
    vi.useFakeTimers();
    const adapter = createSessionAwareAdapter();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter}>
          <ProviderControls />
          <AuthDrawer adapter={adapter} hideTrigger />
        </AuthProvider>,
      );
    });

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const email = document.body.querySelector('input[type="email"]') as HTMLInputElement;
    const password = document.body.querySelector('input[type="password"]') as HTMLInputElement;
    const submit = document.body.querySelector('button[type="submit"]') as HTMLButtonElement;

    await act(async () => {
      setInputValue(email, credentials.email);
      setInputValue(password, credentials.password);
      submit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect((document.body.querySelector('button[type="submit"]') as HTMLButtonElement | null)?.dataset.feedbackStatus).toBe("success");
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(650);
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    vi.useRealTimers();
  });
});

describe("AuthProvider actions", () => {
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
    document.body.removeChild(container);
  });

  it("calls adapter and provider success callbacks while preserving successful results", async () => {
    const result = { success: true, data: { userId: "user_1" } };
    const adapter = createAdapter({
      signIn: vi.fn(async () => result),
      onSuccess: vi.fn(),
    });
    const onSuccess = vi.fn();
    const onResult = vi.fn();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter} onSuccess={onSuccess}>
          <SignInControl onResult={onResult} />
        </AuthProvider>,
      );
    });

    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adapter.signIn).toHaveBeenCalledWith(credentials);
    expect(adapter.onSuccess).toHaveBeenCalledWith("signIn");
    expect(onSuccess).toHaveBeenCalledWith("signIn");
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it("calls adapter and provider error callbacks while preserving failed results", async () => {
    const error = createAuthError("invalid_credentials", "form");
    const result = { success: false, error };
    const adapter = createAdapter({
      signIn: vi.fn(async () => result),
      onError: vi.fn(),
    });
    const onError = vi.fn();
    const onResult = vi.fn();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter} onError={onError}>
          <SignInControl onResult={onResult} />
        </AuthProvider>,
      );
    });

    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adapter.onError).toHaveBeenCalledWith(error, "signIn");
    expect(onError).toHaveBeenCalledWith(error, "signIn");
    expect(onResult).toHaveBeenCalledWith(result);
  });

  it("normalizes thrown errors and returns a failed auth result", async () => {
    const rawError = new Error("network unavailable");
    const normalized: AuthUiError = createAuthError("network_error", "form", {
      cause: rawError,
    });
    const adapter = createAdapter({
      signIn: vi.fn(async () => {
        throw rawError;
      }),
      normalizeError: vi.fn(() => normalized),
      onError: vi.fn(),
    });
    const onError = vi.fn();
    const onResult = vi.fn();

    act(() => {
      root.render(
        <AuthProvider adapter={adapter} onError={onError}>
          <SignInControl onResult={onResult} />
        </AuthProvider>,
      );
    });

    await act(async () => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(adapter.normalizeError).toHaveBeenCalledWith(rawError);
    expect(adapter.onError).toHaveBeenCalledWith(normalized, "signIn");
    expect(onError).toHaveBeenCalledWith(normalized, "signIn");
    expect(onResult).toHaveBeenCalledWith({ success: false, error: normalized });
  });
});

describe("AuthDrawer trigger visibility", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  it("renders the trigger button by default", () => {
    const adapter = createAdapter();
    act(() => { root.render(<AuthDrawer adapter={adapter} />); });
    expect(container.querySelector("[aria-haspopup='dialog']")).toBeTruthy();
  });

  it("hides the trigger button when hideTrigger is true", () => {
    const adapter = createAdapter();
    act(() => { root.render(<AuthDrawer adapter={adapter} hideTrigger />); });
    expect(container.querySelector("[aria-haspopup='dialog']")).toBeNull();
  });

  it("applies triggerClassName to the trigger button", () => {
    const adapter = createAdapter();
    act(() => { root.render(<AuthDrawer adapter={adapter} triggerClassName="my-trigger" />); });
    expect(container.querySelector(".my-trigger")).toBeTruthy();
  });

  it("falls back to className when triggerClassName is not provided", () => {
    const adapter = createAdapter();
    act(() => { root.render(<AuthDrawer adapter={adapter} className="legacy-class" />); });
    expect(container.querySelector(".legacy-class")).toBeTruthy();
  });

  it("triggerClassName takes precedence over className", () => {
    const adapter = createAdapter();
    act(() => {
      root.render(<AuthDrawer adapter={adapter} className="old-class" triggerClassName="new-class" />);
    });
    expect(container.querySelector(".new-class")).toBeTruthy();
    expect(container.querySelector(".old-class")).toBeNull();
  });
});

describe("AuthDrawer adapter feature gating", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  it("hides the register switch when adapter has no signUp", () => {
    const adapter = createAdapter({ signUp: undefined });
    act(() => { root.render(<AuthDrawer adapter={adapter} defaultOpen />); });
    const allText = document.body.textContent?.toLowerCase() ?? "";
    expect(allText.includes("register")).toBe(false);
  });

  it("shows the register switch when adapter has signUp", () => {
    const adapter = createAdapter({ signUp: vi.fn(async () => ({ success: true })) });
    act(() => { root.render(<AuthDrawer adapter={adapter} defaultOpen />); });
    const allText = document.body.textContent?.toLowerCase() ?? "";
    expect(allText.includes("register")).toBe(true);
  });
});

describe("AuthDrawer keyboard interaction", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  });

  it("calls onOpenChange(false) when Escape is pressed while open", async () => {
    const adapter = createAdapter();
    const onOpenChange = vi.fn();
    act(() => {
      root.render(<AuthDrawer adapter={adapter} open onOpenChange={onOpenChange} />);
    });

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not call onOpenChange when a different key is pressed", async () => {
    const adapter = createAdapter();
    const onOpenChange = vi.fn();
    act(() => {
      root.render(<AuthDrawer adapter={adapter} open onOpenChange={onOpenChange} />);
    });

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("returns focus to the trigger button when drawer closes", async () => {
    const adapter = createAdapter();
    const onOpenChange = vi.fn();
    act(() => {
      root.render(<AuthDrawer adapter={adapter} open onOpenChange={onOpenChange} />);
    });

    const trigger = container.querySelector("[aria-haspopup='dialog']") as HTMLElement;

    await act(async () => {
      root.render(<AuthDrawer adapter={adapter} open={false} onOpenChange={onOpenChange} />);
    });

    expect(document.activeElement).toBe(trigger);
  });
});
