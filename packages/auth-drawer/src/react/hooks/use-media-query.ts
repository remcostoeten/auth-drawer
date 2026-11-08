import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query match reactively.
 * Subscribes after mount and returns false during SSR.
 *
 * @param query - Valid CSS media query string.
 * @returns Whether the query currently matches.
 */
export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setValue(event.matches);

    setValue(mq.matches);
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return value;
}
