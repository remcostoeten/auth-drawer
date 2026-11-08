import { useSyncExternalStore } from "react";
import type { Controller } from "@remcostoeten/auth-drawer/core";

/**
 * Subscribes a component to a core controller and returns its current state.
 */
export function useStore<State>(controller: Controller<State>): State {
  return useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
}
