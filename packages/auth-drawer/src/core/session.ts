import type { AuthSessionState, SessionSnapshot, SessionSource } from "./types";

export type SessionFetchResult = {
  data: AuthSessionState | null;
  error: unknown;
};

export type SessionFetch = () => Promise<SessionFetchResult>;

export type SessionStore = {
  source: SessionSource;
  refresh: () => void;
};

export type PushSession = {
  source: SessionSource;
  push: (snapshot: SessionSnapshot) => void;
};

export const SIGNED_OUT_SNAPSHOT: SessionSnapshot = {
  data: null,
  isPending: false,
  error: null,
};

/**
 * Session source that is never authenticated and never pending.
 */
export const STATIC_SESSION: SessionSource = {
  getSnapshot: () => SIGNED_OUT_SNAPSHOT,
  subscribe: () => () => undefined,
};

/**
 * @name sessionOf
 * @description Returns the adapter's session source, or the static signed-out source for
 * adapters written before `session` existed.
 *
 * @example
 * const snapshot = sessionOf(adapter).getSnapshot();
 */
export function sessionOf(adapter: { session?: SessionSource }): SessionSource {
  return adapter.session ?? STATIC_SESSION;
}

function sameSnapshot(a: SessionSnapshot, b: SessionSnapshot) {
  return a.data === b.data && a.isPending === b.isPending && a.error === b.error;
}

/**
 * @name createSessionStore
 * @description Builds a session source from an async fetcher. The first subscriber starts a
 * fetch, `refresh()` re-fetches while anyone is subscribed, and a window `focus` event
 * revalidates while anyone is subscribed. The snapshot object only changes when the data,
 * pending flag or error change.
 *
 * @example
 * const { source, refresh } = createSessionStore(async () => ({ data: await loadSession(), error: null }));
 * source.subscribe(() => render(source.getSnapshot()));
 * refresh();
 */
export function createSessionStore(fetchSession: SessionFetch): SessionStore {
  const listeners = new Set<() => void>();
  let snapshot: SessionSnapshot = { data: null, isPending: true, error: null };
  let requestId = 0;

  function publish(next: SessionSnapshot) {
    if (sameSnapshot(snapshot, next)) return;
    snapshot = next;
    for (const listener of Array.from(listeners)) listener();
  }

  function load() {
    const current = ++requestId;
    fetchSession().then((result) => {
      if (current !== requestId || listeners.size === 0) return;
      publish({ data: result.data, isPending: false, error: result.error });
    });
  }

  function refresh() {
    if (listeners.size > 0) load();
  }

  function handleFocus() {
    load();
  }

  function subscribe(listener: () => void) {
    const wasEmpty = listeners.size === 0;
    listeners.add(listener);

    if (wasEmpty) {
      if (typeof window !== "undefined") window.addEventListener("focus", handleFocus);
      load();
    }

    return () => {
      if (!listeners.delete(listener)) return;
      if (listeners.size > 0) return;
      requestId++;
      if (typeof window !== "undefined") window.removeEventListener("focus", handleFocus);
    };
  }

  return { source: { getSnapshot: () => snapshot, subscribe }, refresh };
}

/**
 * @name createPushSession
 * @description Session source whose value is pushed in from outside, for bridging a framework
 * hook or signal into code that expects a `SessionSource`. Pushing an equal snapshot is a no-op.
 *
 * @example
 * const { source, push } = createPushSession(initial);
 * push({ data: user, isPending: false, error: null });
 */
export function createPushSession(initial: SessionSnapshot): PushSession {
  const listeners = new Set<() => void>();
  let snapshot = initial;

  function push(next: SessionSnapshot) {
    if (sameSnapshot(snapshot, next)) return;
    snapshot = next;
    for (const listener of Array.from(listeners)) listener();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return { source: { getSnapshot: () => snapshot, subscribe }, push };
}

export type SessionPatch = Partial<SessionSnapshot>;

/**
 * @name createSubscriptionSession
 * @description Session source backed by an SDK that pushes auth changes. `start` runs when the
 * first listener subscribes and receives a `set` function; whatever it returns runs when the last
 * listener leaves. `readInitial` is evaluated once, on first access.
 *
 * @example
 * const source = createSubscriptionSession(
 *   () => ({ data: null, isPending: true, error: null }),
 *   (set) => sdk.onChange((user) => set({ data: user, isPending: false })),
 * );
 */
export function createSubscriptionSession(
  readInitial: () => SessionSnapshot,
  start: (set: (patch: SessionPatch) => void) => (() => void) | void,
): SessionSource {
  const listeners = new Set<() => void>();
  let snapshot: SessionSnapshot | null = null;
  let stop: (() => void) | void;
  let running = false;

  function current() {
    snapshot ??= readInitial();
    return snapshot;
  }

  function set(patch: SessionPatch) {
    if (!running) return;
    const next = { ...current(), ...patch };
    if (sameSnapshot(current(), next)) return;
    snapshot = next;
    for (const listener of Array.from(listeners)) listener();
  }

  function subscribe(listener: () => void) {
    const wasEmpty = listeners.size === 0;
    listeners.add(listener);

    if (wasEmpty) {
      running = true;
      current();
      stop = start(set);
    }

    return () => {
      if (!listeners.delete(listener)) return;
      if (listeners.size > 0) return;
      running = false;
      const cleanup = stop;
      stop = undefined;
      if (cleanup) cleanup();
    };
  }

  return { getSnapshot: current, subscribe };
}
