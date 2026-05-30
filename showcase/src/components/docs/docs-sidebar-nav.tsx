import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, LockKeyhole } from "lucide-react";
import { CONFIGURATOR_EASE } from "./configurator/constants";

type NavItem = {
  label: string;
  id: string;
  depth?: 0 | 1 | 2 | 3;
  group?:
    | "sdk-adapters"
    | "supabase-guide"
    | "better-auth-guide"
    | "next-auth-guide"
    | "clerk-guide"
    | "api";
  controlsGroup?:
    | "sdk-adapters"
    | "supabase-guide"
    | "better-auth-guide"
    | "next-auth-guide"
    | "clerk-guide"
    | "api";
};

export const NAV_ITEMS = [
  { label: "Start", id: "start" },
  { label: "Install", id: "installation" },
  { label: "Defaults", id: "showcase" },
  { label: "SDK adapters", id: "sdk-adapters", controlsGroup: "sdk-adapters" },
  { label: "Supabase", id: "sdk-supabase", depth: 1, group: "sdk-adapters" },
  {
    label: "A-Z Guide",
    id: "supabase-guide",
    depth: 2,
    group: "sdk-adapters",
    controlsGroup: "supabase-guide",
  },
  { label: "1. Install", id: "supabase-install", depth: 3, group: "supabase-guide" },
  { label: "2. Env", id: "supabase-env", depth: 3, group: "supabase-guide" },
  { label: "3. Dashboard", id: "supabase-dashboard", depth: 3, group: "supabase-guide" },
  { label: "4. Client", id: "supabase-client", depth: 3, group: "supabase-guide" },
  { label: "5. Mount drawer", id: "supabase-mount", depth: 3, group: "supabase-guide" },
  { label: "6. Reset route", id: "supabase-reset", depth: 3, group: "supabase-guide" },
  { label: "Better Auth", id: "sdk-better-auth", depth: 1, group: "sdk-adapters" },
  {
    label: "A-Z Guide",
    id: "ba-guide",
    depth: 2,
    group: "sdk-adapters",
    controlsGroup: "better-auth-guide",
  },
  { label: "1. Install", id: "ba-install", depth: 3, group: "better-auth-guide" },
  { label: "2. Env", id: "ba-env", depth: 3, group: "better-auth-guide" },
  { label: "3. Schema", id: "ba-schema", depth: 3, group: "better-auth-guide" },
  { label: "4. Server config", id: "ba-server", depth: 3, group: "better-auth-guide" },
  { label: "5. API route", id: "ba-route", depth: 3, group: "better-auth-guide" },
  { label: "6. Client SDK", id: "ba-client", depth: 3, group: "better-auth-guide" },
  { label: "7. Mount drawer", id: "ba-mount", depth: 3, group: "better-auth-guide" },
  { label: "NextAuth", id: "sdk-next-auth", depth: 1, group: "sdk-adapters" },
  {
    label: "A-Z Guide",
    id: "next-auth-guide",
    depth: 2,
    group: "sdk-adapters",
    controlsGroup: "next-auth-guide",
  },
  { label: "1. Install", id: "next-auth-install", depth: 3, group: "next-auth-guide" },
  { label: "2. Env", id: "next-auth-env", depth: 3, group: "next-auth-guide" },
  { label: "3. Server config", id: "next-auth-server", depth: 3, group: "next-auth-guide" },
  { label: "4. Route", id: "next-auth-route", depth: 3, group: "next-auth-guide" },
  {
    label: "5. Session provider",
    id: "next-auth-session-provider",
    depth: 3,
    group: "next-auth-guide",
  },
  { label: "6. Mount drawer", id: "next-auth-mount", depth: 3, group: "next-auth-guide" },
  { label: "Clerk", id: "sdk-clerk", depth: 1, group: "sdk-adapters" },
  {
    label: "A-Z Guide",
    id: "clerk-guide",
    depth: 2,
    group: "sdk-adapters",
    controlsGroup: "clerk-guide",
  },
  { label: "1. Install", id: "clerk-install", depth: 3, group: "clerk-guide" },
  { label: "2. Env", id: "clerk-env", depth: 3, group: "clerk-guide" },
  { label: "3. Middleware", id: "clerk-middleware", depth: 3, group: "clerk-guide" },
  { label: "4. Provider", id: "clerk-provider", depth: 3, group: "clerk-guide" },
  { label: "5. Dashboard", id: "clerk-dashboard", depth: 3, group: "clerk-guide" },
  { label: "6. Mount drawer", id: "clerk-mount", depth: 3, group: "clerk-guide" },
  { label: "Firebase", id: "sdk-firebase", depth: 1, group: "sdk-adapters" },
  { label: "Custom JWT", id: "sdk-custom-jwt", depth: 1, group: "sdk-adapters" },
  { label: "Passport", id: "sdk-passport", depth: 1, group: "sdk-adapters" },
  { label: "Mock", id: "sdk-mock", depth: 1, group: "sdk-adapters" },
  { label: "OAuth", id: "oauth" },
  { label: "Triggers", id: "triggers" },
  { label: "Configurator", id: "configurator" },
  { label: "API", id: "api", controlsGroup: "api" },
  { label: "ui.auth", id: "api-auth", depth: 1, group: "api" },
  { label: "OAuth API", id: "api-oauth", depth: 1, group: "api" },
  { label: "Triggers API", id: "api-triggers", depth: 1, group: "api" },
  { label: "ui.copy", id: "api-copy", depth: 1, group: "api" },
  { label: "ui.visual", id: "api-visual", depth: 1, group: "api" },
  { label: "ui.motion", id: "api-motion", depth: 1, group: "api" },
] as const satisfies readonly NavItem[];

export const NAV_SECTION_IDS = NAV_ITEMS.map(({ id }) => id);
export type NavSectionId = (typeof NAV_SECTION_IDS)[number];

/** Matches section scroll-mt (96px) and fixed app header (36px). */
export const DOCS_SCROLL_SPY_OFFSET_PX = 120;
const DEPTH_RAILS = [13, 28, 43] as const;

function getNavItemClass(depth: NavItem["depth"] = 0, isActive: boolean) {
  const base =
    "relative z-10 flex items-center justify-between rounded-[5px] transition-colors duration-200";

  if (depth === 3) {
    return `${base} ml-9 py-1 pl-4 pr-2 text-[0.66rem] font-medium ${
      isActive
        ? "text-foreground"
        : "text-foreground/32 hover:bg-foreground/[0.025] hover:text-foreground/64"
    }`;
  }

  if (depth === 2) {
    return `${base} ml-6 py-1 pl-4 pr-2 text-[0.68rem] font-medium ${
      isActive
        ? "text-foreground"
        : "text-foreground/36 hover:bg-foreground/[0.025] hover:text-foreground/66"
    }`;
  }

  if (depth === 1) {
    return `${base} ml-3 py-1.5 pl-4 pr-2 text-[0.7rem] font-medium ${
      isActive
        ? "text-foreground"
        : "text-foreground/42 hover:bg-foreground/[0.03] hover:text-foreground/72"
    }`;
  }

  return `${base} px-2.5 py-2 text-xs font-semibold ${
    isActive
      ? "text-foreground"
      : "text-foreground/48 hover:bg-foreground/[0.045] hover:text-foreground"
  }`;
}

function DepthRulers({ depth, isActive }: { depth: NavItem["depth"]; isActive: boolean }) {
  if (!depth) return null;

  const railCount = Math.min(depth, DEPTH_RAILS.length);
  const railLeft = DEPTH_RAILS[depth - 1];

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0">
      {DEPTH_RAILS.slice(0, railCount).map((left, index) => {
        const isCurrentRail = index === depth - 1;
        return (
          <span
            key={left}
            className={`absolute -top-1 -bottom-1 w-px ${
              isCurrentRail ? "bg-foreground/16" : "bg-foreground/[0.075]"
            }`}
            style={{ left }}
          />
        );
      })}
      <span
        className={`absolute top-1/2 h-px -translate-y-1/2 ${
          isActive ? "bg-foreground/34" : "bg-foreground/14"
        }`}
        style={{
          left: railLeft,
          width: depth === 1 ? 11 : 12,
        }}
      />
      {isActive ? (
        <span
          className="absolute top-1.5 bottom-1.5 w-px rounded-full bg-foreground/55 shadow-[0_0_10px_hsl(var(--foreground)/0.18)]"
          style={{ left: railLeft }}
        />
      ) : null}
    </span>
  );
}

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

type DocsSidebarNavProps = {
  onNavigate?: () => void;
};

export function DocsSidebarNav({ onNavigate }: DocsSidebarNavProps = {}) {
  const reduceMotion = useReducedMotion();
  const activeId = useDocsActiveSection(NAV_SECTION_IDS);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<NavSectionId, HTMLAnchorElement>());
  const sidebarStorageKey = "auth-drawer-docs-sidebar-collapsed";
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    "sdk-adapters": false,
    "supabase-guide": false,
    "better-auth-guide": false,
    "next-auth-guide": false,
    "clerk-guide": false,
    api: false,
  });
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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(sidebarStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<Record<string, boolean>>;
      setCollapsedGroups((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore malformed stored state.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarStorageKey, JSON.stringify(collapsedGroups));
    } catch {
      // Ignore storage quota or privacy errors.
    }
  }, [collapsedGroups]);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

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
          transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: CONFIGURATOR_EASE }}
        />
      ) : null}

      {NAV_ITEMS.map((item) => {
        const { label, id: href } = item;
        const depth = "depth" in item ? item.depth : 0;
        const group = "group" in item ? item.group : undefined;
        const controlsGroup = "controlsGroup" in item ? item.controlsGroup : undefined;
        const isActive = activeId === href;
        const isGroup = Boolean(controlsGroup);
        const isCollapsed = controlsGroup ? collapsedGroups[controlsGroup] : false;
        const isHiddenByGroup =
          (group === "sdk-adapters" && collapsedGroups["sdk-adapters"]) ||
          (group === "supabase-guide" && collapsedGroups["sdk-adapters"]) ||
          (group === "supabase-guide" && collapsedGroups["supabase-guide"]) ||
          (group === "better-auth-guide" && collapsedGroups["sdk-adapters"]) ||
          (group === "better-auth-guide" && collapsedGroups["better-auth-guide"]) ||
          (group === "next-auth-guide" && collapsedGroups["sdk-adapters"]) ||
          (group === "next-auth-guide" && collapsedGroups["next-auth-guide"]) ||
          (group === "clerk-guide" && collapsedGroups["sdk-adapters"]) ||
          (group === "clerk-guide" && collapsedGroups["clerk-guide"]) ||
          (group === "api" && collapsedGroups.api);

        if (isHiddenByGroup) return null;

        return (
          <div key={`${label}-${href}`} className="relative">
            <DepthRulers depth={depth} isActive={isActive} />
            <div className={getNavItemClass(depth, isActive)}>
              <a
                ref={(node) => {
                  if (node) linkRefs.current.set(href, node);
                  else linkRefs.current.delete(href);
                }}
                href={`#${href}`}
                aria-current={isActive ? "location" : undefined}
                onClick={onNavigate}
                className="min-w-0 flex-1 truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              >
                {label}
              </a>
              {isGroup ? (
                <button
                  type="button"
                  onClick={() => controlsGroup && toggleGroup(controlsGroup)}
                  aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${label}`}
                  aria-expanded={!isCollapsed}
                  className="ml-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] text-foreground/35 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function DocsSidebarBrand() {
  return (
    <a
      href="#start"
      className="font-display mb-4 flex items-center gap-2 text-sm font-normal tracking-[-0.01em]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-foreground text-background">
        <LockKeyhole size={14} aria-hidden="true" />
      </span>
      Auth Drawer
    </a>
  );
}
