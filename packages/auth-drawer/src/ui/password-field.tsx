import { useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import { EASE_OUT } from "../constants";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

const INPUT =
  "h-11 w-full rounded-none px-4 text-sm font-normal tracking-[0.01em] bg-transparent text-overlay-text border border-overlay-border/20 outline-hidden placeholder:text-overlay-subtle focus:border-overlay-border/50 aria-invalid:border-overlay-error/35 aria-invalid:focus:border-overlay-error/50 transition-colors";

/**
 * Renders a password input with visibility toggle.
 *
 * @param props - Field id, value, autocomplete, and accessibility state.
 * @returns Password field control.
 */
export function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  ariaInvalid,
  ariaDescribedBy,
}: Props) {
  const [visible, setVisible] = useState(false);

  function changeValue(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Password
      </label>
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder="Password"
        value={value}
        onChange={changeValue}
        required
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(INPUT, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setVisible((next) => !next)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-overlay-muted outline-hidden transition-colors hover:text-overlay-text focus-visible:text-overlay-text focus-visible:outline-hidden"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={visible ? "off" : "on"}
            initial={{ opacity: 0, scale: 0.5, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 18 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            {visible ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}
