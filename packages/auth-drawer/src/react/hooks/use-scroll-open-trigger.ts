import { useEffect, type RefObject } from "react";

/**
 * Hook options for the scroll-open trigger.
 */
export type ScrollOpenTriggerOptions = {
  /**
   * The scroll container whose progress should be observed.
   */
  containerRef: RefObject<HTMLElement | null>;
  /**
   * Invoked when the threshold is crossed.
   */
  onTrigger: (progress: number) => void;
  /**
   * Normalized scroll progress required before firing.
   */
  threshold?: number;
  /**
   * Enables or disables the observer.
   */
  enabled?: boolean;
  /**
   * If true, the trigger runs only once per mount.
   */
  once?: boolean;
};

function getScrollProgress(element: HTMLElement) {
  const maxScroll = element.scrollHeight - element.clientHeight;

  if (maxScroll <= 0) return 0;

  return element.scrollTop / maxScroll;
}

/**
 * Opens a surface once the scroll container crosses a threshold.
 *
 * @param options - Container ref, trigger callback, and threshold settings.
 */
export function useScrollOpenTrigger({
  containerRef,
  onTrigger,
  threshold = 0.25,
  enabled = true,
  once = true,
}: ScrollOpenTriggerOptions) {
  useEffect(() => {
    if (!enabled) return;

    const element = containerRef.current;
    if (!element) return;

    let triggered = false;
    let frame = 0;

    const check = () => {
      frame = 0;

      if (triggered && once) return;

      if (getScrollProgress(element) >= threshold) {
        triggered = true;
        onTrigger(getScrollProgress(element));
      }
    };

    const scheduleCheck = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(check);
    };

    scheduleCheck();
    element.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);

    return () => {
      element.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [containerRef, enabled, onTrigger, once, threshold]);
}
