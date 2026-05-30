import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CodeBlock } from "./server-code-block";

export type CodeBlockVariant = {
  id: string;
  label: string;
  code: string;
};

type TabbedCodeBlockProps = {
  variants: CodeBlockVariant[];
  defaultVariant?: string;
  lang?: string;
  title?: string;
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function createPackageInstallVariants(
  packageName: string,
): CodeBlockVariant[] {
  return [
    { id: "npm", label: "npm", code: `npm install ${packageName}` },
    { id: "pnpm", label: "pnpm", code: `pnpm add ${packageName}` },
    { id: "bun", label: "bun", code: `bun add ${packageName}` },
  ];
}

export function TabbedCodeBlock({
  variants,
  defaultVariant,
  lang = "bash",
  title,
}: TabbedCodeBlockProps) {
  const reduceMotion = useReducedMotion();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousIndexRef = useRef(0);

  const [activeId, setActiveId] = useState(
    defaultVariant ?? variants[0]?.id ?? "",
  );
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const activeIndex = variants.findIndex((variant) => variant.id === activeId);
  const active = variants[activeIndex] ?? variants[0];
  const direction =
    activeIndex >= previousIndexRef.current
      ? 1
      : activeIndex < previousIndexRef.current
        ? -1
        : 0;

  const updateIndicator = useCallback(() => {
    const list = tabListRef.current;
    const tab = tabRefs.current.get(activeId);

    if (!list || !tab) return;

    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    setIndicator({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    updateIndicator();
    previousIndexRef.current = activeIndex >= 0 ? activeIndex : 0;
  }, [activeIndex, updateIndicator, variants]);

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

  const selectTab = (id: string) => {
    setActiveId(id);
  };

  const onTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + offset + variants.length) % variants.length;
    const next = variants[nextIndex];

    if (!next) return;

    selectTab(next.id);
    tabRefs.current.get(next.id)?.focus();
  };

  if (!active) return null;

  const contentOffset = reduceMotion ? 0 : direction * 6;

  return (
    <div className="overflow-hidden rounded-[6px] border border-foreground/10">
      {title ? (
        <div className="flex items-center justify-between border-b border-foreground/10 bg-[#0b0b0c] px-3 py-2">
          <span className="font-mono text-[0.68rem] text-white/56">
            {title}
          </span>
        </div>
      ) : null}
      <div
        ref={tabListRef}
        className="relative flex gap-0.5 border-b border-foreground/10 bg-[#0b0b0c] "
        role="tablist"
        aria-label="Code variants"
      >
        {indicator ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 z-0 rounded-t-[4px] bg-[#161618]"
            animate={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
            }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }
            }
          />
        ) : null}

        {variants.map((variant, index) => {
          const isActive = variant.id === active.id;

          return (
            <button
              key={variant.id}
              ref={(node) => {
                if (node) tabRefs.current.set(variant.id, node);
                else tabRefs.current.delete(variant.id);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(variant.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={
                isActive
                  ? "relative z-10 rounded-t-[4px] px-2.5 py-1.5 text-[0.68rem] font-medium text-white/88 transition-[color,transform] duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  : "relative z-10 rounded-t-[4px] px-2.5 py-1.5 text-[0.68rem] font-medium text-white/38 transition-[color,transform] duration-200 ease-out hover:text-white/62 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
              }
            >
              {variant.label}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden bg-[#0b0b0c]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    transform: `translateY(4px) translateX(${contentOffset}px)`,
                    filter: "blur(2px)",
                  }
            }
            animate={{
              opacity: 1,
              transform: "translateY(0px) translateX(0px)",
              filter: "blur(0px)",
            }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    transform: `translateY(-3px) translateX(${-contentOffset}px)`,
                    filter: "blur(2px)",
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.12, ease: EASE_OUT }
                : { duration: 0.18, ease: EASE_OUT }
            }
          >
            <CodeBlock lang={lang} embedded>
              {active.code}
            </CodeBlock>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
