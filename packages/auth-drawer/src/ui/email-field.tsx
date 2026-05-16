import { useCallback, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { DOMAINS } from "../constants";
import { Kbd } from "./kbd";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSuggestionAccept: (value: string) => void;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

const INPUT =
  "h-11 w-full rounded-none px-4 text-sm font-normal tracking-[0.01em] bg-transparent text-overlay-text border border-overlay-border/20 outline-hidden placeholder:text-overlay-subtle focus:border-overlay-border/50 aria-invalid:border-overlay-error/35 aria-invalid:focus:border-overlay-error/50 transition-colors";

/**
 * Renders the email field with inline domain completion.
 *
 * @param props - Field id, value, and change callbacks.
 * @returns Email input with optional suggestion.
 */
export function EmailField({
  id,
  value,
  onChange,
  onSuggestionAccept,
  ariaInvalid,
  ariaDescribedBy,
}: Props) {
  const [suggestion, setSuggestion] = useState("");

  const changeEmail = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      onChange(next);

      if (!next.includes("@")) {
        setSuggestion("");
        return;
      }

      const [local, domain] = next.split("@");
      if (domain === undefined) {
        setSuggestion("");
        return;
      }

      const match = DOMAINS.find((item) => item.startsWith(domain));
      setSuggestion(match && match !== domain ? `${local}@${match}` : "");
    },
    [onChange],
  );

  const acceptEmail = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Tab" || !suggestion) return;

      event.preventDefault();
      onChange(suggestion);
      onSuggestionAccept(suggestion);
      setSuggestion("");
    },
    [onChange, onSuggestionAccept, suggestion],
  );

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Email
      </label>
      {suggestion && suggestion.startsWith(value) && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center px-4 text-sm text-overlay-subtle"
            aria-hidden="true"
          >
            <span className="invisible">{value}</span>
            <span>
              {suggestion
                .slice(value.length)
                .split("")
                .map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.01 }}
                  >
                    {char}
                  </motion.span>
                ))}
            </span>
          </div>
          <div
            className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2"
            aria-hidden="true"
          >
            <Kbd>Tab</Kbd>
          </div>
        </>
      )}
      <input
        id={id}
        type="email"
        placeholder="Email"
        value={value}
        onChange={changeEmail}
        onKeyDown={acceptEmail}
        required
        autoComplete="email"
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(INPUT, "relative z-1")}
      />
    </div>
  );
}
