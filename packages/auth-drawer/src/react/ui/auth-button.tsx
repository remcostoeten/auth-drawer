import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { DUR_PRESS, EASE_OUT } from "@remcostoeten/auth-drawer/core";

export type ButtonFeedback = {
  status: "error" | "success";
  message: string;
};

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
  feedback?: ButtonFeedback;
  /** Small chip at the trailing edge, e.g. "Last used". Hidden while loading or showing feedback. */
  badge?: string;
};

const BASE =
  "auth-button-soft-hover h-11 w-full rounded-none flex items-center justify-center gap-3 border px-5 text-sm font-medium leading-none tracking-[0.01em] cursor-pointer outline-hidden focus-visible:outline-hidden focus-visible:border-overlay-focus/45 focus-visible:bg-overlay-surface-hover/55 overflow-hidden transition-colors duration-200";

const VARIANTS = {
  primary:
    "bg-overlay-surface/36 border-overlay-border/10 text-overlay-text fine-hover:bg-overlay-surface-hover/44 fine-hover:border-overlay-border/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)] dark:bg-overlay-surface/48 dark:fine-hover:bg-overlay-surface-hover/52 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
  "outline-solid":
    "bg-overlay-surface/22 border-overlay-border/10 text-overlay-text fine-hover:bg-overlay-surface-hover/30 fine-hover:border-overlay-border/12 shadow-[inset_0_1px_1px_rgba(0,0,0,0.025)] dark:bg-overlay-surface/28 dark:fine-hover:bg-overlay-surface-hover/34 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]",
} as const;

const SWAP = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
} as const;

const SWAP_TRANSITION = { duration: 0.18, ease: [0.215, 0.61, 0.355, 1] as const };

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
  feedback,
  badge,
}: Props) {
  const isError = !isLoading && feedback?.status === "error";
  const isSuccess = !isLoading && feedback?.status === "success";
  const showBadge = Boolean(badge) && !isLoading && !feedback;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DUR_PRESS, ease: EASE_OUT }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      data-feedback-status={isLoading ? "loading" : (feedback?.status ?? "idle")}
      className={cn(
        BASE,
        VARIANTS[variant],
        "disabled:cursor-not-allowed disabled:opacity-50",
        isError && "border-overlay-error/30",
        showBadge && "relative pr-[4.5rem]",
        className,
      )}
    >
      {showBadge ? (
        <span
          data-auth-badge=""
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-overlay-text/10 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.04em] leading-none text-overlay-muted"
        >
          {badge}
        </span>
      ) : null}
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.span
            key="loading"
            {...SWAP}
            transition={SWAP_TRANSITION}
            className="flex items-center justify-center"
          >
            <span
              role="status"
              aria-label="Loading"
              className="h-4 w-4 animate-spinner rounded-full border-2 border-overlay-subtle border-t-overlay-text"
            />
          </motion.span>
        ) : isError ? (
          <motion.span
            key="error"
            {...SWAP}
            transition={SWAP_TRANSITION}
            className="flex min-w-0 items-center gap-2 text-overlay-error"
          >
            <XCircle size={14} aria-hidden="true" strokeWidth={2} className="shrink-0" />
            <span className="truncate">{feedback!.message}</span>
          </motion.span>
        ) : isSuccess ? (
          <motion.span
            key="success"
            {...SWAP}
            transition={SWAP_TRANSITION}
            className="flex min-w-0 items-center gap-2"
          >
            <CheckCircle2 size={14} aria-hidden="true" strokeWidth={2} className="shrink-0" />
            <span className="truncate">{feedback!.message}</span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            {...SWAP}
            transition={SWAP_TRANSITION}
            className="flex items-center gap-3"
          >
            {icon ? <span className="shrink-0">{icon}</span> : null}
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
