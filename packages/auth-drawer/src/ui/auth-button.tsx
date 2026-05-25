import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { DUR_PRESS, EASE_OUT } from "../constants";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline-solid";
  type?: "button" | "submit";
  icon?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

const BASE =
  "auth-button-soft-hover h-11 w-full rounded-none flex items-center justify-center gap-3 border px-5 text-sm font-medium leading-none tracking-[0.01em] cursor-pointer outline-hidden focus-visible:outline-none focus-visible:border-overlay-border/80 focus-visible:ring-1 focus-visible:ring-overlay-border/40";

const VARIANTS = {
  primary:
    "bg-overlay-surface/36 border-overlay-border/10 text-overlay-text fine-hover:bg-overlay-surface-hover/44 fine-hover:border-overlay-border/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] dark:bg-overlay-surface/48 dark:fine-hover:bg-overlay-surface-hover/52 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
  "outline-solid":
    "bg-overlay-surface/22 border-overlay-border/10 text-overlay-text fine-hover:bg-overlay-surface-hover/30 fine-hover:border-overlay-border/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.025)] dark:bg-overlay-surface/28 dark:fine-hover:bg-overlay-surface-hover/34 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
} as const;

/**
 * Renders a shared auth action button.
 *
 * @param props - Button content, loading state, and visual variant.
 * @returns Motion-enabled auth button.
 */
export function AuthButton({
  children,
  onClick,
  isLoading,
  disabled,
  variant = "primary",
  type = "button",
  icon,
  ariaLabel,
  className,
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DUR_PRESS, ease: EASE_OUT }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isLoading ? (
        <span
          role="status"
          aria-label="Loading"
          className="h-4 w-4 animate-spinner rounded-full border-2 border-overlay-subtle border-t-overlay-text"
        />
      ) : (
        <>
          {icon ? <span className="shrink-0">{icon}</span> : null}
          {children}
        </>
      )}
    </motion.button>
  );
}
