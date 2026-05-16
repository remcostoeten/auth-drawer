import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useRememberMe } from "../hooks/use-remember-me";

type Props = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

/**
 * Renders persisted remember-me checkbox state.
 *
 * @returns Self-contained remember-me control.
 */
export function RememberMe({ checked, onChange }: Props) {
  const [storedChecked, setStoredChecked] = useRememberMe();
  const resolvedChecked = checked ?? storedChecked;

  function changeChecked(next: boolean) {
    onChange?.(next);
    if (checked === undefined) setStoredChecked(next);
  }

  return (
    <label className="group flex cursor-pointer select-none items-center gap-2.5">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={resolvedChecked}
          onChange={(event) => changeChecked(event.target.checked)}
        />
        <motion.div
          className={cn(
            "flex h-4 w-4 items-center justify-center border transition-colors duration-200",
            resolvedChecked
              ? "border-overlay-text bg-overlay-text"
              : "border-overlay-border/20 bg-transparent group-hover:border-overlay-border/40",
          )}
        >
          <AnimatePresence>
            {resolvedChecked && (
              <motion.svg
                initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0, rotate: -15 }}
                transition={{
                  duration: 0.3,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="h-3 w-3 text-overlay-bg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.polyline
                  points="20 6 9 17 4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: 0.05,
                    ease: "easeOut",
                  }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <span className="text-[0.8125rem] font-medium text-overlay-muted transition-colors group-hover:text-overlay-text">
        Remember me
      </span>
    </label>
  );
}
