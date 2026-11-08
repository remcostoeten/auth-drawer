import { AuthButton, type ButtonFeedback } from "./auth-button";
import { KeyRoundIcon } from "../icons/ui-icons";

type Props = {
  label: string;
  isLoading: boolean;
  disabled: boolean;
  onAction: () => void;
  feedback?: ButtonFeedback;
  badge?: string;
};

export function PasskeyButton(props: Props) {
  return (
    <div class="auth-rise mb-6" style={{ "--auth-i": 2 }} data-auth-passkey="">
      <AuthButton
        variant="outline-solid"
        icon={<KeyRoundIcon size={16} strokeWidth={1.75} />}
        isLoading={props.isLoading}
        disabled={props.disabled}
        onClick={props.onAction}
        feedback={props.feedback}
        badge={props.badge}
      >
        <span class="whitespace-nowrap">{props.label}</span>
      </AuthButton>
    </div>
  );
}
