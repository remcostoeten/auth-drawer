import { createEffect, onCleanup, type Accessor } from "solid-js";

type MaybeAccessor<Value> = Value | Accessor<Value>;

export type ScrollOpenTriggerOptions = {
  /** Accessor for the scroll container whose progress is observed, usually a ref signal. */
  container: Accessor<HTMLElement | null | undefined>;
  /** Called when the threshold is crossed. */
  onTrigger: (progress: number) => void;
  /** Normalized scroll progress required before firing. Defaults to 0.25. */
  threshold?: MaybeAccessor<number>;
  /** Turns the observer on or off. Defaults to true. */
  enabled?: MaybeAccessor<boolean>;
  /** Fire only once per mount. Defaults to true. */
  once?: MaybeAccessor<boolean>;
};

function read<Value>(value: MaybeAccessor<Value>): Value {
  return typeof value === "function" ? (value as Accessor<Value>)() : value;
}

function scrollProgress(element: HTMLElement) {
  const maxScroll = element.scrollHeight - element.clientHeight;
  if (maxScroll <= 0) return 0;
  return element.scrollTop / maxScroll;
}

/**
 * @name createScrollOpenTrigger
 * @description Calls `onTrigger` once the scroll container crosses a progress threshold. Use it to
 * open the drawer from scroll position. Re-runs when the container, threshold or enabled flag
 * change and removes its listeners on cleanup.
 *
 * @example
 * const [container, setContainer] = createSignal<HTMLElement>();
 * createScrollOpenTrigger({ container, onTrigger: () => auth.openDrawer(), threshold: 0.5 });
 * return <main ref={setContainer} />;
 */
export function createScrollOpenTrigger(options: ScrollOpenTriggerOptions) {
  createEffect(() => {
    const found = options.container();
    const threshold = read(options.threshold ?? 0.25);
    if (!found || !read(options.enabled ?? true)) return;

    const element: HTMLElement = found;

    let triggered = false;
    let frame = 0;

    function check() {
      frame = 0;
      if (triggered && read(options.once ?? true)) return;

      const progress = scrollProgress(element);
      if (progress < threshold) return;

      triggered = true;
      options.onTrigger(progress);
    }

    function scheduleCheck() {
      if (frame) return;
      frame = window.requestAnimationFrame(check);
    }

    scheduleCheck();
    element.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);

    onCleanup(() => {
      element.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      if (frame) window.cancelAnimationFrame(frame);
    });
  });
}
