import type {
  ResolvedAuthFieldCopy,
  ResolvedAuthPasswordToggleCopy,
} from "@remcostoeten/auth-drawer/core";
import { PasswordField } from "./password-field";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  copy: ResolvedAuthFieldCopy;
  passwordToggle: ResolvedAuthPasswordToggleCopy;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

export function ConfirmPasswordField(props: Props) {
  return <PasswordField {...props} autoComplete="new-password" />;
}
