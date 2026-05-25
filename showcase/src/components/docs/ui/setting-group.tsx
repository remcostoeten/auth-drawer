import type { ReactNode } from "react";

export function SettingGroup({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-foreground/10 overflow-hidden rounded-[5px] border border-foreground/10 bg-background/50">
      {children}
    </div>
  );
}

export function SettingGroupHeader({
  title,
  hint,
  isEdited,
  onReset,
}: {
  title: string;
  hint?: string;
  isEdited?: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/42">
          {title}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs leading-5 text-foreground/48">{hint}</p>
        ) : null}
      </div>
      {isEdited && onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-[0.66rem] font-semibold text-foreground/42 transition-colors hover:text-foreground"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

export function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <div className="min-w-0">
        <span className="text-sm text-foreground">{label}</span>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-foreground/48">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          checked
            ? "relative h-6 w-10 shrink-0 rounded-full bg-foreground transition-colors"
            : "relative h-6 w-10 shrink-0 rounded-full bg-foreground/15 transition-colors hover:bg-foreground/22"
        }
      >
        <span
          className={
            checked
              ? "absolute top-0.5 left-[1.125rem] h-5 w-5 rounded-full bg-background shadow-sm transition-[left]"
              : "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-[left]"
          }
        />
      </button>
    </div>
  );
}

export function CheckboxRow({
  label,
  checked,
  order,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  order?: number;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded-[3px] border-foreground/25 accent-foreground"
      />
      <span className="min-w-0 flex-1 text-sm text-foreground">{label}</span>
      {checked && order !== undefined ? (
        <span
          className="font-mono text-[0.65rem] font-semibold tabular-nums text-foreground/38"
          title="Display order"
        >
          #{order}
        </span>
      ) : null}
    </label>
  );
}
