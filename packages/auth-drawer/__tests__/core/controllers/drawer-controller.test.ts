import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CONFIG,
  SETTINGS_EVENT,
  SETTINGS_KEY,
  createAuthTriggerStore,
  createDrawerController,
  createPushSession,
  type AuthConfig,
  type AuthTriggerEvent,
  type AuthTriggerKind,
  type AuthTriggerStore,
  type DrawerController,
  type OpenBinding,
  type PushSession,
} from "../../../src/core";
import { SIGNED_IN, SIGNED_OUT, makeAdapter } from "../helpers";

type FakeStore = AuthTriggerStore & {
  registered: Array<{
    kind: AuthTriggerKind;
    config: unknown;
    fire: (e: AuthTriggerEvent) => void;
  }>;
  cleanups: ReturnType<typeof vi.fn>;
  emitted: AuthTriggerEvent[];
  fire: (kind: AuthTriggerKind) => void;
};

function fakeTriggerStore(): FakeStore {
  const registered: FakeStore["registered"] = [];
  const emitted: AuthTriggerEvent[] = [];
  const cleanups = vi.fn();

  return {
    registered,
    cleanups,
    emitted,
    registerTrigger: (kind, config, onFire) => {
      registered.push({ kind, config, fire: onFire });
      return cleanups;
    },
    emit: (event) => {
      emitted.push(event);
    },
    subscribe: () => () => undefined,
    clear: () => undefined,
    snapshot: () => ({ seenCounts: {}, fireCounts: {}, lastSeenAt: {}, lastFiredAt: {} }),
    fire(kind) {
      registered
        .filter((entry) => entry.kind === kind)
        .forEach((entry) => entry.fire({ kind: "custom", event: "test" }));
    },
  };
}

const live: DrawerController[] = [];

type Setup = {
  drawer: DrawerController;
  session: PushSession;
  store: FakeStore;
  onOpenChange: ReturnType<typeof vi.fn>;
  listener: ReturnType<typeof vi.fn>;
};

function setup(
  config?: AuthConfig,
  extra: { open?: OpenBinding; subscribe?: boolean } = {},
): Setup {
  const session = createPushSession(SIGNED_OUT);
  const store = fakeTriggerStore();
  const onOpenChange = vi.fn();
  const adapter = makeAdapter({ session: session.source });
  const drawer = createDrawerController({
    adapter,
    config,
    session: session.source,
    triggerStore: store,
    open: extra.open,
    onOpenChange,
  });
  const listener = vi.fn();
  if (extra.subscribe !== false) drawer.subscribe(listener);
  live.push(drawer);

  return { drawer, session, store, onOpenChange, listener };
}

function controlled(initial: boolean) {
  const binding = { value: initial, set: vi.fn() };
  const open: OpenBinding = { get: () => binding.value, set: binding.set };
  return { binding, open };
}

describe("createDrawerController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    live.splice(0).forEach((drawer) => drawer.destroy());
    vi.useRealTimers();
  });

  describe("state", () => {
    it("resolves the config and exposes defaults", () => {
      const { drawer } = setup({ ui: { presentation: { variant: "modal", dismissible: false } } });
      const state = drawer.getState();

      expect(state.open).toBe(false);
      expect(state.dismissible).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.successState).toBeNull();
      expect(state.motion.displayMode).toBe("modal");
      expect(state.resolved.ui.auth.providers).toEqual(["github", "google"]);
      expect(state.formConfig).toBe(state.resolved);
    });

    it("starts open when presentation.defaultOpen is set", () => {
      expect(setup({ ui: { presentation: { defaultOpen: true } } }).drawer.getState().open).toBe(
        true,
      );
    });

    it("prefers the defaultOpen option over the config", () => {
      const session = createPushSession(SIGNED_OUT);
      const drawer = createDrawerController({
        adapter: makeAdapter(),
        session: session.source,
        defaultOpen: true,
        config: { ui: { presentation: { defaultOpen: false } } },
      });
      live.push(drawer);

      expect(drawer.getState().open).toBe(true);
    });

    it("tracks authentication from the session source", () => {
      const { drawer, session, listener } = setup();

      session.push(SIGNED_IN);

      expect(drawer.getState().isAuthenticated).toBe(true);
      expect(listener).toHaveBeenCalled();
    });

    it("returns a stable state object between changes", () => {
      const { drawer } = setup();

      expect(drawer.getState()).toBe(drawer.getState());
    });
  });

  describe("uncontrolled open state", () => {
    it("opens, closes and toggles, reporting each change", () => {
      const { drawer, onOpenChange } = setup();

      drawer.openDrawer();
      expect(drawer.getState().open).toBe(true);
      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      drawer.toggleDrawer();
      expect(drawer.getState().open).toBe(false);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);

      drawer.toggleDrawer();
      expect(drawer.getState().open).toBe(true);

      drawer.closeDrawer();
      expect(drawer.getState().open).toBe(false);
    });

    it("ignores open requests while authenticated", () => {
      const { drawer, session, onOpenChange } = setup();
      session.push(SIGNED_IN);

      drawer.openDrawer();
      drawer.toggleDrawer();

      expect(drawer.getState().open).toBe(false);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("still closes while authenticated", () => {
      const { drawer, session } = setup({ ui: { presentation: { defaultOpen: true } } });
      session.push(SIGNED_IN);

      drawer.closeDrawer();

      expect(drawer.getState().open).toBe(false);
    });

    it("notifies subscribers on open changes", () => {
      const { drawer, listener } = setup();

      drawer.openDrawer();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe("controlled open state", () => {
    it("reads the binding and forwards requested changes without owning the value", () => {
      const { binding, open } = controlled(false);
      const { drawer, onOpenChange } = setup(undefined, { open });

      drawer.openDrawer();

      expect(binding.set).toHaveBeenCalledWith(true);
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(drawer.getState().open).toBe(false);
    });

    it("picks up external changes through syncOpen", () => {
      const { binding, open } = controlled(false);
      const { drawer, listener } = setup(undefined, { open });

      binding.value = true;
      drawer.syncOpen();

      expect(drawer.getState().open).toBe(true);
      expect(listener).toHaveBeenCalled();
    });

    it("reads a binding that applies changes synchronously", () => {
      let value = false;
      const open: OpenBinding = {
        get: () => value,
        set: (next) => {
          value = next;
        },
      };
      const { drawer } = setup(undefined, { open });

      drawer.openDrawer();
      expect(drawer.getState().open).toBe(true);

      drawer.toggleDrawer();
      expect(value).toBe(false);
      expect(drawer.getState().open).toBe(false);
    });

    it("switches binding through updateInputs", () => {
      const first = controlled(false);
      const second = controlled(true);
      const { drawer } = setup(undefined, { open: first.open });

      drawer.updateInputs({ open: second.open });

      expect(drawer.getState().open).toBe(true);
    });
  });

  describe("success state", () => {
    it("closes immediately when success handling is disabled", () => {
      const { drawer } = setup({
        ui: { presentation: { defaultOpen: true }, success: { enabled: false } },
      });

      drawer.handleAuthSuccess("signIn");

      expect(drawer.getState().open).toBe(false);
      expect(drawer.getState().successState).toBeNull();
    });

    it("records the success state and hides the footer from the form config", () => {
      const { drawer } = setup({ ui: { presentation: { defaultOpen: true }, footer: "custom" } });
      const before = drawer.getState().formConfig;

      drawer.handleAuthSuccess("oauth");

      const state = drawer.getState();
      expect(state.successState?.action).toBe("oauth");
      expect(state.formConfig).not.toBe(before);
      expect(state.formConfig.ui.auth.showFooter).toBe(false);
      expect(state.formConfig.ui.footer).toBeUndefined();
      expect(state.resolved.ui.footer).toBe("custom");
      expect(drawer.getState().formConfig).toBe(state.formConfig);
    });

    it("waits for the maximum visible time while the session stays unauthenticated", () => {
      const { drawer } = setup({
        ui: {
          presentation: { defaultOpen: true },
          success: { minVisibleMs: 500, maxVisibleMs: 2000 },
        },
      });

      drawer.handleAuthSuccess("signIn");
      vi.advanceTimersByTime(1999);
      expect(drawer.getState().open).toBe(true);

      vi.advanceTimersByTime(1);
      expect(drawer.getState().open).toBe(false);
      expect(drawer.getState().successState).toBeNull();
    });

    it("closes after the minimum visible time once the session is authenticated", () => {
      const { drawer, session } = setup({
        ui: {
          presentation: { defaultOpen: true },
          success: { minVisibleMs: 500, maxVisibleMs: 5000 },
        },
      });

      drawer.handleAuthSuccess("signIn");
      vi.advanceTimersByTime(200);
      session.push(SIGNED_IN);

      vi.advanceTimersByTime(299);
      expect(drawer.getState().open).toBe(true);
      vi.advanceTimersByTime(1);
      expect(drawer.getState().open).toBe(false);
    });

    it("closes right away when the maximum time already elapsed", () => {
      const { drawer, session } = setup({
        ui: {
          presentation: { defaultOpen: true },
          success: { minVisibleMs: 100, maxVisibleMs: 1000 },
        },
      });
      drawer.handleAuthSuccess("signIn");
      session.push({ ...SIGNED_IN, isPending: true });

      vi.advanceTimersByTime(1000);

      expect(drawer.getState().open).toBe(false);
    });

    it("cancels the close timer on destroy", () => {
      const { drawer } = setup({ ui: { presentation: { defaultOpen: true } } });
      drawer.handleAuthSuccess("signIn");
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      drawer.destroy();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("clears the success state when closed manually", () => {
      const { drawer } = setup({ ui: { presentation: { defaultOpen: true } } });
      drawer.handleAuthSuccess("signIn");

      drawer.closeDrawer();

      expect(drawer.getState().successState).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("triggers", () => {
    it("registers every trigger kind with its config while active", () => {
      const pageLoad = { delayMs: 10 };
      const { store } = setup({ triggers: { pageLoad } });

      expect(store.registered.map((entry) => entry.kind)).toEqual([
        "pageLoad",
        "click",
        "state",
        "scrollOpen",
        "idle",
        "custom",
      ]);
      expect(store.registered[0].config).toBe(pageLoad);
    });

    it("does nothing until someone subscribes and unregisters on the last unsubscribe", () => {
      const { store, drawer } = setup(undefined, { subscribe: false });
      expect(store.registered).toHaveLength(0);

      const stop = drawer.subscribe(() => undefined);
      expect(store.registered).toHaveLength(6);

      stop();
      expect(store.cleanups).toHaveBeenCalledTimes(6);
    });

    it("opens the drawer when a trigger fires", () => {
      const { drawer, store } = setup();

      store.fire("custom");

      expect(drawer.getState().open).toBe(true);
    });

    it("does not open from a trigger while authenticated", () => {
      const { drawer, store, session } = setup();
      session.push(SIGNED_IN);

      store.fire("custom");

      expect(drawer.getState().open).toBe(false);
    });

    it("emits the pageLoad event after the configured delay", () => {
      const { store } = setup({ triggers: { pageLoad: { delayMs: 250 } } });

      vi.advanceTimersByTime(249);
      expect(store.emitted).toHaveLength(0);
      vi.advanceTimersByTime(1);
      expect(store.emitted).toEqual([{ kind: "pageLoad", source: "mount" }]);
    });

    it("cancels a pending pageLoad emit when the last subscriber leaves", () => {
      const { store, drawer } = setup(
        { triggers: { pageLoad: { delayMs: 250 } } },
        { subscribe: false },
      );
      const stop = drawer.subscribe(() => undefined);

      stop();
      vi.advanceTimersByTime(500);

      expect(store.emitted).toHaveLength(0);
    });

    it("emits click events for matching targets only", () => {
      const { store } = setup({ triggers: { click: { selector: "[data-login]" } } });
      const button = document.createElement("button");
      button.setAttribute("data-login", "");
      const inner = document.createElement("span");
      button.appendChild(inner);
      const other = document.createElement("div");
      document.body.append(button, other);

      other.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(store.emitted).toHaveLength(0);

      inner.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(store.emitted).toHaveLength(1);
      expect(store.emitted[0]).toMatchObject({
        kind: "click",
        selector: "[data-login]",
        event: "click",
      });

      button.remove();
      other.remove();
    });

    it("stops listening for clicks after the last unsubscribe", () => {
      const { store, drawer } = setup(
        { triggers: { click: { selector: "[data-login]" } } },
        { subscribe: false },
      );
      const stop = drawer.subscribe(() => undefined);
      const button = document.createElement("button");
      button.setAttribute("data-login", "");
      document.body.appendChild(button);

      stop();
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(store.emitted).toHaveLength(0);
      button.remove();
    });

    it("re-registers when the triggers change through updateInputs", () => {
      const { drawer, store } = setup();
      store.registered.length = 0;

      drawer.updateInputs({ config: { triggers: { idle: { idleMs: 1000 } } } });

      expect(store.cleanups).toHaveBeenCalledTimes(6);
      expect(store.registered).toHaveLength(6);
      expect(store.registered.find((entry) => entry.kind === "idle")?.config).toEqual({
        idleMs: 1000,
      });
    });

    it("works with the real trigger store and its once policy", () => {
      const session = createPushSession(SIGNED_OUT);
      const store = createAuthTriggerStore({ namespace: "controller-test" });
      const drawer = createDrawerController({
        adapter: makeAdapter(),
        session: session.source,
        triggerStore: store,
        config: { triggers: { custom: { event: "paywall", once: true } } },
      });
      live.push(drawer);
      drawer.subscribe(() => undefined);

      store.emit({ kind: "custom", event: "paywall" });
      expect(drawer.getState().open).toBe(true);

      drawer.closeDrawer();
      store.emit({ kind: "custom", event: "paywall" });
      expect(drawer.getState().open).toBe(false);
    });
  });

  describe("escape key", () => {
    function pressEscape() {
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
      return event;
    }

    it("closes an open dismissible drawer", () => {
      const { drawer, onOpenChange } = setup({ ui: { presentation: { defaultOpen: true } } });

      pressEscape();

      expect(drawer.getState().open).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("leaves the success state alone", () => {
      const { drawer } = setup({ ui: { presentation: { defaultOpen: true } } });
      drawer.handleAuthSuccess("signIn");

      pressEscape();

      expect(drawer.getState().open).toBe(false);
      expect(drawer.getState().successState).not.toBeNull();
    });

    it("does nothing when the drawer is closed or not dismissible", () => {
      const closed = setup();
      pressEscape();
      expect(closed.onOpenChange).not.toHaveBeenCalled();

      const locked = setup({ ui: { presentation: { defaultOpen: true, dismissible: false } } });
      pressEscape();
      expect(locked.drawer.getState().open).toBe(true);
    });

    it("stops listening after the last unsubscribe", () => {
      const { drawer, onOpenChange } = setup(
        { ui: { presentation: { defaultOpen: true } } },
        { subscribe: false },
      );
      const stop = drawer.subscribe(() => undefined);
      stop();

      pressEscape();

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("motion settings", () => {
    it("applies the settings event on top of the defaults and config motion", () => {
      const { drawer } = setup({ ui: { motion: { desktopWidth: "600px" } } });

      window.dispatchEvent(
        new CustomEvent(SETTINGS_EVENT, { detail: { entryDuration: 2, desktopWidth: "300px" } }),
      );

      const { motion } = drawer.getState();
      expect(motion.entryDuration).toBe(2);
      expect(motion.desktopWidth).toBe("600px");
      expect(motion.snapStiffness).toBe(DEFAULT_CONFIG.ui.motion.snapStiffness);
    });

    it("applies settings written by another tab", () => {
      const { drawer } = setup();

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: SETTINGS_KEY,
          newValue: JSON.stringify({ entryDuration: 3 }),
        }),
      );

      expect(drawer.getState().motion.entryDuration).toBe(3);
    });

    it("ignores unrelated and malformed storage events", () => {
      const { drawer } = setup();
      const before = drawer.getState().motion;

      window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "{}" }));
      window.dispatchEvent(new StorageEvent("storage", { key: SETTINGS_KEY, newValue: "{nope" }));

      expect(drawer.getState().motion).toBe(before);
    });

    it("resets motion when the config changes", () => {
      const { drawer } = setup();
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: { entryDuration: 2 } }));

      drawer.updateInputs({ config: { ui: { motion: { entryDuration: 0.5 } } } });

      expect(drawer.getState().motion.entryDuration).toBe(0.5);
    });
  });

  describe("updateInputs", () => {
    it("re-resolves the config when the adapter changes", () => {
      const { drawer } = setup();
      expect(drawer.getState().resolved.ui.auth.allowRegister).toBe(true);

      drawer.updateInputs({ adapter: makeAdapter({ signUp: undefined }) });

      expect(drawer.getState().resolved.ui.auth.allowRegister).toBe(false);
    });

    it("follows a replaced session source", () => {
      const { drawer } = setup();
      const next = createPushSession(SIGNED_IN);

      drawer.updateInputs({ session: next.source });
      expect(drawer.getState().isAuthenticated).toBe(true);

      next.push(SIGNED_OUT);
      expect(drawer.getState().isAuthenticated).toBe(false);
    });

    it("keeps the state object when nothing relevant changed", () => {
      const { drawer } = setup();
      const before = drawer.getState();

      drawer.updateInputs({});

      expect(drawer.getState()).toBe(before);
    });
  });
});
