import { Show, createSignal } from "solid-js";
import type {
  ResolvedAuthFieldCopy,
  ResolvedAuthPasswordToggleCopy,
} from "@remcostoeten/auth-drawer/core";
import { EyeIcon, EyeOffIcon } from "../icons/ui-icons";
import { cn } from "../lib/cn";
import { INPUT_CLASS } from "./input-styles";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  copy: ResolvedAuthFieldCopy;
  passwordToggle: ResolvedAuthPasswordToggleCopy;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

export function PasswordField(props: Props) {
  const [visible, setVisible] = createSignal(false);

  return (
    <div class="relative">
      <label for={props.id} class="sr-only">
        {props.copy.label}
      </label>
      <input
        id={props.id}
        type={visible() ? "text" : "password"}
        placeholder={props.copy.placeholder}
        value={props.value}
        onInput={(event) => props.onChange(event.currentTarget.value)}
        required
        autocomplete={props.autoComplete}
        aria-invalid={props.ariaInvalid || undefined}
        aria-describedby={props.ariaDescribedBy}
        class={cn(INPUT_CLASS, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setVisible((next) => !next)}
        class="absolute right-4 top-1/2 -translate-y-1/2 text-overlay-muted outline-hidden transition-colors hover:text-overlay-text focus-visible:text-overlay-focus focus-visible:outline-hidden"
        aria-label={visible() ? props.passwordToggle.hide : props.passwordToggle.show}
        aria-pressed={visible()}
      >
        <Show
          when={visible()}
          fallback={
            <span class="auth-icon-in">
              <EyeIcon size={16} />
            </span>
          }
        >
          <span class="auth-icon-in">
            <EyeOffIcon size={16} />
          </span>
        </Show>
      </button>
    </div>
  );
}
