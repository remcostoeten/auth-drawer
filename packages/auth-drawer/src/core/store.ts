/**
 * Shape shared by every controller: an immutable state snapshot that is replaced on each change,
 * a subscription, and a terminal `destroy`. Side effects such as timers, DOM listeners and session
 * subscriptions run only while at least one listener is subscribed.
 */
export type Controller<State> = {
  getState: () => State;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
};

type Lifecycle = {
  onActive: () => (() => void) | void;
};

export type Subscribers = {
  subscribe: (listener: () => void) => () => void;
  emit: () => void;
  isActive: () => boolean;
  isDestroyed: () => boolean;
  destroy: () => void;
};

/**
 * @name createSubscribers
 * @description Listener bookkeeping with an activation lifecycle. `onActive` runs when the first listener
 * subscribes and the function it returns runs when the last one leaves or the owner is
 * destroyed.
 *
 * @example
 * const subscribers = createSubscribers({ onActive: () => startTimers() });
 */
export function createSubscribers(lifecycle?: Lifecycle): Subscribers {
  const listeners = new Set<() => void>();
  let deactivate: (() => void) | void;
  let active = false;
  let destroyed = false;

  function release() {
    active = false;
    const stop = deactivate;
    deactivate = undefined;
    if (stop) stop();
  }

  function subscribe(listener: () => void) {
    if (destroyed) return () => undefined;

    const wasEmpty = listeners.size === 0;
    listeners.add(listener);
    if (wasEmpty) {
      active = true;
      deactivate = lifecycle?.onActive();
    }

    return () => {
      if (!listeners.delete(listener)) return;
      if (listeners.size === 0 && active) release();
    };
  }

  function emit() {
    for (const listener of Array.from(listeners)) listener();
  }

  function destroy() {
    destroyed = true;
    listeners.clear();
    if (active) release();
  }

  return { subscribe, emit, isActive: () => active, isDestroyed: () => destroyed, destroy };
}
