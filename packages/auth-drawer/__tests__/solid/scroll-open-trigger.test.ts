import { createRoot, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createScrollOpenTrigger } from "../../src/solid";

function createScroller(scrollTop: number) {
  const element = document.createElement("div");
  Object.defineProperty(element, "scrollHeight", { value: 1000, configurable: true });
  Object.defineProperty(element, "clientHeight", { value: 500, configurable: true });
  element.scrollTop = scrollTop;
  return element;
}

async function frame() {
  await vi.advanceTimersByTimeAsync(20);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createScrollOpenTrigger", () => {
  it("fires once when progress reaches the default threshold", async () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const element = createScroller(100);
    createRoot(() => createScrollOpenTrigger({ container: () => element, onTrigger }));

    await frame();
    expect(onTrigger).not.toHaveBeenCalled();

    element.scrollTop = 200;
    element.dispatchEvent(new Event("scroll"));
    await frame();
    expect(onTrigger).toHaveBeenCalledWith(0.4);

    element.scrollTop = 400;
    element.dispatchEvent(new Event("scroll"));
    await frame();
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("fires on every crossing when once is false", async () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const element = createScroller(400);
    createRoot(() => createScrollOpenTrigger({ container: () => element, onTrigger, once: false }));

    await frame();
    element.dispatchEvent(new Event("scroll"));
    await frame();

    expect(onTrigger).toHaveBeenCalledTimes(2);
  });

  it("does nothing while disabled and starts when enabled", async () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const element = createScroller(400);
    const [enabled, setEnabled] = createSignal(false);
    createRoot(() => createScrollOpenTrigger({ container: () => element, onTrigger, enabled }));

    await frame();
    expect(onTrigger).not.toHaveBeenCalled();

    setEnabled(true);
    await frame();
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("waits for the container accessor to resolve", async () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const [container, setContainer] = createSignal<HTMLElement>();
    createRoot(() => createScrollOpenTrigger({ container, onTrigger, threshold: 0.5 }));

    await frame();
    setContainer(createScroller(500));
    await frame();

    expect(onTrigger).toHaveBeenCalledWith(1);
  });

  it("removes its listeners on dispose", async () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const element = createScroller(0);
    const dispose = createRoot((disposeRoot) => {
      createScrollOpenTrigger({ container: () => element, onTrigger });
      return disposeRoot;
    });

    await frame();
    dispose();
    element.scrollTop = 500;
    element.dispatchEvent(new Event("scroll"));
    await frame();

    expect(onTrigger).not.toHaveBeenCalled();
  });
});
