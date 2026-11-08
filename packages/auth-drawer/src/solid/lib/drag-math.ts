import type { MotionSettings } from "@remcostoeten/auth-drawer/core";

export type Spring = { position: number; velocity: number };

export type SpringSettings = Pick<MotionSettings, "snapStiffness" | "snapDamping" | "snapMass">;

const REST_DISTANCE = 0.5;
const REST_VELOCITY = 5;

/**
 * @name resistUpwardOffset
 * @description Applies progressive rubber-band resistance to an upward drag. Returns a negative
 * offset that approaches `maxUpward` the further the pointer travels.
 *
 * @example
 * resistUpwardOffset(-200, 0.5 * 800, 0.15); // about -23
 */
export function resistUpwardOffset(offset: number, maxUpward: number, resistance: number) {
  const distance = Math.abs(offset);
  return -((distance * maxUpward) / (distance + maxUpward / resistance));
}

/**
 * @name shouldDismissDrag
 * @description Decides whether a released drag closes the drawer, either because it travelled past
 * the downward threshold (a fraction of the viewport height) or because it was flung down fast
 * enough.
 *
 * @example
 * shouldDismissDrag(300, 0, 800, { downwardThreshold: 0.25, velocityThreshold: 500 }); // true
 */
export function shouldDismissDrag(
  offset: number,
  velocity: number,
  viewportHeight: number,
  settings: Pick<MotionSettings, "downwardThreshold" | "velocityThreshold">,
) {
  return offset > viewportHeight * settings.downwardThreshold || velocity > settings.velocityThreshold;
}

/**
 * @name stepSpring
 * @description Advances a damped spring toward zero by `seconds` using semi-implicit Euler
 * integration. Used for the snap-back after a drag that is not dismissed.
 *
 * @example
 * stepSpring({ position: 80, velocity: 0 }, 1 / 60, { snapStiffness: 850, snapDamping: 14, snapMass: 0.8 });
 */
export function stepSpring(state: Spring, seconds: number, settings: SpringSettings): Spring {
  const force = -settings.snapStiffness * state.position - settings.snapDamping * state.velocity;
  const velocity = state.velocity + (force / settings.snapMass) * seconds;
  return { position: state.position + velocity * seconds, velocity };
}

/**
 * @name isSpringAtRest
 * @description Whether a spring is close enough to its target, and slow enough, to stop animating.
 *
 * @example
 * isSpringAtRest({ position: 0.1, velocity: 1 }); // true
 */
export function isSpringAtRest(state: Spring) {
  return Math.abs(state.position) < REST_DISTANCE && Math.abs(state.velocity) < REST_VELOCITY;
}
