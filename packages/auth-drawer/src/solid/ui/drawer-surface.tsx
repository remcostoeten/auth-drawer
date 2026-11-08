import { Show, createUniqueId, onCleanup, onMount, type Accessor, type JSX } from "solid-js";
import {
  DRAWER_BG,
  DEFAULT_CONFIG,
  type AuthSuccessAction,
  type DrawerState,
  type MotionSettings,
} from "@remcostoeten/auth-drawer/core";
import { cn } from "../lib/cn";
import { createDraggableDrawer } from "../lib/create-draggable-drawer";
import { easeToCss } from "../lib/ease";
import type { AuthAdapter } from "../types";
import { DrawerBackdrop } from "./drawer-backdrop";
import { DrawerClose } from "./drawer-close";
import { DrawerHandle } from "./drawer-handle";
import { LoginForm } from "./login-form";

type Props = {
  state: Accessor<DrawerState<JSX.Element>>;
  phase: "open" | "closing";
  adapter: AuthAdapter;
  onClose: () => void;
  onAuthSuccess: (action: AuthSuccessAction) => void;
  onAdapterSuccess?: NonNullable<AuthAdapter["onSuccess"]>;
  onAdapterError?: NonNullable<AuthAdapter["onError"]>;
};

const FOCUS_DELAY_MS = 100;

function alignmentClass(position: MotionSettings["desktopPosition"]) {
  if (position === "center") return "items-center";
  if (position === "left") return "items-start";
  return "items-end";
}

function rootClass(motion: MotionSettings) {
  const base = "relative z-10 flex w-full flex-col outline-hidden h-full";
  const mode = motion.displayMode === "drawer" ? "justify-end pb-0" : "justify-center";
  return cn(base, mode, alignmentClass(motion.desktopPosition));
}

function animationVars(motion: MotionSettings): JSX.CSSProperties {
  const isDrawer = motion.displayMode === "drawer";

  return {
    "--auth-entry-y": `${isDrawer ? 100 : motion.entryY}px`,
    "--auth-entry-scale": isDrawer ? 1 : motion.entryScale,
    "--auth-exit-y": `${isDrawer ? 100 : motion.exitY}px`,
    "--auth-exit-scale": isDrawer ? 1 : motion.exitScale,
    "--auth-entry-duration": `${motion.entryDuration}s`,
    "--auth-entry-delay": `${motion.entryDelay}s`,
    "--auth-entry-ease": easeToCss(motion.entryEase),
  };
}

function panelStyle(motion: MotionSettings, offset: number, dismissible: boolean): JSX.CSSProperties {
  const isDrawer = motion.displayMode === "drawer";
  const overridesAlign = motion.formAlign !== DEFAULT_CONFIG.ui.motion.formAlign;

  return {
    ...animationVars(motion),
    translate: `0 ${offset}px`,
    "min-height": isDrawer ? "70vh" : "auto",
    background: isDrawer ? DRAWER_BG : "transparent",
    "pointer-events": "auto",
    "padding-top": `${motion.formPaddingTop}px`,
    "padding-bottom": `${motion.formPaddingBottom}px`,
    "justify-content": motion.formJustify,
    "align-items": overridesAlign ? motion.formAlign : undefined,
    "touch-action": dismissible ? "pan-x" : undefined,
  };
}

export function DrawerSurface(props: Props) {
  const titleId = createUniqueId();
  const descId = createUniqueId();
  const motion = () => props.state().motion;
  const hasDrawer = () => motion().displayMode === "drawer";
  const dismissible = () => props.state().dismissible;
  const closeOnBackdrop = () => (!hasDrawer() && dismissible() ? props.onClose : undefined);
  const drag = createDraggableDrawer({ onClose: props.onClose, enabled: dismissible, settings: motion });
  let dialog: HTMLDivElement | undefined;
  let closeButton: HTMLButtonElement | undefined;

  onMount(() => {
    const timer = setTimeout(() => {
      const target = closeButton ?? dialog?.querySelector<HTMLElement>("input, button");
      target?.focus({ preventScroll: true });
    }, FOCUS_DELAY_MS);

    onCleanup(() => clearTimeout(timer));
  });

  return (
    <div class="auth-drawer-focus-scope auth-drawer-overlay fixed inset-0 z-[300] flex flex-col items-center justify-end">
      <DrawerBackdrop settings={motion()} state={props.phase} onClick={closeOnBackdrop()} />

      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        class={cn(rootClass(motion()), "auth-drawer-panel", drag.dragging() && "select-none")}
        data-state={props.phase}
        style={panelStyle(motion(), drag.offset(), dismissible())}
        onPointerDown={drag.onPointerDown}
        onClick={() => closeOnBackdrop()?.()}
      >
        <Show when={hasDrawer() && dismissible()}>
          <DrawerHandle />
        </Show>

        <div
          onClick={(event) => event.stopPropagation()}
          class={cn(
            "relative w-full p-4",
            !hasDrawer() &&
              "rounded-none border border-overlay-border/20 bg-overlay-surface/88 shadow-[0_24px_80px_rgba(17,12,10,0.16)] backdrop-blur-2xl dark:border-overlay-border/10 dark:bg-overlay-surface/80 dark:shadow-2xl",
          )}
          style={{ "max-width": motion().desktopWidth }}
        >
          <Show when={dismissible()}>
            <DrawerClose
              ref={(element) => (closeButton = element)}
              onClick={props.onClose}
              ariaLabel={props.state().resolved.ui.copy.close.ariaLabel}
            />
          </Show>

          <LoginForm
            onSubmitSuccess={props.onAuthSuccess}
            onAdapterSuccess={props.onAdapterSuccess}
            onAdapterError={props.onAdapterError}
            adapter={props.adapter}
            titleId={titleId}
            descId={descId}
            config={props.state().formConfig}
          />

          <Show when={props.state().successState && props.state().resolved.ui.success.footer}>
            <div class="mt-4">{props.state().resolved.ui.success.footer}</div>
          </Show>
        </div>

        <div
          class="pointer-events-none absolute left-0 right-0 top-full h-screen"
          style={{ background: hasDrawer() ? "hsl(var(--surface-overlay))" : "transparent" }}
        />
      </div>
    </div>
  );
}
