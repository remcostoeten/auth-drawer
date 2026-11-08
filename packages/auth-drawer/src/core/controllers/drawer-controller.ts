import { getAuthSuccessCloseDelay, type AuthSuccessState } from "../auth-success";
import { DEFAULT_CONFIG } from "../config";
import { SETTINGS_EVENT, SETTINGS_KEY } from "../constants";
import { resolveAuthConfig } from "../resolve-config";
import { createSubscribers, type Controller } from "../store";
import { createAuthTriggerStore } from "../triggers/create-auth-trigger-store";
import type {
  AuthAdapter,
  AuthConfig,
  AuthSuccessAction,
  AuthTriggerStore,
  MotionSettings,
  ResolvedAuthConfig,
  SessionSource,
} from "../types";

export type OpenBinding = {
  get: () => boolean;
  set: (next: boolean) => void;
};

export type DrawerControllerOptions<Node = unknown> = {
  adapter: AuthAdapter;
  config?: AuthConfig<Node>;
  session: SessionSource;
  triggerStore?: AuthTriggerStore;
  /**
   * Binds the open state to an external owner. `get` is read live and `set` receives every
   * requested change. Without it the controller keeps the open state itself.
   */
  open?: OpenBinding;
  /** Initial open state when `open` is not bound. Falls back to `ui.presentation.defaultOpen`. */
  defaultOpen?: boolean;
  /** Called on every requested change when `open` is not bound. */
  onOpenChange?: (open: boolean) => void;
};

export type DrawerState<Node = unknown> = {
  open: boolean;
  successState: AuthSuccessState | null;
  motion: MotionSettings;
  resolved: ResolvedAuthConfig<Node>;
  formConfig: ResolvedAuthConfig<Node>;
  isAuthenticated: boolean;
  dismissible: boolean;
};

export type DrawerController<Node = unknown> = Controller<DrawerState<Node>> & {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  handleAuthSuccess: (action: AuthSuccessAction) => void;
  syncOpen: () => void;
  updateInputs: (inputs: Partial<DrawerControllerOptions<Node>>) => void;
};

type Effect = {
  deps: readonly unknown[];
  cleanup: (() => void) | void;
};

function sameDeps(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}

function isSettingsEvent(event: Event): event is CustomEvent<Partial<MotionSettings>> {
  return "detail" in event;
}

function withoutFooter<Node>(resolved: ResolvedAuthConfig<Node>): ResolvedAuthConfig<Node> {
  return {
    ...resolved,
    ui: {
      ...resolved.ui,
      auth: { ...resolved.ui.auth, showFooter: false },
      footer: undefined,
    },
  };
}

/**
 * @name createDrawerController
 * @description Framework-free controller for the auth surface: resolved config, open state
 * (controlled through an `open` binding or kept internally), the success state machine with its
 * close timer, trigger registration, Escape dismissal and live motion-settings updates. Side
 * effects run only while the controller has a subscriber. Opening is ignored while the session is
 * authenticated.
 *
 * @example
 * const drawer = createDrawerController({ adapter, config, session: adapter.session });
 * const stop = drawer.subscribe(() => render(drawer.getState()));
 * drawer.openDrawer();
 */
export function createDrawerController<Node = unknown>(
  options: DrawerControllerOptions<Node>,
): DrawerController<Node> {
  let inputs = options;
  let resolved = resolveAuthConfig(inputs.config, inputs.adapter);
  let sessionSnapshot = inputs.session.getSnapshot();
  let internalOpen = inputs.defaultOpen ?? resolved.ui.presentation.defaultOpen;
  let motion = resolved.ui.motion;
  let successState: AuthSuccessState | null = null;
  let ownTriggerStore: AuthTriggerStore | null = null;
  let stopSession: (() => void) | null = null;
  let successTimer: ReturnType<typeof setTimeout> | null = null;
  const effects = new Map<string, Effect>();
  let formConfigCache: {
    resolved: ResolvedAuthConfig<Node>;
    value: ResolvedAuthConfig<Node>;
  } | null = null;

  const subscribers = createSubscribers({
    onActive() {
      stopSession = inputs.session.subscribe(handleSessionChange);
      refresh();
      syncEffects();
      scheduleSuccessClose();

      return () => {
        stopSession?.();
        stopSession = null;
        stopEffects();
        clearSuccessTimer();
      };
    },
  });

  let state: DrawerState<Node> = buildState();

  function readOpen() {
    return inputs.open ? inputs.open.get() : internalOpen;
  }

  function formConfigFor(): ResolvedAuthConfig<Node> {
    if (!successState) return resolved;
    if (formConfigCache?.resolved === resolved) return formConfigCache.value;
    formConfigCache = { resolved, value: withoutFooter(resolved) };
    return formConfigCache.value;
  }

  function buildState(): DrawerState<Node> {
    return {
      open: readOpen(),
      successState,
      motion,
      resolved,
      formConfig: formConfigFor(),
      isAuthenticated: Boolean(sessionSnapshot.data?.user),
      dismissible: resolved.ui.presentation.dismissible,
    };
  }

  function refresh() {
    sessionSnapshot = inputs.session.getSnapshot();
    const next = buildState();
    if (sameState(state, next)) return;
    state = next;
  }

  function publish() {
    refresh();
    subscribers.emit();
  }

  function handleSessionChange() {
    refresh();
    scheduleSuccessClose();
    subscribers.emit();
  }

  function getState() {
    refresh();
    return state;
  }

  function triggerStore() {
    if (inputs.triggerStore) return inputs.triggerStore;
    ownTriggerStore ??= createAuthTriggerStore();
    return ownTriggerStore;
  }

  function syncOpen() {
    if (subscribers.isDestroyed()) return;
    publish();
  }

  function setOpen(next: boolean) {
    if (inputs.open) {
      inputs.open.set(next);
    } else {
      internalOpen = next;
      inputs.onOpenChange?.(next);
    }
  }

  function closeDrawer() {
    successState = null;
    clearSuccessTimer();
    setOpen(false);
    publish();
  }

  function openIfAllowed() {
    if (getState().isAuthenticated) return;
    setOpen(true);
    syncOpen();
  }

  function toggleDrawer() {
    if (readOpen()) {
      closeDrawer();
      return;
    }
    openIfAllowed();
  }

  function handleAuthSuccess(action: AuthSuccessAction) {
    if (!resolved.ui.success.enabled) {
      closeDrawer();
      return;
    }

    successState = { action, startedAt: Date.now() };
    publish();
    scheduleSuccessClose();
  }

  function clearSuccessTimer() {
    if (successTimer === null) return;
    clearTimeout(successTimer);
    successTimer = null;
  }

  function scheduleSuccessClose() {
    clearSuccessTimer();
    if (!subscribers.isActive() || !successState || !resolved.ui.success.enabled) return;

    const delay = getAuthSuccessCloseDelay({
      success: successState,
      config: resolved.ui.success,
      now: Date.now(),
      isAuthenticated: state.isAuthenticated,
      isSessionPending: sessionSnapshot.isPending,
    });

    if (delay === null) return;

    if (delay === 0) {
      closeDrawer();
      return;
    }

    successTimer = setTimeout(() => {
      successTimer = null;
      closeDrawer();
    }, delay);
  }

  function runEffect(name: string, deps: readonly unknown[], setup: () => (() => void) | void) {
    const previous = effects.get(name);
    if (previous && sameDeps(previous.deps, deps)) return;
    if (previous?.cleanup) previous.cleanup();
    effects.set(name, { deps, cleanup: setup() });
  }

  function stopEffects() {
    for (const effect of effects.values()) {
      if (effect.cleanup) effect.cleanup();
    }
    effects.clear();
  }

  function registerTriggers() {
    const store = triggerStore();
    const { triggers } = resolved;
    const cleanups = [
      store.registerTrigger("pageLoad", triggers.pageLoad, openIfAllowed),
      store.registerTrigger("click", triggers.click, openIfAllowed),
      store.registerTrigger("state", triggers.state, openIfAllowed),
      store.registerTrigger("scrollOpen", triggers.scrollOpen, openIfAllowed),
      store.registerTrigger("idle", triggers.idle, openIfAllowed),
      store.registerTrigger("custom", triggers.custom, openIfAllowed),
    ];

    return () => cleanups.forEach((cleanup) => cleanup());
  }

  function schedulePageLoad() {
    const pageLoad = resolved.triggers.pageLoad;
    if (!pageLoad) return;

    const store = triggerStore();
    const timer = setTimeout(() => {
      store.emit({ kind: "pageLoad", source: "mount" });
    }, pageLoad.delayMs ?? 0);

    return () => clearTimeout(timer);
  }

  function listenForClicks() {
    const click = resolved.triggers.click;
    if (!click?.selector || typeof document === "undefined") return;

    const store = triggerStore();
    const selector = click.selector;
    const eventName = click.event ?? "click";

    function handleClick(event: Event) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(selector)) return;

      store.emit({ kind: "click", selector, event: eventName, target: event.target });
    }

    document.addEventListener(eventName, handleClick);

    return () => document.removeEventListener(eventName, handleClick);
  }

  function applySettings(settings: Partial<MotionSettings>) {
    motion = {
      ...DEFAULT_CONFIG.ui.motion,
      ...settings,
      ...inputs.config?.ui?.motion,
    };
    publish();
  }

  function listenForSettings() {
    if (typeof window === "undefined") return;

    function handleUpdate(event: Event) {
      if (!isSettingsEvent(event)) return;
      applySettings(event.detail);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== SETTINGS_KEY || !event.newValue) return;

      try {
        applySettings(JSON.parse(event.newValue) as Partial<MotionSettings>);
      } catch {
        return;
      }
    }

    window.addEventListener(SETTINGS_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }

  function listenForEscape() {
    if (typeof document === "undefined") return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (!readOpen() || !state.dismissible) return;

      event.stopPropagation();
      setOpen(false);
      syncOpen();
    }

    document.addEventListener("keydown", handleKeydown);

    return () => document.removeEventListener("keydown", handleKeydown);
  }

  function syncEffects() {
    if (!subscribers.isActive()) return;

    const store = triggerStore();
    runEffect("triggers", [resolved.triggers, store], registerTriggers);
    runEffect("pageLoad", [resolved.triggers.pageLoad, store], schedulePageLoad);
    runEffect("click", [resolved.triggers.click, store], listenForClicks);
    runEffect("settings", [], listenForSettings);
    runEffect("escape", [], listenForEscape);
  }

  function updateInputs(next: Partial<DrawerControllerOptions<Node>>) {
    if (subscribers.isDestroyed()) return;

    const previous = inputs;
    inputs = { ...inputs, ...next };

    if (inputs.config !== previous.config || inputs.adapter !== previous.adapter) {
      resolved = resolveAuthConfig(inputs.config, inputs.adapter);
      motion = resolved.ui.motion;
    }

    if (inputs.session !== previous.session) {
      if (stopSession) {
        stopSession();
        stopSession = inputs.session.subscribe(handleSessionChange);
      }
    }

    refresh();
    syncEffects();
    scheduleSuccessClose();
    publish();
  }

  function destroy() {
    clearSuccessTimer();
    subscribers.destroy();
  }

  return {
    getState,
    subscribe: subscribers.subscribe,
    destroy,
    openDrawer: openIfAllowed,
    closeDrawer,
    toggleDrawer,
    handleAuthSuccess,
    syncOpen,
    updateInputs,
  };
}

function sameState<Node>(a: DrawerState<Node>, b: DrawerState<Node>) {
  return (
    a.open === b.open &&
    a.successState === b.successState &&
    a.motion === b.motion &&
    a.resolved === b.resolved &&
    a.formConfig === b.formConfig &&
    a.isAuthenticated === b.isAuthenticated &&
    a.dismissible === b.dismissible
  );
}
