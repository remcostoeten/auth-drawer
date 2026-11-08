import { createComputed, createSignal, on, onCleanup, type Accessor } from "solid-js";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export type Presence = {
  present: Accessor<boolean>;
  state: Accessor<"open" | "closing">;
};

/**
 * @name createPresence
 * @description Keeps content mounted for `exitMs` after `when` turns false so a CSS exit animation
 * can finish. `present` says whether to render and `state` is `"closing"` during the exit. With
 * `prefers-reduced-motion: reduce` the content unmounts immediately.
 *
 * @example
 * const presence = createPresence(() => props.open, 260);
 * return <Show when={presence.present()}><div data-state={presence.state()} /></Show>;
 */
export function createPresence(when: Accessor<boolean>, exitMs: number): Presence {
  const [present, setPresent] = createSignal(when());
  const [closing, setClosing] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function finishExit() {
    timer = undefined;
    setPresent(false);
    setClosing(false);
  }

  function startExit() {
    if (!present()) return;
    if (exitMs <= 0 || prefersReducedMotion()) {
      finishExit();
      return;
    }
    setClosing(true);
    timer = setTimeout(finishExit, exitMs);
  }

  createComputed(
    on(
      when,
      (next) => {
        clearTimer();
        if (!next) return startExit();
        setClosing(false);
        setPresent(true);
      },
      { defer: true },
    ),
  );

  onCleanup(clearTimer);

  return { present, state: () => (closing() ? "closing" : "open") };
}
