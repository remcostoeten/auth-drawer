import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";
import { EASE_OUT } from "../constants";

type Props = {
  error?: string | null;
  id?: string;
  tone?: "error" | "success";
  live?: boolean;
  variant?: "default" | "chip";
};

/**
 * Announces form validation feedback when present.
 *
 * @param props - Optional error text and element id.
 * @returns Accessible alert text or null.
 */
export function ValidationMessage({
  error,
  id,
  tone = "error",
  live = false,
  variant = "default",
}: Props) {
  const role = live ? "status" : tone === "error" ? "alert" : "status";

  return (
    <AnimatePresence initial={false}>
      {error ? (
        <motion.p
          key={`${id ?? tone}-${error}`}
          id={id}
          role={role}
          aria-live={live ? "polite" : undefined}
          initial={{ opacity: 0, y: -3, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -3, scale: 0.985 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className={cn(
            "mt-1.5 flex items-center gap-1.5 text-[0.8125rem]",
            variant === "chip" &&
              "inline-flex rounded-full border border-overlay-border/12 bg-overlay-surface/45 px-2.5 py-1 text-[0.76rem] leading-none",
            tone === "error"
              ? variant === "chip"
                ? "text-overlay-error"
                : "text-overlay-error"
              : variant === "chip"
                ? "text-overlay-text/80"
                : "text-overlay-muted",
          )}
        >
          {error}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
