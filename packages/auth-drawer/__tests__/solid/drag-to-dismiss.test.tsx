import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthDrawer } from "../../src/solid";
import { createTestAdapter, dialog } from "./helpers";

function pointer(type: string, target: EventTarget, clientY: number, time: number) {
  const event = new MouseEvent(type, { bubbles: true, clientY, button: 0 });
  Object.defineProperty(event, "timeStamp", { value: time });
  target.dispatchEvent(event);
}

function renderOpen(onOpenChange = vi.fn(), config = {}) {
  render(() => (
    <AuthDrawer adapter={createTestAdapter()} hideTrigger open onOpenChange={onOpenChange} config={config} />
  ));
  return onOpenChange;
}

function panel() {
  const element = dialog();
  if (!(element instanceof HTMLElement)) throw new Error("dialog missing");
  return element;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("drag to dismiss", () => {
  it("follows the pointer downward", () => {
    renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 160, 100);

    expect(panel().style.translate).toBe("0 60px");
    expect(panel().className).toContain("select-none");
  });

  it("closes when released past the distance threshold", () => {
    const onOpenChange = renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 400, 1000);
    pointer("pointerup", window, 400, 1000);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes on a fast downward fling even over a short distance", () => {
    const onOpenChange = renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 140, 20);
    pointer("pointerup", window, 140, 40);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("springs back when released early and slowly", async () => {
    vi.useFakeTimers();
    const onOpenChange = renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 150, 1000);
    pointer("pointerup", window, 150, 2000);
    expect(onOpenChange).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);

    expect(panel().style.translate).toBe("0 0px");
    expect(panel().className).not.toContain("select-none");
  });

  it("rubber-bands an upward drag and springs back without closing", async () => {
    vi.useFakeTimers();
    const onOpenChange = renderOpen();

    pointer("pointerdown", panel(), 400, 0);
    pointer("pointermove", window, 100, 1000);
    const offset = Number.parseFloat(panel().style.translate.split(" ")[1] ?? "0");
    expect(offset).toBeLessThan(0);
    expect(offset).toBeGreaterThan(-300);

    pointer("pointerup", window, 100, 2000);
    await vi.advanceTimersByTimeAsync(1500);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(panel().style.translate).toBe("0 0px");
  });

  it("ignores movement below the start distance", () => {
    renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 102, 50);

    expect(panel().style.translate).toBe("0 0px");
  });

  it("does not start from interactive elements", () => {
    renderOpen();
    const input = document.body.querySelector("input");

    pointer("pointerdown", input as HTMLInputElement, 100, 0);
    pointer("pointermove", window, 400, 1000);

    expect(panel().style.translate).toBe("0 0px");
  });

  it("is disabled when the drawer is not dismissible", () => {
    const onOpenChange = renderOpen(vi.fn(), { ui: { presentation: { dismissible: false } } });

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 400, 1000);
    pointer("pointerup", window, 400, 1000);

    expect(panel().style.translate).toBe("0 0px");
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("stops listening after release", () => {
    renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointerup", window, 100, 10);
    pointer("pointermove", window, 300, 1000);

    expect(panel().style.translate).toBe("0 0px");
  });

  it("snaps back immediately under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    renderOpen();

    pointer("pointerdown", panel(), 100, 0);
    pointer("pointermove", window, 150, 1000);
    pointer("pointerup", window, 150, 2000);

    expect(panel().style.translate).toBe("0 0px");
    vi.unstubAllGlobals();
  });

  it("shows the drag handle only for the dismissible drawer variant", () => {
    renderOpen();
    expect(panel().querySelector(".cursor-grab")).toBeTruthy();
  });
});
