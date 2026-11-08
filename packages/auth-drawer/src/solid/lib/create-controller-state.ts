import { createSignal, onCleanup, type Accessor } from "solid-js";
import type { Controller } from "@remcostoeten/auth-drawer/core";

/**
 * @name createControllerState
 * @description Subscribes the current reactive owner to a core controller and returns an accessor
 * for its immutable state. The subscription ends when the owner is disposed, which also stops the
 * controller's timers and listeners once it has no other subscriber.
 *
 * @example
 * const state = createControllerState(form);
 * return <h2>{state().title}</h2>;
 */
export function createControllerState<State>(controller: Controller<State>): Accessor<State> {
  const [state, setState] = createSignal(controller.getState());
  const stop = controller.subscribe(() => setState(() => controller.getState()));
  setState(() => controller.getState());
  onCleanup(stop);
  return state;
}
