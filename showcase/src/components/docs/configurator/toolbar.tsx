import { motion, useReducedMotion } from "framer-motion";
import { ChevronUp, Play, RotateCcw } from "lucide-react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  CONFIGURATOR_EASE,
  CONFIGURATOR_TABS,
  type ConfiguratorTab,
} from "./constants";

export type ConfiguratorToolbarProps = {
  tab: ConfiguratorTab;
  onTabChange: (tab: ConfiguratorTab) => void;
  onShowCurrent: () => void;
  onReset: () => void;
  onCollapse: () => void;
};

export function ConfiguratorToolbar({
  tab,
  onTabChange,
  onShowCurrent,
  onReset,
  onCollapse,
}: ConfiguratorToolbarProps) {
  const reduceMotion = useReducedMotion();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<ConfiguratorTab, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const updateIndicator = useCallback(() => {
    const list = tabListRef.current;
    const activeTab = tabRefs.current.get(tab);
    if (!list || !activeTab) return;

    const listRect = list.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    setIndicator({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    });
  }, [tab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [tab, updateIndicator]);

  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (!list) return;

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(list);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  function onTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (index + offset + CONFIGURATOR_TABS.length) % CONFIGURATOR_TABS.length;
    const next = CONFIGURATOR_TABS[nextIndex];
    if (!next) return;

    onTabChange(next.id);
    tabRefs.current.get(next.id)?.focus();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onShowCurrent}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[5px] bg-foreground px-3.5 text-[0.8125rem] font-semibold text-background transition-transform active:scale-[0.98]"
        >
          <Play size={13} aria-hidden="true" />
          Preview
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset configurator"
            title="Reset"
            className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-transparent px-2.5 text-[0.72rem] font-semibold text-foreground/52 transition-[color,transform,border-color] duration-200 hover:border-foreground/10 hover:text-foreground active:scale-[0.98]"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse configurator"
            title="Collapse"
            className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-transparent px-2.5 text-[0.72rem] font-semibold text-foreground/52 transition-[color,transform,border-color] duration-200 hover:border-foreground/10 hover:text-foreground active:scale-[0.98]"
          >
            <ChevronUp size={13} aria-hidden="true" />
            Collapse
          </button>
        </div>
      </div>

      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Configurator sections"
        className="relative grid grid-cols-4 rounded-[6px] border border-foreground/10 bg-foreground/[0.03] p-0.5"
      >
        {indicator ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-0.5 bottom-0.5 z-0 rounded-[4px] bg-foreground"
            animate={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
            }}
            initial={false}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: CONFIGURATOR_EASE }
            }
          />
        ) : null}

        {CONFIGURATOR_TABS.map((item, index) => {
          const isActive = tab === item.id;

          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) tabRefs.current.set(item.id, node);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={
                isActive
                  ? "relative z-10 min-w-0 truncate rounded-[4px] px-1.5 py-1.5 text-center text-[0.68rem] font-semibold text-background transition-[color,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  : "relative z-10 min-w-0 truncate rounded-[4px] px-1.5 py-1.5 text-center text-[0.68rem] font-semibold text-foreground/42 transition-[color,transform] duration-200 ease-out hover:text-foreground/68 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
