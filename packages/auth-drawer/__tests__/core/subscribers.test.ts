import { describe, expect, it, vi } from "vitest";
import { createSubscribers } from "../../src/core";

describe("createSubscribers", () => {
  it("activates on the first listener and releases on the last", () => {
    const release = vi.fn();
    const onActive = vi.fn(() => release);
    const subscribers = createSubscribers({ onActive });

    const first = subscribers.subscribe(() => undefined);
    const second = subscribers.subscribe(() => undefined);
    expect(onActive).toHaveBeenCalledTimes(1);
    expect(subscribers.isActive()).toBe(true);

    first();
    first();
    expect(release).not.toHaveBeenCalled();
    second();
    expect(release).toHaveBeenCalledTimes(1);
    expect(subscribers.isActive()).toBe(false);
  });

  it("emits to every listener", () => {
    const subscribers = createSubscribers();
    const a = vi.fn();
    const b = vi.fn();
    subscribers.subscribe(a);
    subscribers.subscribe(b);

    subscribers.emit();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("releases and rejects new listeners after destroy", () => {
    const release = vi.fn();
    const subscribers = createSubscribers({ onActive: () => release });
    const listener = vi.fn();
    subscribers.subscribe(listener);

    subscribers.destroy();
    subscribers.emit();
    subscribers.subscribe(listener);

    expect(release).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
    expect(subscribers.isDestroyed()).toBe(true);
    expect(subscribers.isActive()).toBe(false);
  });
});
