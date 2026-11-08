import { createRoot, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cn } from "../../src/solid/lib/cn";
import { createPresence } from "../../src/solid/lib/create-presence";
import { isSpringAtRest, resistUpwardOffset, shouldDismissDrag, stepSpring } from "../../src/solid/lib/drag-math";
import { easeToCss } from "../../src/solid/lib/ease";

const SNAP = { snapStiffness: 850, snapDamping: 14, snapMass: 0.8 };
const THRESHOLDS = { downwardThreshold: 0.25, velocityThreshold: 500 };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("easeToCss", () => {
  it("converts bezier arrays and named eases", () => {
    expect(easeToCss("[0.23,1,0.32,1]")).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
    expect(easeToCss("easeIn")).toBe("ease-in");
    expect(easeToCss("linear")).toBe("linear");
  });

  it("falls back to ease for unknown or malformed values", () => {
    expect(easeToCss("wobble")).toBe("ease");
    expect(easeToCss("[1,2,3]")).toBe("ease");
    expect(easeToCss('["a","b","c","d"]')).toBe("ease");
    expect(easeToCss("[not json")).toBe("ease");
  });
});

describe("cn", () => {
  it("lets the last conflicting utility win", () => {
    expect(cn("px-5 gap-3", false, "px-3")).toBe("gap-3 px-3");
  });
});

describe("drag math", () => {
  it("rubber-bands upward drags and never exceeds the limit", () => {
    const small = resistUpwardOffset(-50, 400, 0.15);
    const large = resistUpwardOffset(-5000, 400, 0.15);

    expect(small).toBeLessThan(0);
    expect(small).toBeGreaterThan(-50);
    expect(large).toBeGreaterThan(-400);
    expect(large).toBeLessThan(small);
  });

  it("dismisses past the distance threshold or above the velocity threshold", () => {
    expect(shouldDismissDrag(300, 0, 800, THRESHOLDS)).toBe(true);
    expect(shouldDismissDrag(100, 0, 800, THRESHOLDS)).toBe(false);
    expect(shouldDismissDrag(10, 900, 800, THRESHOLDS)).toBe(true);
    expect(shouldDismissDrag(-300, -900, 800, THRESHOLDS)).toBe(false);
  });

  it("settles a displaced spring back to rest", () => {
    let spring = { position: 120, velocity: 0 };
    let frames = 0;

    while (!isSpringAtRest(spring) && frames < 600) {
      spring = stepSpring(spring, 1 / 60, SNAP);
      frames += 1;
    }

    expect(frames).toBeLessThan(600);
    expect(Math.abs(spring.position)).toBeLessThan(0.5);
  });

  it("starts moving toward zero from a positive offset", () => {
    const next = stepSpring({ position: 100, velocity: 0 }, 1 / 60, SNAP);
    expect(next.position).toBeLessThan(100);
    expect(next.velocity).toBeLessThan(0);
  });
});

describe("createPresence", () => {
  function setup(initial: boolean, exitMs = 200) {
    return createRoot((dispose) => {
      const [when, setWhen] = createSignal(initial);
      const presence = createPresence(when, exitMs);
      return { presence, setWhen, dispose };
    });
  }

  it("starts present when initially true and absent when initially false", () => {
    expect(setup(true).presence.present()).toBe(true);
    expect(setup(false).presence.present()).toBe(false);
  });

  it("mounts immediately and keeps content for the exit duration", () => {
    vi.useFakeTimers();
    const { presence, setWhen } = setup(false);

    setWhen(true);
    expect(presence.present()).toBe(true);
    expect(presence.state()).toBe("open");

    setWhen(false);
    expect(presence.present()).toBe(true);
    expect(presence.state()).toBe("closing");

    vi.advanceTimersByTime(199);
    expect(presence.present()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(presence.present()).toBe(false);
    expect(presence.state()).toBe("open");
  });

  it("cancels the exit when reopened during it", () => {
    vi.useFakeTimers();
    const { presence, setWhen } = setup(true);

    setWhen(false);
    vi.advanceTimersByTime(100);
    setWhen(true);
    vi.advanceTimersByTime(500);

    expect(presence.present()).toBe(true);
    expect(presence.state()).toBe("open");
  });

  it("unmounts immediately under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { presence, setWhen } = setup(true);

    setWhen(false);

    expect(presence.present()).toBe(false);
  });

  it("clears its timer on dispose", () => {
    vi.useFakeTimers();
    const { presence, setWhen, dispose } = setup(true);

    setWhen(false);
    dispose();
    vi.advanceTimersByTime(500);

    expect(presence.present()).toBe(true);
  });
});
