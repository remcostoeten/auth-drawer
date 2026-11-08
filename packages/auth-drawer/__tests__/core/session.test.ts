import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STATIC_SESSION,
  createPushSession,
  createSessionStore,
  createSubscriptionSession,
  sessionOf,
} from "../../src/core";
import { SIGNED_IN, SIGNED_OUT, deferred } from "./helpers";

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("createSessionStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not fetch until the first subscriber arrives", () => {
    const fetchSession = vi.fn(async () => ({ data: null, error: null }));
    const { source } = createSessionStore(fetchSession);

    expect(fetchSession).not.toHaveBeenCalled();
    expect(source.getSnapshot()).toEqual({ data: null, isPending: true, error: null });

    source.subscribe(() => undefined);
    expect(fetchSession).toHaveBeenCalledTimes(1);
  });

  it("publishes the fetched session and settles isPending", async () => {
    const { source } = createSessionStore(async () => ({ data: SIGNED_IN.data, error: null }));
    const listener = vi.fn();
    source.subscribe(listener);

    await flush();

    expect(source.getSnapshot().data?.user?.id).toBe("1");
    expect(source.getSnapshot().isPending).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns the same snapshot object until something changes", async () => {
    const { source, refresh } = createSessionStore(async () => ({ data: null, error: null }));
    source.subscribe(() => undefined);
    await flush();

    const first = source.getSnapshot();
    expect(source.getSnapshot()).toBe(first);

    refresh();
    await flush();
    expect(source.getSnapshot()).toBe(first);
  });

  it("refetches on refresh while subscribed and ignores refresh with no subscribers", async () => {
    let authenticated = false;
    const fetchSession = vi.fn(async () => ({
      data: authenticated ? SIGNED_IN.data : null,
      error: null,
    }));
    const { source, refresh } = createSessionStore(fetchSession);

    refresh();
    expect(fetchSession).not.toHaveBeenCalled();

    const stop = source.subscribe(() => undefined);
    await flush();
    expect(source.getSnapshot().data).toBeNull();

    authenticated = true;
    refresh();
    await flush();
    expect(source.getSnapshot().data?.user?.id).toBe("1");

    stop();
    refresh();
    expect(fetchSession).toHaveBeenCalledTimes(2);
  });

  it("revalidates when the window regains focus and stops after the last unsubscribe", async () => {
    const fetchSession = vi.fn(async () => ({ data: null, error: null }));
    const { source } = createSessionStore(fetchSession);
    const stop = source.subscribe(() => undefined);
    await flush();

    window.dispatchEvent(new Event("focus"));
    expect(fetchSession).toHaveBeenCalledTimes(2);

    stop();
    window.dispatchEvent(new Event("focus"));
    expect(fetchSession).toHaveBeenCalledTimes(2);
  });

  it("drops a response that arrives after every subscriber left", async () => {
    const pending = deferred<{ data: typeof SIGNED_IN.data; error: unknown }>();
    const { source } = createSessionStore(() => pending.promise);
    const stop = source.subscribe(() => undefined);
    stop();

    pending.resolve({ data: SIGNED_IN.data, error: null });
    await flush();

    expect(source.getSnapshot().isPending).toBe(true);
  });

  it("keeps the latest response when requests overlap", async () => {
    const first = deferred<{ data: typeof SIGNED_IN.data; error: unknown }>();
    const second = deferred<{ data: typeof SIGNED_IN.data; error: unknown }>();
    const responses = [first, second];
    const { source, refresh } = createSessionStore(() => responses.shift()!.promise);
    source.subscribe(() => undefined);
    refresh();

    second.resolve({ data: SIGNED_IN.data, error: null });
    await flush();
    first.resolve({ data: null, error: null });
    await flush();

    expect(source.getSnapshot().data?.user?.id).toBe("1");
  });

  it("surfaces fetch errors in the snapshot", async () => {
    const boom = new Error("boom");
    const { source } = createSessionStore(async () => ({ data: null, error: boom }));
    source.subscribe(() => undefined);
    await flush();

    expect(source.getSnapshot().error).toBe(boom);
  });
});

describe("createPushSession", () => {
  it("notifies on a changed snapshot and ignores an equal one", () => {
    const { source, push } = createPushSession(SIGNED_OUT);
    const listener = vi.fn();
    source.subscribe(listener);

    push({ ...SIGNED_OUT });
    expect(listener).not.toHaveBeenCalled();

    push(SIGNED_IN);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(source.getSnapshot()).toBe(SIGNED_IN);
  });
});

describe("createSubscriptionSession", () => {
  it("starts on the first listener and stops on the last", () => {
    const stop = vi.fn();
    const start = vi.fn(() => stop);
    const source = createSubscriptionSession(() => SIGNED_OUT, start);

    const first = source.subscribe(() => undefined);
    const second = source.subscribe(() => undefined);
    expect(start).toHaveBeenCalledTimes(1);

    first();
    expect(stop).not.toHaveBeenCalled();
    second();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("applies patches pushed by the SDK", () => {
    let push: (patch: { data?: typeof SIGNED_IN.data; isPending?: boolean }) => void = () =>
      undefined;
    const source = createSubscriptionSession(
      () => ({ data: null, isPending: true, error: null }),
      (set) => {
        push = set;
      },
    );
    const listener = vi.fn();
    source.subscribe(listener);

    push({ data: SIGNED_IN.data, isPending: false });

    expect(source.getSnapshot().data?.user?.id).toBe("1");
    expect(source.getSnapshot().isPending).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("sessionOf", () => {
  it("falls back to the static source for adapters without a session", () => {
    expect(sessionOf({})).toBe(STATIC_SESSION);
    expect(STATIC_SESSION.getSnapshot()).toEqual(SIGNED_OUT);
  });
});
