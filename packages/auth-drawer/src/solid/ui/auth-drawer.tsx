import {
  DEV,
  Show,
  createComputed,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  PORTAL_ID,
  createDrawerController,
  createPushSession,
  registerOverlay,
  sessionOf,
  type SessionSnapshot,
} from "@remcostoeten/auth-drawer/core";
import { createControllerState } from "../lib/create-controller-state";
import { createOpenBinding } from "../lib/create-open-binding";
import { createPresence } from "../lib/create-presence";
import { createSessionAccessor } from "../lib/create-session-accessor";
import type { AuthAdapter, AuthConfig, AuthTriggerStore } from "../types";
import { useOptionalAuth, type AuthContextValue } from "./auth-provider";
import { DrawerSurface } from "./drawer-surface";
import { TriggerButton } from "./trigger-button";

export type AuthDrawerProps = {
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

const EXIT_MS = 320;
let warnedAboutMissingPortal = false;

function warnAboutMissingPortal() {
  if (!DEV || warnedAboutMissingPortal) return;
  warnedAboutMissingPortal = true;
  console.error(`Missing #${PORTAL_ID}; AuthDrawer will render inline.`);
}

function providerSnapshot(auth: AuthContextValue) {
  return createMemo<SessionSnapshot>(() => ({
    data: { user: auth.user(), session: auth.session() },
    isPending: auth.isPending(),
    error: auth.error(),
  }));
}

function providerBackedAdapter(adapter: AuthAdapter, auth: AuthContextValue): AuthAdapter {
  return {
    ...adapter,
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
}

/**
 * @name AuthDrawer
 * @description Renders the complete auth feature: the trigger button and the drawer or modal. Open
 * state comes from the `open` prop, else from the surrounding `AuthProvider`, else is kept
 * internally. The surface renders into `#auth-drawer-portal` when that element exists and inline
 * otherwise.
 *
 * @example
 * <AuthProvider adapter={adapter}>
 *   <AuthDrawer adapter={adapter} config={{ ui: { auth: { providers: ["github", "google"] } } }} />
 * </AuthProvider>
 */
export function AuthDrawer(props: AuthDrawerProps) {
  const auth = useOptionalAuth();
  const snapshot = auth
    ? providerSnapshot(auth)
    : createSessionAccessor(() => sessionOf(props.adapter));
  const pushed = createPushSession(untrack(snapshot));
  createComputed(() => pushed.push(snapshot()));

  const binding = createOpenBinding(props, auth);
  const controller = createDrawerController<JSX.Element>({
    adapter: props.adapter,
    config: props.config,
    session: pushed.source,
    triggerStore: props.triggerStore,
    open: untrack(binding),
    defaultOpen: props.defaultOpen,
    onOpenChange: (next) => props.onOpenChange?.(next),
  });
  const state = createControllerState(controller);

  createEffect(
    on(
      [() => props.adapter, () => props.config, () => props.triggerStore, binding],
      ([adapter, config, triggerStore, open]) =>
        controller.updateInputs({ adapter, config, triggerStore, open }),
      { defer: true },
    ),
  );
  createEffect(on(() => binding()?.get(), () => controller.syncOpen(), { defer: true }));
  onCleanup(() => controller.destroy());

  const presence = createPresence(() => state().open, EXIT_MS);
  const formAdapter = createMemo(() =>
    auth ? providerBackedAdapter(props.adapter, auth) : props.adapter,
  );
  const [portal, setPortal] = createSignal<HTMLElement | null>(null);
  const [ready, setReady] = createSignal(false);
  let trigger: HTMLButtonElement | undefined;

  onMount(() => {
    const element = document.getElementById(PORTAL_ID);
    if (!element) warnAboutMissingPortal();
    setPortal(element);
    setReady(true);
  });

  createEffect(() => {
    const element = portal();
    if (!state().open || !element) return;
    onCleanup(registerOverlay(element));
  });

  createEffect(
    on(
      () => state().open,
      (open, wasOpen) => {
        if (wasOpen && !open) queueMicrotask(() => trigger?.focus());
      },
      { defer: true },
    ),
  );

  function surface() {
    return (
      <DrawerSurface
        state={state}
        phase={presence.state()}
        adapter={formAdapter()}
        onClose={controller.closeDrawer}
        onAuthSuccess={controller.handleAuthSuccess}
        onAdapterSuccess={(action) => props.onSuccess?.(action)}
        onAdapterError={(error, action) => props.onError?.(error, action)}
      />
    );
  }

  return (
    <>
      <Show when={!props.hideTrigger}>
        <TriggerButton
          ref={(element) => (trigger = element)}
          open={state().open}
          title={state().resolved.ui.copy.trigger.title}
          openLabel={state().resolved.ui.copy.trigger.open}
          closeLabel={state().resolved.ui.copy.trigger.close}
          class={props.triggerClassName ?? props.className}
          onClick={controller.toggleDrawer}
        />
      </Show>

      <Show when={ready() && presence.present()}>
        <Show when={portal()} fallback={surface()}>
          {(element) => <Portal mount={element()}>{surface()}</Portal>}
        </Show>
      </Show>
    </>
  );
}
