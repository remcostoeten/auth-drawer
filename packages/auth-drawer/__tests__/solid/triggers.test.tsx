import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthDrawer, createAuthTriggerStore, type AuthConfig } from "../../src/solid";
import { SIGNED_IN, createTestAdapter, dialog } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

function totalFires(store: ReturnType<typeof createAuthTriggerStore>) {
  return Object.values(store.snapshot().fireCounts).reduce((sum, count) => sum + count, 0);
}

function renderWithTriggers(triggers: NonNullable<AuthConfig["triggers"]>, store = createAuthTriggerStore()) {
  const view = render(() => (
    <AuthDrawer adapter={createTestAdapter()} hideTrigger triggerStore={store} config={{ triggers }} />
  ));

  return { ...view, store };
}

describe("page load trigger", () => {
  it("opens after the configured delay", async () => {
    vi.useFakeTimers();
    renderWithTriggers({ pageLoad: { delayMs: 200 } });

    expect(dialog()).toBeNull();

    await vi.advanceTimersByTimeAsync(199);
    expect(dialog()).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(dialog()).toBeTruthy();
  });

  it("does not fire after the drawer unmounted", async () => {
    vi.useFakeTimers();
    const { unmount, store } = renderWithTriggers({ pageLoad: { delayMs: 200 } });

    unmount();
    await vi.advanceTimersByTimeAsync(300);

    expect(totalFires(store)).toBe(0);
  });

  it("does not open for an authenticated session", async () => {
    vi.useFakeTimers();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter({ session: { getSnapshot: () => SIGNED_IN, subscribe: () => () => {} } })}
        hideTrigger
        config={{ triggers: { pageLoad: { delayMs: 10 } } }}
      />
    ));

    await vi.advanceTimersByTimeAsync(50);

    expect(dialog()).toBeNull();
  });
});

describe("custom event trigger", () => {
  it("opens when the matching event is emitted on the trigger store", () => {
    const { store } = renderWithTriggers({ custom: { event: "paywall" } });

    store.emit({ kind: "custom", event: "other" });
    expect(dialog()).toBeNull();

    store.emit({ kind: "custom", event: "paywall" });
    expect(dialog()).toBeTruthy();
  });

  it("honours the once policy", async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const store = createAuthTriggerStore();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter()}
        hideTrigger
        triggerStore={store}
        onOpenChange={onOpenChange}
        config={{ triggers: { custom: { event: "paywall", once: true } } }}
      />
    ));

    store.emit({ kind: "custom", event: "paywall" });
    store.emit({ kind: "custom", event: "paywall" });

    expect(onOpenChange.mock.calls.filter(([open]) => open === true)).toHaveLength(1);
  });

  it("unregisters its triggers when the drawer unmounts", () => {
    const { store, unmount } = renderWithTriggers({ custom: { event: "paywall" } });

    unmount();
    store.emit({ kind: "custom", event: "paywall" });

    expect(dialog()).toBeNull();
    expect(totalFires(store)).toBe(0);
  });
});

describe("click trigger", () => {
  it("opens when an element matching the selector is clicked", () => {
    const button = document.createElement("button");
    button.id = "open-auth";
    document.body.appendChild(button);
    renderWithTriggers({ click: { selector: "#open-auth" } });

    document.body.click();
    expect(dialog()).toBeNull();

    button.click();
    expect(dialog()).toBeTruthy();
  });
});

describe("state trigger", () => {
  it("opens for an expired session event", () => {
    const { store } = renderWithTriggers({ state: { state: "expired" } });

    store.emit({ kind: "state", state: "missing" });
    expect(dialog()).toBeNull();

    store.emit({ kind: "state", state: "expired" });
    expect(dialog()).toBeTruthy();
  });
});
