import { describe, expect, it, vi } from "vitest";
import { createAuthTriggerStore } from "./create-auth-trigger-store";

function makeStore(opts?: Parameters<typeof createAuthTriggerStore>[0]) {
  return createAuthTriggerStore({ namespace: "test", ...opts });
}

describe("createAuthTriggerStore — once policy", () => {
  it("fires the first time and never again", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { once: true }, handler);

    store.emit({ kind: "pageLoad" });
    store.emit({ kind: "pageLoad" });
    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires without restriction when once is false", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { once: false }, handler);

    store.emit({ kind: "pageLoad" });
    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe("createAuthTriggerStore — cooldownMs policy", () => {
  it("suppresses events fired within the cooldown window", () => {
    let fakeNow = 0;
    const store = makeStore({ now: () => fakeNow });
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { cooldownMs: 1000 }, handler);

    store.emit({ kind: "pageLoad" });
    fakeNow = 500;
    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("allows a second fire after the cooldown elapses", () => {
    let fakeNow = 0;
    const store = makeStore({ now: () => fakeNow });
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { cooldownMs: 1000 }, handler);

    store.emit({ kind: "pageLoad" });
    fakeNow = 1001;
    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe("createAuthTriggerStore — every policy", () => {
  it("fires every N-th event", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { every: 3 }, handler);

    for (let i = 0; i < 9; i++) store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(3);
  });
});

describe("createAuthTriggerStore — sampleRate policy", () => {
  it("fires when random() is below the sample rate", () => {
    const store = makeStore({ random: () => 0.2 });
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { sampleRate: 0.5 }, handler);

    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("suppresses when random() is above the sample rate", () => {
    const store = makeStore({ random: () => 0.9 });
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { sampleRate: 0.5 }, handler);

    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(0);
  });
});

describe("createAuthTriggerStore — scope", () => {
  it("shares state across registrations with the same install scope", () => {
    const storage: Record<string, string> = {};
    const shared = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
    };

    const store1 = makeStore({ storage: shared });
    const store2 = makeStore({ storage: shared });

    const h1 = vi.fn();
    const h2 = vi.fn();

    store1.registerTrigger("pageLoad", { once: true, scope: "install" }, h1);
    store1.emit({ kind: "pageLoad" });

    store2.registerTrigger("pageLoad", { once: true, scope: "install" }, h2);
    store2.emit({ kind: "pageLoad" });

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(0);
  });
});

describe("createAuthTriggerStore — event matching", () => {
  it("routes click events to matching selector registrations", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("click", { selector: "#cta" }, handler);

    const el = document.createElement("button");
    el.id = "cta";
    document.body.appendChild(el);

    store.emit({ kind: "click", target: el });
    document.body.removeChild(el);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not route clicks that miss the selector", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("click", { selector: "#cta" }, handler);

    const el = document.createElement("button");
    el.id = "other";
    document.body.appendChild(el);

    store.emit({ kind: "click", target: el });
    document.body.removeChild(el);

    expect(handler).toHaveBeenCalledTimes(0);
  });

  it("routes scrollOpen when progress meets threshold", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("scrollOpen", { threshold: 0.5 }, handler);

    store.emit({ kind: "scrollOpen", progress: 0.3 });
    store.emit({ kind: "scrollOpen", progress: 0.7 });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("createAuthTriggerStore — clear and snapshot", () => {
  it("snapshot reflects seen and fire counts", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("pageLoad", {}, handler);

    store.emit({ kind: "pageLoad" });
    store.emit({ kind: "pageLoad" });

    const snap = store.snapshot();
    const key = Object.keys(snap.fireCounts)[0];
    expect(snap.seenCounts[key]).toBe(2);
    expect(snap.fireCounts[key]).toBe(2);
  });

  it("clear resets all counters", () => {
    const store = makeStore();
    const handler = vi.fn();
    store.registerTrigger("pageLoad", { once: true }, handler);

    store.emit({ kind: "pageLoad" });
    store.clear();
    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("unregistering stops the handler from receiving events", () => {
    const store = makeStore();
    const handler = vi.fn();
    const unregister = store.registerTrigger("pageLoad", {}, handler);

    store.emit({ kind: "pageLoad" });
    unregister();
    store.emit({ kind: "pageLoad" });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
