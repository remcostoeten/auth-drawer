import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { LockKeyhole } from "lucide-react";
import { CONFIGURATOR_EASE } from "./configurator/constants";

export const NAV_ITEMS = [
  ["Start", "start"],
  ["Install", "installation"],
  ["Defaults", "showcase"],
  ["SDK adapters", "sdk-adapters"],
  ["OAuth", "oauth"],
  ["Triggers", "triggers"],
  ["Configurator", "configurator"],
  ["API", "api"],
  ["ui.auth", "api-auth"],
  ["OAuth API", "api-oauth"],
  ["Triggers API", "api-triggers"],
  ["ui.copy", "api-copy"],
  ["ui.visual", "api-visual"],
  ["ui.motion", "api-motion"],
] as const;

export const NAV_SECTION_IDS = NAV_ITEMS.map(([, id]) => id);
export type NavSectionId = (typeof NAV_SECTION_IDS)[number];

/** Matches section scroll-mt (96px) and fixed app header (36px). */
export const DOCS_SCROLL_SPY_OFFSET_PX = 120;

function useDocsActiveSection(sectionIds: readonly NavSectionId[]) {
  const [activeId, setActiveId] = useState<NavSectionId>(sectionIds[0]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let next = sectionIds[0];
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= DOCS_SCROLL_SPY_OFFSET_PX) {
            next = id;
          }
        }
        setActiveId((prev) => (prev === next ? prev : next));
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionIds]);

  return activeId;
}

export function DocsSidebarNav() {
  const reduceMotion = useReducedMotion();
  const activeId = useDocsActiveSection(NAV_SECTION_IDS);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<NavSectionId, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const link = linkRefs.current.get(activeId);
    if (!nav || !link) return;

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    setIndicator({
      top: linkRect.top - navRect.top,
      height: linkRect.height,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeId, updateIndicator]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(nav);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <nav ref={navRef} className="relative space-y-1">
      {indicator ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 left-0 z-0 rounded-[5px] bg-foreground/[0.045]"
          animate={{
            top: indicator.top,
            height: indicator.height,
          }}
          initial={false}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.22, ease: CONFIGURATOR_EASE }
          }
        />
      ) : null}

      {NAV_ITEMS.map(([label, href]) => {
        const isSub = href.startsWith("api-");
        const isActive = activeId === href;

        return (
          <a
            key={`${label}-${href}`}
            ref={(node) => {
              if (node) linkRefs.current.set(href, node);
              else linkRefs.current.delete(href);
            }}
            href={`#${href}`}
            aria-current={isActive ? "location" : undefined}
            className={
              isSub
                ? isActive
                  ? "relative z-10 block rounded-[5px] py-1.5 pl-5 pr-2.5 text-[0.7rem] font-medium text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  : "relative z-10 block rounded-[5px] py-1.5 pl-5 pr-2.5 text-[0.7rem] font-medium text-foreground/36 transition-colors duration-200 hover:bg-foreground/[0.03] hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                : isActive
                  ? "relative z-10 block rounded-[5px] px-2.5 py-2 text-xs font-semibold text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  : "relative z-10 block rounded-[5px] px-2.5 py-2 text-xs font-semibold text-foreground/48 transition-colors duration-200 hover:bg-foreground/[0.045] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
            }
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}

export function DocsSidebarBrand() {
  return (
    <a
      href="#start"
      className="font-display mb-7 flex items-center gap-2 text-sm font-normal tracking-[-0.01em]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-foreground text-background">
        <LockKeyhole size={14} aria-hidden="true" />
      </span>
      Auth Drawer
    </a>
  );
}
