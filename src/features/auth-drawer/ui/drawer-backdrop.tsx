import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { DUR_EXIT, EASE_EXIT, EASE_OUT } from "../constants";
import type { MotionSettings } from "../types";

type Props = {
  settings: MotionSettings;
  onClick: () => void;
};

/**
 * Renders the overlay backdrop with static blur and animated opacity.
 *
 * @param props - Motion settings and close action.
 * @returns Backdrop layer pair.
 */
function Backdrop({ settings, onClick }: Props) {
  const background = useMemo(
    () =>
      `linear-gradient(${settings.backdropAngle}deg, ${settings.backdropStartColor} ${settings.backdropStartPos}%, ${settings.backdropEndColor} ${settings.backdropEndPos}%)`,
    [
      settings.backdropAngle,
      settings.backdropEndColor,
      settings.backdropEndPos,
      settings.backdropStartColor,
      settings.backdropStartPos,
    ],
  );

  const blur = useMemo(
    () => `blur(${settings.backdropBlur}px)`,
    [settings.backdropBlur],
  );

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: settings.backdropOpacity,
          transition: {
            duration: 0.25,
            ease: EASE_OUT,
          },
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: DUR_EXIT,
            delay: 0.06,
            ease: EASE_EXIT,
          },
        }}
        style={{ background }}
        onClick={onClick}
        aria-hidden="true"
      />
    </>
  );
}

/**
 * Memoized backdrop layer pair.
 *
 * @returns Backdrop layer pair.
 */
export const DrawerBackdrop = memo(Backdrop);
