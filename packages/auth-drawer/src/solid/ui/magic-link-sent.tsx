import type { ResolvedAuthMagicLinkCopy } from "@remcostoeten/auth-drawer/core";
import { formatCopy } from "@remcostoeten/auth-drawer/core";
import { MailCheckIcon } from "../icons/ui-icons";
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

export function MagicLinkSent(props: Props) {
  const waiting = () => props.cooldownSeconds > 0;

  return (
    <div class="auth-rise flex flex-col items-center gap-4" style={{ "--auth-rise-y": "8px", "--auth-i": 0 }}>
      <span
        aria-hidden="true"
        class="flex h-12 w-12 items-center justify-center border border-overlay-border/20 text-overlay-text"
      >
        <MailCheckIcon size={20} strokeWidth={1.5} />
      </span>

      <span class="sr-only" role="status" aria-live="polite">
        {formatCopy(props.copy.sentSubtitle, { email: props.email })}
      </span>

      <AuthButton
        variant="outline-solid"
        onClick={props.onResend}
        isLoading={props.isSending}
        disabled={waiting() || props.isSending}
        feedback={props.errorMessage ? { status: "error", message: props.errorMessage } : undefined}
      >
        {waiting()
          ? formatCopy(props.copy.resendCountdown, { seconds: String(props.cooldownSeconds) })
          : props.copy.resend}
      </AuthButton>

      <button
        type="button"
        onClick={() => props.onUseAnotherEmail()}
        class="cursor-pointer rounded-sm px-1 text-sm text-overlay-muted underline underline-offset-4 transition-colors hover:text-overlay-text focus-visible:outline-hidden focus-visible:text-overlay-focus"
      >
        {props.copy.useAnotherEmail}
      </button>
    </div>
  );
}
