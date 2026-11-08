import { Index, Show, createSignal } from "solid-js";
import type { ResolvedAuthFieldCopy } from "@remcostoeten/auth-drawer/core";
import { DOMAINS, suggestEmailCompletion } from "@remcostoeten/auth-drawer/core";
import { cn } from "../lib/cn";
import { Kbd } from "./kbd";
import { INPUT_CLASS } from "./input-styles";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSuggestionAccept: (value: string) => void;
  copy: ResolvedAuthFieldCopy;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  autocompleteConfig?: {
    enabled?: boolean;
    domains?: string[];
  };
};

export function EmailField(props: Props) {
  const [suggestion, setSuggestion] = createSignal("");

  function suggestFor(value: string) {
    const enabled = props.autocompleteConfig?.enabled ?? true;
    const domains = props.autocompleteConfig?.domains ?? DOMAINS;
    return enabled ? suggestEmailCompletion(value, domains) : "";
  }

  function changeEmail(value: string) {
    props.onChange(value);
    setSuggestion(suggestFor(value));
  }

  function acceptSuggestion(event: KeyboardEvent) {
    if (event.key !== "Tab" || !suggestion()) return;

    event.preventDefault();
    props.onChange(suggestion());
    props.onSuggestionAccept(suggestion());
    setSuggestion("");
  }

  const completion = () =>
    suggestion().startsWith(props.value) ? suggestion().slice(props.value.length) : "";

  return (
    <div class="relative">
      <label for={props.id} class="sr-only">
        {props.copy.label}
      </label>
      <Show when={suggestion() && completion()}>
        <div
          class="pointer-events-none absolute inset-0 z-0 flex items-center px-4 text-sm text-overlay-subtle"
          aria-hidden="true"
        >
          <span class="invisible whitespace-pre">{props.value}</span>
          <span class="whitespace-pre">
            <Index each={completion().split("")}>
              {(char, index) => (
                <span class="auth-suggestion-char" style={{ "--auth-char": index }}>
                  {char()}
                </span>
              )}
            </Index>
          </span>
        </div>
        <div
          class="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2"
          aria-hidden="true"
        >
          <Kbd>Tab</Kbd>
        </div>
      </Show>
      <input
        id={props.id}
        type="email"
        placeholder={props.copy.placeholder}
        value={props.value}
        onInput={(event) => changeEmail(event.currentTarget.value)}
        onKeyDown={acceptSuggestion}
        required
        autocomplete="email"
        aria-invalid={props.ariaInvalid || undefined}
        aria-describedby={props.ariaDescribedBy}
        class={cn(INPUT_CLASS, "relative z-1")}
      />
    </div>
  );
}
