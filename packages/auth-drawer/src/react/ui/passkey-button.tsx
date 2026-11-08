import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { AuthButton, type ButtonFeedback } from "./auth-button";

type Props = {
  label: string;
  isLoading: boolean;
  disabled: boolean;
  onAction: () => void;
  feedback?: ButtonFeedback;
  badge?: string;
};

const VIEW = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 },
};

/**
 * The "Continue with a passkey" button, shown when the adapter implements `features.passkey`.
 */
export function PasskeyButton({ label, isLoading, disabled, onAction, feedback, badge }: Props) {
  return (
    <motion.div className="mb-6" variants={VIEW} data-auth-passkey="">
      <AuthButton
        variant="outline-solid"
        icon={<KeyRound size={16} aria-hidden="true" strokeWidth={1.75} />}
        isLoading={isLoading}
        disabled={disabled}
        onClick={onAction}
        feedback={feedback}
        badge={badge}
      >
        <span className="whitespace-nowrap">{label}</span>
      </AuthButton>
    </motion.div>
  );
}
