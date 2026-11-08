import { createSignal, onCleanup, type Accessor } from "solid-js";
import { UPWARD_LIMIT, type MotionSettings } from "@remcostoeten/auth-drawer/core";
import {
  isSpringAtRest,
  resistUpwardOffset,
  shouldDismissDrag,
  stepSpring,
  type Spring,
} from "./drag-math";
import { prefersReducedMotion } from "./prefers-reduced-motion";

type Options = {
  onClose: () => void;
  enabled: Accessor<boolean>;
  settings: Accessor<MotionSettings>;
};

type Sample = { time: number; y: number };

const DRAG_START_DISTANCE = 4;
const VELOCITY_WINDOW_MS = 100;
const MAX_FRAME_SECONDS = 1 / 30;
const INTERACTIVE = "input, textarea, select, button, a, label, [contenteditable='true']";

function viewportHeight() {
  return typeof window === "undefined" ? 800 : window.innerHeight;
}

function isInteractive(target: EventTarget | null) {
  return target instanceof Element && target.closest(INTERACTIVE) !== null;
}

function velocityOf(samples: Sample[]) {
  const last = samples[samples.length - 1];
  const first = samples.find((sample) => last.time - sample.time <= VELOCITY_WINDOW_MS);
  if (!first || first === last) return 0;
  return ((last.y - first.y) / (last.time - first.time)) * 1000;
}

/**
 * @name createDraggableDrawer
 * @description Pointer-driven drag-to-dismiss for the drawer panel. Pressing on a non-interactive
 * part of the panel and moving vertically translates it: downward follows the pointer, upward is
 * rubber-banded. Releasing past the downward threshold or with enough velocity calls `onClose`,
 * otherwise the panel springs back using the snap settings.
 *
 * @example
 * const drag = createDraggableDrawer({ onClose, enabled: () => dismissible(), settings: () => motion() });
 * return <div onPointerDown={drag.onPointerDown} style={{ translate: `0 ${drag.offset()}px` }} />;
 */
export function createDraggableDrawer(options: Options) {
  const [offset, setOffset] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  let frame = 0;
  let stopTracking: (() => void) | null = null;

  function cancelSnap() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function reset() {
    cancelSnap();
    setOffset(0);
    setDragging(false);
  }

  function snapBack(velocity: number) {
    if (prefersReducedMotion()) {
      setOffset(0);
      return;
    }

    let spring: Spring = { position: offset(), velocity };
    let previous = performance.now();

    function tick(now: number) {
      const seconds = Math.min((now - previous) / 1000, MAX_FRAME_SECONDS);
      previous = now;
      spring = stepSpring(spring, seconds, options.settings());

      if (isSpringAtRest(spring)) {
        frame = 0;
        setOffset(0);
        return;
      }

      setOffset(spring.position);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
  }

  function displayOffset(delta: number) {
    if (delta >= 0) return delta;
    return resistUpwardOffset(delta, viewportHeight() * UPWARD_LIMIT, options.settings().upwardResistance);
  }

  function release(delta: number, velocity: number) {
    setDragging(false);
    if (shouldDismissDrag(delta, velocity, viewportHeight(), options.settings())) {
      options.onClose();
      return;
    }
    snapBack(velocity);
  }

  function onPointerDown(event: PointerEvent) {
    if (!options.enabled() || event.button !== 0 || isInteractive(event.target)) return;

    stopTracking?.();
    cancelSnap();
    const startY = event.clientY;
    const samples: Sample[] = [{ time: event.timeStamp, y: startY }];
    let active = false;

    function onMove(move: PointerEvent) {
      const delta = move.clientY - startY;
      if (!active && Math.abs(delta) < DRAG_START_DISTANCE) return;

      active = true;
      setDragging(true);
      samples.push({ time: move.timeStamp, y: move.clientY });
      setOffset(displayOffset(delta));
    }

    function onUp(up: PointerEvent) {
      const wasActive = active;
      stop();
      if (wasActive) release(up.clientY - startY, velocityOf(samples));
    }

    function onCancel() {
      const wasActive = active;
      stop();
      if (!wasActive) return;
      setDragging(false);
      snapBack(0);
    }

    function stop() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      stopTracking = null;
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    stopTracking = stop;
  }

  onCleanup(() => {
    stopTracking?.();
    cancelSnap();
  });

  return { offset, dragging, onPointerDown, reset };
}
