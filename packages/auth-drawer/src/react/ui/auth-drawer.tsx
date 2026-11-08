import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserRound } from "lucide-react";
import {
  DRAWER_BG,
  DUR_EXIT,
  DUR_PRESS,
  EASE_DRAWER,
  EASE_EXIT,
  EASE_OUT,
  PORTAL_ID,
  createDrawerController,
  createPushSession,
  registerOverlay,
  DEFAULT_CONFIG,
  type OpenBinding,
  type SessionSnapshot,
} from "@remcostoeten/auth-drawer/core";
import { cn } from "../lib/utils";
import { useDraggableDrawer } from "../hooks/use-draggable-drawer";
import { useAdapterSession } from "../hooks/use-adapter-session";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { useStore } from "../hooks/use-store";
import type { AuthAdapter, AuthConfig, AuthTriggerStore } from "../types";
import { DrawerBackdrop } from "./drawer-backdrop";
import { DrawerClose } from "./drawer-close";
import { DrawerHandle } from "./drawer-handle";
import { LoginForm } from "./login-form";
import { useOptionalAuth } from "./auth-provider";

type Props = {
  config?: AuthConfig;
  adapter: AuthAdapter;
  /** Applies to the built-in trigger button. Prefer `triggerClassName` for clarity. */
  className?: string;
  /** Applies to the built-in trigger button. Takes precedence over `className`. */
  triggerClassName?: string;
  hideTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: NonNullable<AuthAdapter["onSuccess"]>;
  onError?: NonNullable<AuthAdapter["onError"]>;
  triggerStore?: AuthTriggerStore;
};

type AuthContextValue = NonNullable<ReturnType<typeof useOptionalAuth>>;

function parseEase(value: string) {
  try {
    return JSON.parse(value) as number[];
  } catch {
    return value;
  }
}

function useOpenBinding(
  controlledOpen: boolean | undefined,
  onOpenChange: Props["onOpenChange"],
  auth: AuthContextValue | undefined,
): OpenBinding | undefined {
  const shouldUseProviderOpen =
    controlledOpen === undefined && onOpenChange === undefined && auth !== undefined;
  const providerOpen = auth?.isDrawerOpen;
  const openProvider = auth?.openDrawer;
  const closeProvider = auth?.closeDrawer;

  return useMemo(() => {
    if (controlledOpen !== undefined) {
      return { get: () => controlledOpen, set: (next) => onOpenChange?.(next) };
    }

    if (shouldUseProviderOpen) {
      const local = { value: Boolean(providerOpen) };

      return {
        get: () => local.value,
        set: (next) => {
          local.value = next;
          if (next) openProvider?.();
          else closeProvider?.();
        },
      };
    }

    return undefined;
  }, [
    closeProvider,
    controlledOpen,
    onOpenChange,
    openProvider,
    providerOpen,
    shouldUseProviderOpen,
  ]);
}

/**
 * Renders the complete auth drawer feature.
 *
 * @param props - Optional feature config and trigger class name.
 * @returns Trigger button and drawer portal.
 */
export function AuthDrawer(props: Props) {
  const auth = useOptionalAuth();

  if (auth) {
    return <AuthDrawerWithProviderSession {...props} auth={auth} />;
  }

  return <AuthDrawerWithAdapterSession {...props} />;
}

function AuthDrawerWithProviderSession({ auth, ...props }: Props & { auth: AuthContextValue }) {
  const session = useMemo<SessionSnapshot>(
    () => ({
      data: {
        user: auth.user,
        session: auth.session,
      },
      isPending: auth.isPending,
      error: auth.error,
    }),
    [auth.error, auth.isPending, auth.session, auth.user],
  );

  return <AuthDrawerContent {...props} auth={auth} session={session} />;
}

function AuthDrawerWithAdapterSession(props: Props) {
  const session = useAdapterSession(props.adapter);

  return <AuthDrawerContent {...props} session={session} />;
}

function AuthDrawerContent({
  config,
  adapter,
  className,
  triggerClassName,
  hideTrigger = false,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  onSuccess,
  onError,
  triggerStore,
  auth,
  session,
}: Props & { auth?: AuthContextValue; session: SessionSnapshot }) {
  const openBinding = useOpenBinding(controlledOpen, onOpenChange, auth);
  const [pushedSession] = useState(() => createPushSession(session));
  const [controller] = useState(() =>
    createDrawerController({
      adapter,
      config,
      session: pushedSession.source,
      triggerStore,
      open: openBinding,
      defaultOpen,
      onOpenChange: openBinding ? undefined : onOpenChange,
    }),
  );

  useIsomorphicLayoutEffect(() => {
    pushedSession.push({ data: session.data, isPending: session.isPending, error: session.error });
    controller.updateInputs({
      adapter,
      config,
      triggerStore,
      open: openBinding,
      onOpenChange: openBinding ? undefined : onOpenChange,
    });
  }, [
    adapter,
    config,
    controller,
    onOpenChange,
    openBinding,
    pushedSession,
    session.data,
    session.error,
    session.isPending,
    triggerStore,
  ]);

  const {
    open,
    successState,
    motion: drawerMotion,
    resolved,
    formConfig,
    dismissible,
  } = useStore(controller);
  const { closeDrawer, handleAuthSuccess } = controller;

  const [portalEl, setPortal] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const formAdapter = useMemo<AuthAdapter>(() => {
    if (!auth) return adapter;

    return {
      ...adapter,
      // The provider always exposes a callable signIn, so only forward it when
      // the adapter really supports passwords. Otherwise the form would render
      // a password field for a passwordless backend.
      signIn: adapter.signIn ? auth.signIn : undefined,
      signUp: auth.signUp,
      signOut: auth.signOut,
      signInWithOAuth: auth.signInWithOAuth,
      features:
        adapter.features?.passkey && auth.signInWithPasskey
          ? { ...adapter.features, passkey: { signIn: auth.signInWithPasskey } }
          : adapter.features,
      onSuccess: undefined,
      onError: undefined,
    };
  }, [adapter, auth]);

  const successFooter = useMemo(() => {
    if (!successState) return null;
    return resolved.ui.success.footer ?? null;
  }, [resolved.ui.success.footer, successState]);

  const { y, rawY, onDrag, onDragEnd } = useDraggableDrawer(closeDrawer, dismissible, drawerMotion);

  function openDrawer() {
    if (controller.getState().isAuthenticated) return;
    y.set(0);
    rawY.set(0);
    controller.openDrawer();
  }

  function toggleDrawer() {
    if (open) {
      closeDrawer();
      return;
    }

    openDrawer();
  }

  useEffect(() => {
    if (!open || !portalEl) return;

    return registerOverlay(portalEl);
  }, [open, portalEl]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const target =
          closeRef.current ?? dialogRef.current?.querySelector<HTMLElement>("input, button");
        target?.focus({ preventScroll: true });
      }, 100);

      return () => clearTimeout(timer);
    }

    triggerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const element = document.getElementById(PORTAL_ID);

    if (!element && import.meta.env.DEV) {
      console.error(`Missing #${PORTAL_ID}; AuthDrawer will render inline.`);
    }

    setPortal(element);
  }, []);

  const rootClass = cn(
    "relative z-10 flex w-full flex-col outline-hidden",
    drawerMotion.displayMode === "drawer"
      ? cn(
          "h-full justify-end pb-0",
          drawerMotion.desktopPosition === "center" && "items-center",
          drawerMotion.desktopPosition === "left" && "items-start",
          drawerMotion.desktopPosition === "right" && "items-end",
        )
      : cn(
          "h-full justify-center",
          drawerMotion.desktopPosition === "center" && "items-center",
          drawerMotion.desktopPosition === "left" && "items-start",
          drawerMotion.desktopPosition === "right" && "items-end",
        ),
  );

  const hasDrawer = drawerMotion.displayMode === "drawer";
  const dismissOnBackdropClick = !hasDrawer && dismissible;
  const formAlign = drawerMotion.formAlign;
  const shouldOverridePosition = formAlign !== DEFAULT_CONFIG.ui.motion.formAlign;

  const drawer = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-drawer-focus-scope fixed inset-0 z-[300] flex flex-col items-center justify-end"
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
          <DrawerBackdrop
            settings={drawerMotion}
            onClick={dismissOnBackdropClick ? closeDrawer : undefined}
          />

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
              paddingTop: drawerMotion.formPaddingTop,
              paddingBottom: drawerMotion.formPaddingBottom,
              justifyContent: drawerMotion.formJustify,
              alignItems: shouldOverridePosition ? formAlign : undefined,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.3, bottom: 0.5 }}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onClick={dismissOnBackdropClick ? closeDrawer : undefined}
            initial={{
              opacity: 0,
              scale: drawerMotion.displayMode === "drawer" ? 1 : drawerMotion.entryScale,
              y: drawerMotion.displayMode === "drawer" ? 100 : drawerMotion.entryY,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: drawerMotion.displayMode === "drawer" ? 1 : drawerMotion.exitScale,
              y: drawerMotion.displayMode === "drawer" ? 100 : drawerMotion.exitY,
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
            }}
            transition={{
              duration: drawerMotion.entryDuration,
              delay: drawerMotion.entryDelay,
              ease: parseEase(drawerMotion.entryEase) as never,
            }}
          >
            {hasDrawer && dismissible && <DrawerHandle />}

            <motion.div
              layout
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "relative w-full p-4",
                hasDrawer
                  ? undefined
                  : "rounded-none border border-overlay-border/20 bg-overlay-surface/88 shadow-[0_24px_80px_rgba(17,12,10,0.16)] backdrop-blur-2xl dark:border-overlay-border/10 dark:bg-overlay-surface/80 dark:shadow-2xl",
              )}
              style={{
                maxWidth: drawerMotion.desktopWidth,
              }}
            >
              {dismissible ? (
                <DrawerClose
                  buttonRef={closeRef}
                  onClick={closeDrawer}
                  ariaLabel={resolved.ui.copy.close.ariaLabel}
                />
              ) : null}

              <LoginForm
                onSubmitSuccess={handleAuthSuccess}
                onAdapterSuccess={onSuccess}
                onAdapterError={onError}
                adapter={formAdapter}
                titleId={titleId}
                descId={descId}
                config={formConfig}
              />

              {successFooter ? <div className="mt-4">{successFooter}</div> : null}
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
      {!hideTrigger && (
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
            "auth-drawer-focus-scope focus-visible:outline-hidden focus-visible:bg-overlay-surface/20 focus-visible:border-overlay-focus/45",
            "border-overlay-border/10",
            triggerClassName ?? className,
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
              {resolved.ui.copy.trigger.title}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-overlay-subtle transition-colors group-hover:text-overlay-muted">
              {open ? resolved.ui.copy.trigger.close : resolved.ui.copy.trigger.open}
            </span>
          </span>
        </motion.button>
      )}

      {portalEl ? createPortal(drawer, portalEl) : drawer}
    </>
  );
}
