import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import type { ResolvedAuthMagicLinkCopy } from "@remcostoeten/auth-drawer/core";
import { formatCopy } from "@remcostoeten/auth-drawer/core";
import { AuthButton } from "./auth-button";

type Props = {
  email: string;
  copy: ResolvedAuthMagicLinkCopy;
  cooldownSeconds: number;
  isSending: boolean;
  onResend: () => void;
  onUseAnotherEmail: () => void;
  errorMessage?: string;
};

const PANEL_VIEW = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
} as const;

/**
 * Post-send state of the magic-link flow: confirms the address, offers a
 * throttled resend, and a way back to the email field.
 */
export function MagicLinkSent({
  email,
  copy,
  cooldownSeconds,
  isSending,
  onResend,
  onUseAnotherEmail,
  errorMessage,
}: Props) {
  const waiting = cooldownSeconds > 0;

  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      variants={PANEL_VIEW}
      initial="hidden"
      animate="visible"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center border border-overlay-border/20 text-overlay-text"
      >
        <MailCheck size={20} strokeWidth={1.5} />
      </span>

      <span className="sr-only" role="status" aria-live="polite">
        {formatCopy(copy.sentSubtitle, { email })}
      </span>

      <AuthButton
        variant="outline-solid"
        onClick={onResend}
        isLoading={isSending}
        disabled={waiting || isSending}
        feedback={errorMessage ? { status: "error", message: errorMessage } : undefined}
      >
        {waiting
          ? formatCopy(copy.resendCountdown, { seconds: String(cooldownSeconds) })
          : copy.resend}
      </AuthButton>

      <button
        type="button"
        onClick={onUseAnotherEmail}
        className="cursor-pointer rounded-sm px-1 text-sm text-overlay-muted underline underline-offset-4 transition-colors hover:text-overlay-text focus-visible:outline-hidden focus-visible:text-overlay-focus"
      >
        {copy.useAnotherEmail}
      </button>
    </motion.div>
  );
}
