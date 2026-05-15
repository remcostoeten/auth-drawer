import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { registerOverlay } from "@/lib/overlay-registry";
import {
  DRAWER_BG,
  DUR_EXIT,
  DUR_PRESS,
  EASE_DRAWER,
  EASE_EXIT,
  EASE_OUT,
  PORTAL_ID,
  SETTINGS_EVENT,
  SETTINGS_KEY,
} from "../constants";
import { DEFAULT_CONFIG } from "../config";
import { useDraggableDrawer } from "../hooks/use-draggable-drawer";
import { useMediaQuery } from "../hooks/use-media-query";
import type { AuthConfig, MotionSettings, ResolvedAuthConfig } from "../types";
import { DrawerBackdrop } from "./drawer-backdrop";
import { DrawerClose } from "./drawer-close";
import { DrawerHandle } from "./drawer-handle";
import { LoginForm } from "./login-form";

type Props = {
  config?: AuthConfig;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type SettingsEvent = CustomEvent<MotionSettings>;

function isSettingsEvent(event: Event): event is SettingsEvent {
  return "detail" in event;
}

function readSavedSettings(): Partial<MotionSettings> {
  if (typeof window === "undefined") return {};

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return {};

    return JSON.parse(saved) as Partial<MotionSettings>;
  } catch {
    return {};
  }
}

function resolveMotionSettings(
  overrides?: Partial<MotionSettings>,
): MotionSettings {
  return {
    ...DEFAULT_CONFIG.motionSettings,
    ...readSavedSettings(),
    ...overrides,
  };
}

function parseEase(value: string) {
  try {
    return JSON.parse(value) as number[];
  } catch {
    return value;
  }
}

/**
 * Renders the complete auth drawer feature.
 *
 * @param props - Optional feature config and trigger class name.
 * @returns Trigger button and drawer portal.
 */
export function AuthDrawer({
  config,
  className,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: Props) {
  const resolved = useMemo<ResolvedAuthConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
      motionSettings: resolveMotionSettings(config?.motionSettings),
    }),
    [config],
  );

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [portalEl, setPortal] = useState<HTMLElement | null>(null);
  const [motionSettings, setMotion] = useState<MotionSettings>(() =>
    resolved.motionSettings,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const titleId = useId();
  const descId = useId();
  const open = controlledOpen ?? uncontrolledOpen;
  const setDrawerOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  const closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen]);

  const applySettings = useCallback(
    (settings: Partial<MotionSettings>) => {
      setMotion({
        ...DEFAULT_CONFIG.motionSettings,
        ...settings,
        ...config?.motionSettings,
      });
    },
    [config?.motionSettings],
  );

  useEffect(() => {
    setMotion(resolved.motionSettings);
  }, [resolved.motionSettings]);

  useEffect(() => {
    function handleUpdate(event: Event) {
      if (!isSettingsEvent(event)) return;
      applySettings(event.detail);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== SETTINGS_KEY || !event.newValue) return;

      try {
        applySettings(JSON.parse(event.newValue) as Partial<MotionSettings>);
      } catch {
        return;
      }
    }

    window.addEventListener(SETTINGS_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [applySettings]);

  const { y, rawY, onDrag, onDragEnd } = useDraggableDrawer(
    closeDrawer,
    true,
    motionSettings,
  );

  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const openDrawer = useCallback(() => {
    if (isMobile) y.set(vh);
    else y.set(0);

    rawY.set(0);
    setDrawerOpen(true);
  }, [isMobile, rawY, setDrawerOpen, vh, y]);

  const toggleDrawer = useCallback(() => {
    if (open) {
      closeDrawer();
      return;
    }

    openDrawer();
  }, [closeDrawer, open, openDrawer]);

  useEffect(() => {
    if (!open || !portalEl) return;

    return registerOverlay(portalEl);
  }, [open, portalEl]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(
        () => closeRef.current?.focus({ preventScroll: true }),
        100,
      );

      return () => clearTimeout(timer);
    }

    triggerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handler(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.stopPropagation();
      setDrawerOpen(false);
    }

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [open, setDrawerOpen]);

  useEffect(() => {
    const element = document.getElementById(PORTAL_ID);

    if (!element && import.meta.env.DEV) {
      console.error(`Missing #${PORTAL_ID}; AuthDrawer will render inline.`);
    }

    setPortal(element);
  }, []);

  const rootClass = cn(
    "relative z-10 flex w-full flex-col outline-hidden",
    isMobile
      ? "items-center justify-end pb-8"
      : motionSettings.displayMode === "drawer"
        ? cn(
            "h-full justify-end pb-0",
            motionSettings.desktopPosition === "center" && "items-center",
            motionSettings.desktopPosition === "left" && "items-start",
            motionSettings.desktopPosition === "right" && "items-end",
          )
        : cn(
            "h-full justify-center",
            motionSettings.desktopPosition === "center" && "items-center",
            motionSettings.desktopPosition === "left" && "items-start",
            motionSettings.desktopPosition === "right" && "items-end",
          ),
  );

  const hasDrawer = isMobile || motionSettings.displayMode === "drawer";

  const drawer = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{
            opacity: {
              duration: 0.22,
              ease: EASE_OUT,
            },
          }}
        >
          <DrawerBackdrop settings={motionSettings} onClick={closeDrawer} />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            className={rootClass}
            style={{
              y,
              minHeight: hasDrawer ? "70vh" : "auto",
              background: hasDrawer ? DRAWER_BG : "transparent",
              pointerEvents: "auto",
              paddingTop: motionSettings.formPaddingTop,
              paddingBottom: motionSettings.formPaddingBottom,
              justifyContent: motionSettings.formJustify,
              alignItems: motionSettings.formAlign,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.3, bottom: 0.5 }}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onClick={closeDrawer}
            initial={
              isMobile
                ? { y: vh }
                : {
                    opacity: 0,
                    scale:
                      motionSettings.displayMode === "drawer"
                        ? 1
                        : motionSettings.entryScale,
                    y:
                      motionSettings.displayMode === "drawer"
                        ? 100
                        : motionSettings.entryY,
                  }
            }
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              isMobile
                ? {
                    y: vh,
                    transition: {
                      type: "spring",
                      damping: motionSettings.snapDamping,
                      stiffness: motionSettings.snapStiffness,
                      mass: motionSettings.snapMass,
                      restDelta: 0.001,
                    },
                  }
                : {
                    opacity: 0,
                    scale:
                      motionSettings.displayMode === "drawer"
                        ? 1
                        : motionSettings.exitScale,
                    y:
                      motionSettings.displayMode === "drawer"
                        ? 100
                        : motionSettings.exitY,
                    transition: {
                      opacity: {
                        duration: 0.18,
                        ease: EASE_EXIT,
                      },
                      y: {
                        duration: DUR_EXIT,
                        ease: EASE_DRAWER,
                      },
                      scale: {
                        duration: 0.22,
                        ease: EASE_EXIT,
                      },
                    },
                  }
            }
            transition={
              isMobile
                ? {
                    type: "spring",
                    damping: motionSettings.snapDamping,
                    stiffness: motionSettings.snapStiffness,
                    mass: motionSettings.snapMass,
                    restDelta: 0.001,
                  }
                : {
                    duration: motionSettings.entryDuration,
                    delay: motionSettings.entryDelay,
                    ease: parseEase(motionSettings.entryEase),
                  }
            }
          >
            {hasDrawer && <DrawerHandle />}

            <motion.div
              layout
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "relative p-4",
                hasDrawer
                  ? "w-full"
                  : "w-full rounded-none border border-overlay-border/20 bg-overlay-surface/88 shadow-[0_24px_80px_rgba(17,12,10,0.16)] backdrop-blur-2xl dark:border-overlay-border/10 dark:bg-overlay-surface/80 dark:shadow-2xl",
              )}
              style={{
                width: !isMobile ? motionSettings.desktopWidth : "100%",
              }}
            >
              <DrawerClose buttonRef={closeRef} onClick={closeDrawer} />

              <LoginForm
                onSuccess={closeDrawer}
                titleId={titleId}
                descId={descId}
                config={resolved}
              />
            </motion.div>

            <div
              className="pointer-events-none absolute left-0 right-0 top-full h-screen"
              style={{
                background: hasDrawer ? "hsl(var(--surface-overlay))" : "transparent",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        ref={triggerRef}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.015 }}
        transition={{
          duration: DUR_PRESS,
          ease: EASE_OUT,
          scale: {
            type: "spring",
            stiffness: 400,
            damping: 25,
          },
        }}
        type="button"
        onClick={toggleDrawer}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-none border px-4 py-2 text-sm",
          "bg-overlay-surface/10 backdrop-blur-xl",
          "text-overlay-text transition-all duration-200",
          "shadow-[0_8px_30px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.05)]",
          "hover:bg-overlay-surface/20 hover:border-overlay-border/20",
          "focus-visible:ring-2 focus-visible:ring-overlay-border/20 focus-visible:outline-hidden",
          "border-overlay-border/10",
          className,
        )}
      >
        <div className="relative flex items-center justify-center">
          <UserRound
            size={16}
            className="text-overlay-muted transition-colors duration-200 group-hover:text-overlay-text"
            aria-hidden="true"
          />
        </div>
        <span className="flex flex-col text-left leading-tight">
          <span className="text-xs font-semibold tracking-tight text-overlay-text transition-colors group-hover:text-overlay-text/90">
            Account
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-overlay-subtle transition-colors group-hover:text-overlay-muted">
            {open ? "Close" : "Open"}
          </span>
        </span>
      </motion.button>

      {portalEl ? createPortal(drawer, portalEl) : drawer}
    </>
  );
}
