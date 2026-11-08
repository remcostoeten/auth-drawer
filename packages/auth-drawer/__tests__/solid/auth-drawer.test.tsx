import { createSignal } from "solid-js";
import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthDrawer, AuthProvider, useAuth } from "../../src/solid";
import {
  SIGNED_IN,
  click,
  createSessionAwareAdapter,
  createTestAdapter,
  credentials,
  dialog,
  findButton,
  flush,
  submitButton,
  type as typeInto,
} from "./helpers";

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

function fillCredentials() {
  typeInto('input[type="email"]', credentials.email);
  typeInto('input[type="password"]', credentials.password);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("trigger button", () => {
  it("renders by default and opens the dialog on click", () => {
    const { container } = render(() => <AuthDrawer adapter={createTestAdapter()} />);
    const trigger = container.querySelector("[aria-haspopup='dialog']");

    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(dialog()).toBeNull();

    click(trigger);

    expect(dialog()).toBeTruthy();
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the dialog when the trigger is clicked while open", async () => {
    vi.useFakeTimers();
    const { container } = render(() => <AuthDrawer adapter={createTestAdapter()} defaultOpen />);

    click(container.querySelector("[aria-haspopup='dialog']"));
    await vi.advanceTimersByTimeAsync(400);

    expect(dialog()).toBeNull();
  });

  it("hides the trigger with hideTrigger", () => {
    const { container } = render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger />);
    expect(container.querySelector("[aria-haspopup='dialog']")).toBeNull();
  });

  it("applies triggerClassName and falls back to className", () => {
    const { container, unmount } = render(() => (
      <AuthDrawer adapter={createTestAdapter()} className="old-class" triggerClassName="new-class" />
    ));
    expect(container.querySelector(".new-class")).toBeTruthy();
    expect(container.querySelector(".old-class")).toBeNull();
    unmount();

    const legacy = render(() => <AuthDrawer adapter={createTestAdapter()} className="legacy-class" />);
    expect(legacy.container.querySelector(".legacy-class")).toBeTruthy();
  });

  it("shows the open and close labels from copy", () => {
    const { container } = render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        config={{ ui: { copy: { trigger: { title: "Account", open: "Open it", close: "Shut it" } } } }}
      />
    ));
    const trigger = container.querySelector("[aria-haspopup='dialog']");

    expect(trigger?.textContent).toContain("Account");
    expect(trigger?.textContent).toContain("Open it");

    click(trigger);
    expect(trigger?.textContent).toContain("Shut it");
  });
});

describe("dialog semantics and dismissal", () => {
  it("labels the dialog by its title and description", () => {
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger defaultOpen />);
    const element = dialog();

    expect(element?.getAttribute("aria-modal")).toBe("true");
    const title = document.getElementById(element?.getAttribute("aria-labelledby") ?? "");
    const description = document.getElementById(element?.getAttribute("aria-describedby") ?? "");
    expect(title?.tagName).toBe("H2");
    expect(title?.textContent).toBe("Welcome back");
    expect(description?.textContent?.trim()).toBeTruthy();
  });

  it("closes on Escape and reports it through onOpenChange", async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger defaultOpen onOpenChange={onOpenChange} />);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog()).toBeNull();
  });

  it("ignores other keys", () => {
    const onOpenChange = vi.fn();
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger open onOpenChange={onOpenChange} />);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("closes from the close button", async () => {
    vi.useFakeTimers();
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger defaultOpen />);

    click(document.body.querySelector('[aria-label="Close sign in dialog"]'));
    await vi.advanceTimersByTimeAsync(400);

    expect(dialog()).toBeNull();
  });

  it("closes the modal variant when the backdrop area is clicked", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        hideTrigger
        open
        onOpenChange={onOpenChange}
        config={{ ui: { presentation: { variant: "modal" } } }}
      />
    ));

    click(dialog());

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not close when the form content is clicked in the modal variant", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        hideTrigger
        open
        onOpenChange={onOpenChange}
        config={{ ui: { presentation: { variant: "modal" } } }}
      />
    ));

    click(document.body.querySelector("form"));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("does not close the drawer variant on a backdrop click", () => {
    const onOpenChange = vi.fn();
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger open onOpenChange={onOpenChange} />);

    click(dialog());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("drops every dismiss affordance when dismissible is false", () => {
    const onOpenChange = vi.fn();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        hideTrigger
        open
        onOpenChange={onOpenChange}
        config={{ ui: { presentation: { dismissible: false, variant: "modal" } } }}
      />
    ));

    expect(document.body.querySelector('[aria-label="Close sign in dialog"]')).toBeNull();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    click(dialog());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog()).toBeTruthy();
  });

  it("moves focus into the dialog after opening and back to the trigger after closing", async () => {
    vi.useFakeTimers();
    const [open, setOpen] = createSignal(false);
    const { container } = render(() => (
      <AuthDrawer adapter={createTestAdapter()} open={open()} onOpenChange={setOpen} />
    ));
    const trigger = container.querySelector<HTMLElement>("[aria-haspopup='dialog']");

    setOpen(true);
    await vi.advanceTimersByTimeAsync(150);
    expect(dialog()?.contains(document.activeElement)).toBe(true);

    setOpen(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(document.activeElement).toBe(trigger);
  });

  it("makes everything outside the portal inert while open and restores it on close", async () => {
    vi.useFakeTimers();
    const portal = document.createElement("div");
    portal.id = "auth-drawer-portal";
    document.body.appendChild(portal);
    const [open, setOpen] = createSignal(true);
    const { container } = render(() => (
      <AuthDrawer adapter={createTestAdapter()} hideTrigger open={open()} onOpenChange={setOpen} />
    ));

    expect(portal.querySelector('[role="dialog"]')).toBeTruthy();
    expect(container.hasAttribute("inert")).toBe(true);
    expect(portal.hasAttribute("inert")).toBe(false);

    setOpen(false);
    await vi.advanceTimersByTimeAsync(400);

    expect(portal.querySelector('[role="dialog"]')).toBeNull();
    expect(container.hasAttribute("inert")).toBe(false);
    portal.remove();
  });
});

describe("controlled open state", () => {
  it("follows the open prop and never changes it on its own", () => {
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(false);
    const { container } = render(() => (
      <AuthDrawer adapter={createTestAdapter()} open={open()} onOpenChange={onOpenChange} />
    ));

    click(container.querySelector("[aria-haspopup='dialog']"));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(dialog()).toBeNull();

    setOpen(true);
    expect(dialog()).toBeTruthy();
  });

  it("keeps explicit open props ahead of the provider state", () => {
    const adapter = createTestAdapter();
    render(() => (
      <AuthProvider adapter={adapter}>
        <ProviderControls />
        <AuthDrawer adapter={adapter} hideTrigger open={false} />
      </AuthProvider>
    ));

    click(findButton("Open from provider"));

    expect(dialog()).toBeNull();
  });
});

describe("AuthProvider open state", () => {
  it("opens and closes from provider controls when no open props are given", async () => {
    vi.useFakeTimers();
    const adapter = createTestAdapter();
    render(() => (
      <AuthProvider adapter={adapter}>
        <ProviderControls />
        <AuthDrawer adapter={adapter} hideTrigger />
      </AuthProvider>
    ));

    expect(dialog()).toBeNull();

    click(findButton("Open from provider"));
    expect(dialog()).toBeTruthy();

    click(findButton("Close from provider"));
    await vi.advanceTimersByTimeAsync(400);
    expect(dialog()).toBeNull();
  });

  it("keeps the provider in sync when the drawer closes itself", async () => {
    vi.useFakeTimers();
    const adapter = createTestAdapter();
    let isOpen: () => boolean = () => false;

    function Probe() {
      isOpen = useAuth().isDrawerOpen;
      return null;
    }

    render(() => (
      <AuthProvider adapter={adapter}>
        <Probe />
        <ProviderControls />
        <AuthDrawer adapter={adapter} hideTrigger />
      </AuthProvider>
    ));

    click(findButton("Open from provider"));
    expect(isOpen()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(isOpen()).toBe(false);
  });

  it("keeps drawer, provider and adapter callbacks when submitting through provider actions", async () => {
    const adapter = createTestAdapter({ onSuccess: vi.fn() });
    const providerSuccess = vi.fn();
    const drawerSuccess = vi.fn();
    render(() => (
      <AuthProvider adapter={adapter} onSuccess={providerSuccess}>
        <ProviderControls />
        <AuthDrawer adapter={adapter} hideTrigger onSuccess={drawerSuccess} />
      </AuthProvider>
    ));

    click(findButton("Open from provider"));
    fillCredentials();
    click(submitButton());
    await flush();

    expect(adapter.signIn).toHaveBeenCalledWith(credentials);
    expect(adapter.onSuccess).toHaveBeenCalledWith("signIn");
    expect(providerSuccess).toHaveBeenCalledWith("signIn");
    expect(drawerSuccess).toHaveBeenCalledWith("signIn");
  });
});

describe("sign in success", () => {
  it("calls onSuccess, shows the success message, then closes", async () => {
    vi.useFakeTimers();
    const onSuccess = vi.fn();
    const adapter = createTestAdapter();
    render(() => <AuthDrawer adapter={adapter} hideTrigger defaultOpen onSuccess={onSuccess} />);

    fillCredentials();
    click(submitButton());
    await vi.advanceTimersByTimeAsync(0);

    expect(onSuccess).toHaveBeenCalledWith("signIn");
    expect(submitButton().dataset.feedbackStatus).toBe("success");
    expect(submitButton().textContent).toContain("Signed in");
    expect(dialog()).toBeTruthy();

    await vi.advanceTimersByTimeAsync(3600);
    await vi.advanceTimersByTimeAsync(400);

    expect(dialog()).toBeNull();
  });

  it("closes after the minimum visible time once the session is authenticated", async () => {
    vi.useFakeTimers();
    const { adapter } = createSessionAwareAdapter();
    render(() => (
      <AuthProvider adapter={adapter}>
        <ProviderControls />
        <AuthDrawer adapter={adapter} hideTrigger />
      </AuthProvider>
    ));

    click(findButton("Open from provider"));
    fillCredentials();
    click(submitButton());
    await vi.advanceTimersByTimeAsync(0);

    expect(submitButton().dataset.feedbackStatus).toBe("success");
    expect(dialog()).toBeTruthy();

    await vi.advanceTimersByTimeAsync(600);
    expect(dialog()).toBeTruthy();

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(400);
    expect(dialog()).toBeNull();
  });

  it("closes immediately when the success state is disabled", async () => {
    vi.useFakeTimers();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        hideTrigger
        defaultOpen
        config={{ ui: { success: { enabled: false } } }}
      />
    ));

    fillCredentials();
    click(submitButton());
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(400);

    expect(dialog()).toBeNull();
  });

  it("renders the success footer while the success state shows", async () => {
    vi.useFakeTimers();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        hideTrigger
        defaultOpen
        config={{ ui: { success: { footer: <p data-testid="success-footer">Welcome aboard</p> } } }}
      />
    ));

    expect(document.body.querySelector("[data-testid='success-footer']")).toBeNull();

    fillCredentials();
    click(submitButton());
    await vi.advanceTimersByTimeAsync(0);

    expect(document.body.querySelector("[data-testid='success-footer']")?.textContent).toBe("Welcome aboard");
  });

  it("does not open for an authenticated session", () => {
    const adapter = createTestAdapter({
      session: { getSnapshot: () => SIGNED_IN, subscribe: () => () => {} },
    });
    const { container } = render(() => <AuthDrawer adapter={adapter} />);

    click(container.querySelector("[aria-haspopup='dialog']"));

    expect(dialog()).toBeNull();
  });
});

describe("adapter feature gating", () => {
  it("hides the register switch when the adapter has no signUp", () => {
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger defaultOpen />);
    expect(document.body.textContent?.toLowerCase()).not.toContain("register");
  });

  it("shows the register switch when the adapter has signUp", () => {
    const adapter = createTestAdapter({ signUp: vi.fn(async () => ({ success: true })) });
    render(() => <AuthDrawer adapter={adapter} hideTrigger defaultOpen />);
    expect(document.body.textContent?.toLowerCase()).toContain("register");
  });
});

describe("prop changes", () => {
  it("applies a new config without remounting the dialog", () => {
    const [config, setConfig] = createSignal({ ui: { copy: { login: { title: "First title" } } } });
    render(() => <AuthDrawer adapter={createTestAdapter()} hideTrigger defaultOpen config={config()} />);

    const before = dialog();
    expect(document.body.querySelector("h2")?.textContent).toBe("First title");

    setConfig({ ui: { copy: { login: { title: "Second title" } } } });

    expect(document.body.querySelector("h2")?.textContent).toBe("Second title");
    expect(dialog()).toBe(before);
  });
});
