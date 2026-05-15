import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DUR_PRESS, EASE_OUT } from "../constants";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline";
  type?: "button" | "submit";
  icon?: ReactNode;
  ariaLabel?: string;
  className?: string;
};

const BASE =
  "auth-button-soft-hover h-11 w-full rounded-none flex items-center justify-center gap-3 border px-5 text-sm font-medium leading-none tracking-[0.01em] cursor-pointer outline-none focus-visible:border-overlay-border/80 focus-visible:ring-1 focus-visible:ring-overlay-border/40";

const VARIANTS = {
  primary:
    "bg-overlay-surface/82 border-overlay-border/20 text-overlay-text hover:bg-overlay-surface/87 hover:border-overlay-border/26 hover:shadow-[0_10px_22px_rgba(26,20,17,0.055),inset_0_1px_0_rgba(255,255,255,0.42)] shadow-[0_8px_20px_rgba(26,20,17,0.05),inset_0_1px_0_rgba(255,255,255,0.38)] dark:bg-overlay-surface/50 dark:border-overlay-border/10 dark:hover:bg-overlay-surface/70 dark:hover:border-overlay-border/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
  outline:
    "bg-overlay-surface/82 border-overlay-border/20 text-overlay-text hover:bg-overlay-surface/87 hover:border-overlay-border/26 hover:shadow-[0_10px_22px_rgba(26,20,17,0.055),inset_0_1px_0_rgba(255,255,255,0.42)] shadow-[0_8px_20px_rgba(26,20,17,0.05),inset_0_1px_0_rgba(255,255,255,0.38)] dark:bg-overlay-surface/30 dark:border-overlay-border/10 dark:hover:bg-overlay-surface/50 dark:hover:border-overlay-border/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
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
