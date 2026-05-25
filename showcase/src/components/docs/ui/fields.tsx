import { ChevronDown } from "lucide-react";
import { EditedDot } from "./edited-dot";

export type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  isEdited?: boolean;
  onReset?: () => void;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  isEdited,
  onReset,
}: SelectFieldProps<T>) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
        {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className="h-10 w-full appearance-none rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 pr-9 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden dark:bg-[#0f0f10]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40"
        />
      </span>
    </label>
  );
}

export type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  isEdited?: boolean;
  onReset?: () => void;
};

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  isEdited,
  onReset,
}: SliderFieldProps) {
  return (
    <label className="block rounded-[5px] border border-foreground/10 bg-foreground/[0.025] px-3 py-2.5">
      <span className="mb-1.5 flex items-center justify-between text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
        <span className="flex items-center">
          {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
          {label}
        </span>
        <span className="font-mono text-[0.68rem] font-semibold text-foreground/60">
          {value}
        </span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
    </label>
  );
}

export type NumberFieldProps = {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
  isEdited?: boolean;
  onReset?: () => void;
};

export function NumberField({
  label,
  value,
  step,
  onChange,
  isEdited,
  onReset,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
        {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden dark:bg-[#0f0f10]"
      />
    </label>
  );
}

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isEdited?: boolean;
  onReset?: () => void;
};

export function TextField({
  label,
  value,
  onChange,
  isEdited,
  onReset,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
        {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden dark:bg-[#0f0f10]"
      />
    </label>
  );
}

export type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isEdited?: boolean;
  onReset?: () => void;
};

export function ColorField({
  label,
  value,
  onChange,
  isEdited,
  onReset,
}: ColorFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
        {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
        {label}
      </span>
      <div className="flex h-10 overflow-hidden rounded-[5px] border border-foreground/10 bg-[#0f0f10]">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 border-0 bg-transparent p-1 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-xs font-semibold text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden"
        />
      </div>
    </label>
  );
}
