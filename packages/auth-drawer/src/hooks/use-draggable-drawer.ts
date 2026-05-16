import { useCallback, useState } from "react";
import { animate, useMotionValue, type PanInfo } from "framer-motion";
import { UPWARD_LIMIT } from "../constants";
import type { MotionSettings } from "../types";

/**
 * Manages gesture-driven drawer dismissal with spring snap-back.
 * Upward drag applies progressive rubber-band resistance.
 *
 * @param onClose - Called when dismiss gesture completes.
 * @param enabled - Whether drag handling is active.
 * @param settings - Motion constants for physics.
 * @returns Motion values and drag handlers for the drawer.
 */
export function useDraggableDrawer(
  onClose: () => void,
  enabled: boolean,
  settings: MotionSettings,
) {
  const y = useMotionValue(0);
  const rawY = useMotionValue(0);
  const [isDragging, setDragging] = useState(false);

  const onDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enabled) return;

      setDragging(true);

      const offset = info.offset.y;
      rawY.set(offset);

      if (offset > 0) {
        y.set(offset);
        return;
      }

      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const maxUpward = vh * UPWARD_LIMIT;
      const absOffset = Math.abs(offset);
      const resistedY =
        (absOffset * maxUpward) / (absOffset + maxUpward / settings.upwardResistance);

      y.set(-resistedY);
    },
    [enabled, rawY, settings.upwardResistance, y],
  );

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enabled) return;

      setDragging(false);

      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const shouldClose =
        info.offset.y > vh * settings.downwardThreshold ||
        info.velocity.y > settings.velocityThreshold;

      if (shouldClose) {
        onClose();
        return;
      }

      animate(y, 0, {
        type: "spring",
        stiffness: settings.snapStiffness,
        damping: settings.snapDamping,
        mass: settings.snapMass,
        velocity: info.velocity.y,
      });
      animate(rawY, 0, {
        type: "spring",
        stiffness: settings.snapStiffness,
        damping: settings.snapDamping,
        mass: settings.snapMass,
        velocity: info.velocity.y,
      });
    },
    [
      enabled,
      onClose,
      rawY,
      settings.downwardThreshold,
      settings.snapDamping,
      settings.snapMass,
      settings.snapStiffness,
      settings.velocityThreshold,
      y,
    ],
  );

  return { y, rawY, isDragging, onDrag, onDragEnd };
}
