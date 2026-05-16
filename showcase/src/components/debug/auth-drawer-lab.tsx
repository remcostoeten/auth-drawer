import { useTheme } from "next-themes";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clipboard,
  Laptop,
  Moon,
  Newspaper,
  Rocket,
  Settings2,
  ShoppingBag,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  type AuthBackdropConfig,
  type AuthConfig,
  type AuthConfigGroup,
  type DrawerMode,
  type DrawerPosition,
  type MotionSettings,
  type OAuthProvider,
  type AuthTriggerConfig,
  type AuthTriggerStore,
} from "@/components/auth/auth-drawer";
import { createAuthTriggerStore } from "@remcostoeten/auth-drawer";
import { MediumPaywallScene } from "@/components/debug/scenes/medium-paywall";
import { WindowsXpScene } from "@/components/debug/scenes/windows-xp";
import { AUTH_SCENARIOS, type AuthScenarioId, createScenarioHandlers } from "./auth-scenarios";

const WIDTHS = ["392px", "448px", "520px"] as const;
const PROVIDERS: OAuthProvider[] = ["github", "google"];
const EASE_OPTIONS = ["[0.23,1,0.32,1]", "easeOut", "easeInOut", "linear"] as const;
const FORM_JUSTIFY_OPTIONS = ["center", "flex-start", "flex-end", "space-between"] as const;
const FORM_ALIGN_OPTIONS = ["center", "flex-start", "flex-end", "stretch"] as const;
const DOUBLE_PRESS_DELAY = 300;
const LAB_SCENES = [
  { value: "dashboard", label: "Dash", icon: BarChart3 },
  { value: "windows", label: "XP", icon: Laptop },
  { value: "medium", label: "Post", icon: Newspaper },
  { value: "saas", label: "SaaS", icon: Rocket },
  { value: "checkout", label: "Shop", icon: ShoppingBag },
] as const;
const LAB_SCENE_VALUES = LAB_SCENES.map((item) => item.value);
const DRAWER_MODES = ["drawer", "modal"] as const;
const DRAWER_POSITIONS = ["left", "center", "right"] as const;
const OAUTH_LAYOUTS = ["row", "column"] as const;
const AUTH_MODES = ["login", "register"] as const;
const AUTH_SCENARIO_IDS = AUTH_SCENARIOS.map((item) => item.id);
const CONFIG_PARAM = "config";
const SHOWCASE_PARAM = "showcase";

type LabScene = (typeof LAB_SCENES)[number]["value"];
type LabAuthFlags = Required<
  Pick<
    AuthConfigGroup,
    | "allowRegister"
    | "showRememberMe"
    | "initialMode"
    | "showForgotPassword"
    | "showLivePasswordMatch"
  >
>;
type LabBackdrop = Required<AuthBackdropConfig> & {
  gradient: Required<NonNullable<AuthBackdropConfig["gradient"]>>;
};
type LabTriggers = {
  pageLoadEnabled: boolean;
  pageLoadDelayMs: number;
  scrollEnabled: boolean;
  scrollThreshold: number;
  scrollOnce: boolean;
  scrollCooldownMs: number;
};
type LabUrlSnapshot = Partial<{
  scene: LabScene;
  displayMode: DrawerMode;
  oauthLayout: "row" | "column";
  desktopPosition: DrawerPosition;
  desktopWidth: (typeof WIDTHS)[number];
  providers: OAuthProvider[];
  authFlags: LabAuthFlags;
  defaultOpen: boolean;
  backdrop: LabBackdrop;
  motion: MotionSettings;
  triggers: LabTriggers;
  scenario: AuthScenarioId;
}>;

function isOneOf<const T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function encodeSnapshot(snapshot: LabUrlSnapshot) {
  return window.btoa(encodeURIComponent(JSON.stringify(snapshot)));
}

function decodeSnapshot(value: string | null): LabUrlSnapshot {
  if (!value) return {};

  try {
    const parsed = JSON.parse(decodeURIComponent(window.atob(value)));
    return isPlainObject(parsed) ? sanitizeSnapshot(parsed) : {};
  } catch {
    return {};
  }
}

function readLabUrlSnapshot(): LabUrlSnapshot {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const snapshot = decodeSnapshot(params.get(CONFIG_PARAM));
  const showcase = params.get(SHOWCASE_PARAM);

  if (isOneOf(showcase, LAB_SCENE_VALUES)) {
    snapshot.scene = showcase;
  }

  return snapshot;
}

function sanitizeProviders(value: unknown): OAuthProvider[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((provider): provider is OAuthProvider => isOneOf(provider, PROVIDERS));
}

function sanitizeAuthFlags(value: unknown): LabAuthFlags | undefined {
  if (!isPlainObject(value)) return undefined;

  return {
    allowRegister: isBoolean(value.allowRegister)
      ? value.allowRegister
      : DEFAULT_CONFIG.ui.auth.allowRegister,
    showRememberMe: isBoolean(value.showRememberMe)
      ? value.showRememberMe
      : DEFAULT_CONFIG.ui.auth.showRememberMe,
    initialMode: isOneOf(value.initialMode, AUTH_MODES)
      ? value.initialMode
      : DEFAULT_CONFIG.ui.auth.initialMode,
    showForgotPassword: isBoolean(value.showForgotPassword)
      ? value.showForgotPassword
      : DEFAULT_CONFIG.ui.auth.showForgotPassword,
    showLivePasswordMatch: isBoolean(value.showLivePasswordMatch)
      ? value.showLivePasswordMatch
      : DEFAULT_CONFIG.ui.auth.showLivePasswordMatch,
  };
}

function sanitizeBackdrop(value: unknown): LabBackdrop | undefined {
  if (!isPlainObject(value)) return undefined;
  const defaultBackdrop = DEFAULT_CONFIG.ui.visual.backdrop;
  const gradient = isPlainObject(value.gradient) ? value.gradient : {};

  return {
    color: typeof value.color === "string" ? value.color : defaultBackdrop.color,
    opacity: isNumber(value.opacity) ? value.opacity : defaultBackdrop.opacity,
    blur: isNumber(value.blur) ? value.blur : defaultBackdrop.blur,
    gradient: {
      angle: isNumber(gradient.angle) ? gradient.angle : defaultBackdrop.gradient.angle,
      from: typeof gradient.from === "string" ? gradient.from : defaultBackdrop.gradient.from,
      to: typeof gradient.to === "string" ? gradient.to : defaultBackdrop.gradient.to,
      fromPos: isNumber(gradient.fromPos) ? gradient.fromPos : defaultBackdrop.gradient.fromPos,
      toPos: isNumber(gradient.toPos) ? gradient.toPos : defaultBackdrop.gradient.toPos,
    },
  };
}

function sanitizeMotion(value: unknown): MotionSettings | undefined {
  if (!isPlainObject(value)) return undefined;
  const defaults = DEFAULT_CONFIG.ui.motion;

  return {
    ...defaults,
    ...value,
    displayMode: isOneOf(value.displayMode, DRAWER_MODES)
      ? value.displayMode
      : defaults.displayMode,
    desktopPosition: isOneOf(value.desktopPosition, DRAWER_POSITIONS)
      ? value.desktopPosition
      : defaults.desktopPosition,
    desktopWidth: isOneOf(value.desktopWidth, WIDTHS) ? value.desktopWidth : defaults.desktopWidth,
  } as MotionSettings;
}

function sanitizeTriggers(value: unknown): LabTriggers | undefined {
  if (!isPlainObject(value)) return undefined;

  return {
    pageLoadEnabled: isBoolean(value.pageLoadEnabled) ? value.pageLoadEnabled : false,
    pageLoadDelayMs: isNumber(value.pageLoadDelayMs) ? value.pageLoadDelayMs : 0,
    scrollEnabled: isBoolean(value.scrollEnabled) ? value.scrollEnabled : true,
    scrollThreshold: isNumber(value.scrollThreshold) ? value.scrollThreshold : 0.25,
    scrollOnce: isBoolean(value.scrollOnce) ? value.scrollOnce : true,
    scrollCooldownMs: isNumber(value.scrollCooldownMs) ? value.scrollCooldownMs : 0,
  };
}

function sanitizeSnapshot(raw: Record<string, unknown>): LabUrlSnapshot {
  return {
    scene: isOneOf(raw.scene, LAB_SCENE_VALUES) ? raw.scene : undefined,
    displayMode: isOneOf(raw.displayMode, DRAWER_MODES) ? raw.displayMode : undefined,
    oauthLayout: isOneOf(raw.oauthLayout, OAUTH_LAYOUTS) ? raw.oauthLayout : undefined,
    desktopPosition: isOneOf(raw.desktopPosition, DRAWER_POSITIONS)
      ? raw.desktopPosition
      : undefined,
    desktopWidth: isOneOf(raw.desktopWidth, WIDTHS) ? raw.desktopWidth : undefined,
    providers: sanitizeProviders(raw.providers),
    authFlags: sanitizeAuthFlags(raw.authFlags),
    defaultOpen: isBoolean(raw.defaultOpen) ? raw.defaultOpen : undefined,
    backdrop: sanitizeBackdrop(raw.backdrop),
    motion: sanitizeMotion(raw.motion),
    triggers: sanitizeTriggers(raw.triggers),
    scenario: isOneOf(raw.scenario, AUTH_SCENARIO_IDS) ? raw.scenario : undefined,
  };
}

function labelForProvider(provider: OAuthProvider) {
  return provider === "github" ? "GitHub" : "Google";
}

function cycleProvider(providers: OAuthProvider[], provider: OAuthProvider): OAuthProvider[] {
  if (providers.includes(provider)) {
    return providers.filter((item) => item !== provider);
  }

  return [...providers, provider];
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function stopLabEvent(event: SyntheticEvent) {
  event.stopPropagation();
}

function formatConfigLiteral(config: AuthConfig): string {
  return JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, "$1:");
}

function generateUsageCode(config: AuthConfig): string {
  return [
    "<AuthDrawer",
    "  config={",
    formatConfigLiteral(config)
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n"),
    "  }",
    "  open={open}",
    "  onOpenChange={setOpen}",
    "/>",
  ].join("\n");
}

function PropUsage({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 rounded-[4px] border border-overlay-border/12 bg-overlay-bg/35 p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-overlay-subtle">
          <Clipboard size={13} aria-hidden="true" />
          Implementation
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-7 items-center gap-1.5 rounded-[4px] border border-overlay-border/12 bg-overlay-surface/55 px-2 text-[0.66rem] font-semibold text-overlay-muted transition-[border-color,color,transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-overlay-border/25 hover:text-overlay-text active:scale-[0.97]"
        >
          {copied ? (
            <Check size={12} aria-hidden="true" />
          ) : (
            <Clipboard size={12} aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="custom-scrollbar overflow-x-auto border border-overlay-border/10 bg-black/[0.035] p-3 text-[0.65rem] leading-relaxed text-overlay-muted dark:bg-white/[0.035]">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

type SegmentProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

function Segment<T extends string>({ label, value, options, onChange }: SegmentProps<T>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
        {label}
      </span>
      <div
        className="grid gap-1 rounded-[4px] border border-overlay-border/12 bg-overlay-bg/35 p-1"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              value === option.value
                ? "h-8 rounded-[3px] bg-overlay-text px-2 text-xs font-semibold text-overlay-bg"
                : "h-8 rounded-[3px] px-2 text-xs font-medium text-overlay-muted transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-overlay-surface/55 hover:text-overlay-text active:scale-[0.97]"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </label>
  );
}

type SceneOptionProps = {
  scene: LabScene;
  onSceneChange: (scene: LabScene) => void;
};

function SceneOptions({ scene, onSceneChange }: SceneOptionProps) {
  return (
    <div>
      <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
        Backdrop
      </span>
      <div className="grid grid-cols-5 gap-1 rounded-[4px] border border-overlay-border/12 bg-overlay-bg/35 p-1">
        {LAB_SCENES.map((item) => {
          const Icon = item.icon;
          const isActive = scene === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSceneChange(item.value)}
              className={
                isActive
                  ? "flex h-9 items-center justify-center rounded-[3px] border border-overlay-text bg-overlay-text text-overlay-bg"
                  : "flex h-9 items-center justify-center rounded-[3px] border border-transparent text-overlay-muted transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-overlay-border/18 hover:bg-overlay-surface/55 hover:text-overlay-text active:scale-[0.97]"
              }
              aria-label={`${item.label} backdrop`}
              title={`${item.label} backdrop`}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

type InfoTipProps = {
  children: string;
};

function InfoTip({ children }: InfoTipProps) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={children}
        className="flex h-4 w-4 cursor-help items-center justify-center border border-overlay-border/18 text-[0.625rem] font-bold text-overlay-subtle outline-hidden transition-[border-color,color,background-color] duration-150 hover:border-overlay-border/35 hover:bg-overlay-surface/45 hover:text-overlay-text focus-visible:border-overlay-border/40 focus-visible:text-overlay-text"
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-130 mb-2 w-56 -translate-x-1/2 translate-y-1 border border-overlay-border/12 bg-overlay-surface px-2.5 py-2 text-[0.7rem] font-medium leading-relaxed text-overlay-muted opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {children}
      </span>
    </span>
  );
}

type FieldLabelProps = {
  children: string;
  info?: string;
};

function FieldLabel({ children, info }: FieldLabelProps) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
      {children}
      {info ? <InfoTip>{info}</InfoTip> : null}
    </span>
  );
}

type ThemeToggleProps = {
  theme: string | undefined;
  onToggle: () => void;
};

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme !== "light";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex h-9 items-center gap-2 rounded-[4px] border border-overlay-border/12 bg-overlay-bg/35 px-2.5 text-xs font-semibold text-overlay-muted transition-[border-color,color,transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-overlay-border/25 hover:bg-overlay-surface/55 hover:text-overlay-text active:scale-[0.97]"
      title="Toggle theme: double-press Right Shift"
    >
      {isDark ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
      <span className="relative h-4 w-7 rounded-[3px] border border-overlay-border/20 bg-overlay-bg/40">
        <span
          className={
            isDark
              ? "absolute right-0.5 top-0.5 h-3 w-3 bg-overlay-text transition-transform"
              : "absolute left-0.5 top-0.5 h-3 w-3 bg-overlay-text transition-transform"
          }
        />
      </span>
    </button>
  );
}

type ToggleFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  info?: string;
};

function ToggleField({ label, checked, onChange, info }: ToggleFieldProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[4px] border border-overlay-border/10 bg-overlay-bg/28 px-3 py-2">
      <FieldLabel info={info}>{label}</FieldLabel>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          checked
            ? "relative h-6 w-11 rounded-[3px] bg-overlay-text transition-colors"
            : "relative h-6 w-11 rounded-[3px] border border-overlay-border/18 bg-overlay-bg/45 transition-colors"
        }
      >
        <span
          className={
            checked
              ? "absolute right-1 top-1 h-4 w-4 rounded-[2px] bg-overlay-bg transition-transform"
              : "absolute left-1 top-1 h-4 w-4 rounded-[2px] bg-overlay-muted transition-transform"
          }
        />
      </button>
    </label>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  info?: string;
};

function NumberField({ label, value, onChange, min, max, step = 1, info }: NumberFieldProps) {
  return (
    <label className="block">
      <FieldLabel info={info}>{label}</FieldLabel>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full border border-overlay-border/12 bg-overlay-bg/35 px-3 text-xs font-medium text-overlay-text outline-hidden transition-colors hover:border-overlay-border/25 focus:border-overlay-border/35"
      />
    </label>
  );
}

function RangeField({ label, value, onChange, min, max, step = 1, info }: NumberFieldProps) {
  return (
    <label className="block rounded-[4px] border border-overlay-border/10 bg-overlay-bg/28 px-3 py-2.5">
      <span className="mb-2 flex items-center justify-between gap-3">
        <FieldLabel info={info}>{label}</FieldLabel>
        <span className="font-mono text-[0.68rem] font-semibold text-overlay-muted">{value}</span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-current"
      />
    </label>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  info?: string;
};

function TextField({ label, value, onChange, info }: TextFieldProps) {
  return (
    <label className="block">
      <FieldLabel info={info}>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full border border-overlay-border/12 bg-overlay-bg/35 px-3 text-xs font-medium text-overlay-text outline-hidden transition-colors hover:border-overlay-border/25 focus:border-overlay-border/35"
      />
    </label>
  );
}

function ColorField({ label, value, onChange, info }: TextFieldProps) {
  return (
    <label className="block">
      <FieldLabel info={info}>{label}</FieldLabel>
      <div className="flex h-10 overflow-hidden border border-overlay-border/12 bg-overlay-bg/35">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 border-0 bg-transparent p-1"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-xs font-medium text-overlay-text outline-hidden"
        />
      </div>
    </label>
  );
}

function DashboardScene({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#eef3f9] text-[#101828]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(110,145,255,0.14),transparent_30%),linear-gradient(180deg,#f7fafc_0%,#eef3f9_55%,#e8eef6_100%)]" />
      <aside className="absolute inset-y-0 left-0 hidden w-64 border-r border-[#101828]/8 bg-[#101828] p-5 text-white shadow-[20px_0_40px_rgba(16,24,40,0.12)] md:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ffd166] text-sm font-black text-[#101828] shadow-[0_12px_28px_rgba(255,209,102,0.35)]">
            Q
          </div>
          <div>
            <div className="font-display text-2xl font-semibold leading-none">Quarry</div>
            <div className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
              Revenue system
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          {["Overview", "Revenue", "Customers", "Pipeline", "Reports"].map((item, index) => (
            <div
              key={item}
              className={
                index === 0
                  ? "flex h-11 items-center rounded-xl border border-white/8 bg-white/10 px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "flex h-11 items-center rounded-xl px-3 text-xs font-medium text-white/68 transition-colors hover:bg-white/8 hover:text-white"
              }
            >
              {item}
            </div>
          ))}
        </div>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/8 bg-white/6 p-4 backdrop-blur">
          <div className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/48">
            Health
          </div>
          <div className="flex items-end gap-1.5">
            {[34, 52, 43, 68, 58, 76, 71].map((height) => (
              <span
                key={height}
                className="w-full rounded-[3px] bg-gradient-to-t from-[#62d2a2] to-[#95efc6]"
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </aside>

      <main className="relative min-h-screen p-3 md:pl-64 lg:p-5 lg:pl-[18.5rem]">
        <header className="mb-5 flex min-h-20 items-center justify-between gap-4 rounded-[28px] border border-[#101828]/8 bg-white/82 px-5 py-4 shadow-[0_18px_50px_rgba(16,24,40,0.08)] backdrop-blur">
          <div>
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#667085]">
              Revenue desk
            </div>
            <div className="font-display text-3xl font-semibold tracking-tight text-[#101828]">
              Operating pulse
            </div>
            <p className="mt-1 text-sm text-[#667085]">
              Live revenue view with clean account health and conversion pressure.
            </p>
          </div>
          <div className="shrink-0">{children}</div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "MRR", value: "$84.2k", delta: "+12.4%" },
            { label: "Pipeline", value: "$312k", delta: "+8.1%" },
            { label: "Activation", value: "68%", delta: "+3.0%" },
            { label: "Churn", value: "2.1%", delta: "-0.4%" },
          ].map((item, index) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-[#101828]/8 bg-white/88 p-4 shadow-[0_16px_40px_rgba(16,24,40,0.06)]"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#667085]">
                    {item.label}
                  </div>
                  <div className="font-display text-3xl font-semibold tracking-tight text-[#101828]">
                    {item.value}
                  </div>
                </div>
                <span
                  className={
                    index === 3
                      ? "rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[0.68rem] font-semibold text-[#027a48]"
                      : "rounded-full bg-[#eff8ff] px-2.5 py-1 text-[0.68rem] font-semibold text-[#175cd3]"
                  }
                >
                  {item.delta}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#d8dee4]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0f766e] via-[#14b8a6] to-[#8bd3ff]"
                  style={{
                    width: `${[72, 61, 68, 22][index]}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[28px] border border-[#101828]/8 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,24,40,0.06)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#101828]">Net revenue</div>
                <div className="text-xs text-[#667085]">Weekly performance across all accounts</div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[#d0d5dd] bg-[#f8fafc] px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#14b8a6]" />
                <span className="text-xs font-medium text-[#475467]">Live</span>
              </div>
            </div>
            <div className="grid h-64 grid-cols-12 items-end gap-2 sm:gap-3">
              {[42, 58, 48, 72, 64, 86, 78, 96, 74, 88, 104, 118].map((height, index) => (
                <div key={index} className="flex h-full items-end">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-[#0f172a] via-[#334155] to-[#8bd3ff]"
                    style={{ height }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#101828]/8 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,24,40,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#101828]">Accounts</div>
                <div className="text-xs text-[#667085]">Most active customers this week</div>
              </div>
              <div className="rounded-full bg-[#eff8ff] px-2.5 py-1 text-[0.68rem] font-semibold text-[#175cd3]">
                12 active
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["Acme Studio", "Expansion", "84%"],
                ["Northwind", "Renewal", "73%"],
                ["Fjord Labs", "Growth", "91%"],
                ["Kanso", "At risk", "41%"],
              ].map(([name, status, score], index) => (
                <div
                  key={name}
                  className="rounded-2xl border border-[#d0d5dd]/70 bg-[#f8fafc]/80 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#101828]">{name}</div>
                      <div className="text-xs text-[#667085]">{status}</div>
                    </div>
                    <div className="text-sm font-semibold text-[#101828]">{score}</div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e4e7ec]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] via-[#14b8a6] to-[#8bd3ff]"
                      style={{ width: `${[84, 73, 91, 41][index]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SaasScene({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#f4f6f0] text-[#101828]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(16,185,129,0.14),transparent_18rem),radial-gradient(circle_at_100%_0%,rgba(8,145,178,0.12),transparent_20rem),linear-gradient(180deg,#f7faf7_0%,#eef4ef_100%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#101828] text-sm font-black text-white shadow-[0_12px_28px_rgba(16,24,40,0.18)]">
            N
          </div>
          <div>
            <div className="font-display text-xl font-semibold leading-none">Northstar</div>
            <div className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-[#667085]">
              Product operations
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[#475467] md:flex">
          <span>Product</span>
          <span>Teams</span>
          <span>Pricing</span>
          <span>Docs</span>
        </nav>
        {children}
      </header>
      <main className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-8 px-5 pb-10 lg:grid-cols-[0.92fr_1.08fr]">
        <section>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#101828]/8 bg-white/76 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#667085] shadow-[0_10px_24px_rgba(16,24,40,0.04)]">
            <span className="h-2 w-2 rounded-full bg-[#14b8a6]" />
            Team operating layer
          </div>
          <h2 className="font-display max-w-xl text-5xl font-semibold leading-[0.96] tracking-tight text-[#101828] md:text-7xl">
            Plan launches without losing the week.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#475467]">
            Coordinate roadmaps, customer signals, launch health, and weekly decisions in one calm
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="inline-flex h-11 items-center justify-center rounded-full bg-[#101828] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(16,24,40,0.18)]">
              Book a demo
            </div>
            <div className="inline-flex h-11 items-center justify-center rounded-full border border-[#101828]/12 bg-white/76 px-5 text-sm font-semibold text-[#101828]">
              Explore roadmap
            </div>
          </div>
        </section>
        <section className="relative min-h-[520px] overflow-hidden rounded-[32px] border border-[#101828]/8 bg-white/84 p-4 shadow-[0_24px_80px_rgba(16,24,40,0.08)] backdrop-blur">
          <div className="mb-4 flex h-10 items-center gap-2 border-b border-[#101828]/8 pb-4">
            <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
            <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
            <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
          </div>
          <div className="grid gap-4 md:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-3">
              {["Launch", "Signals", "Risks", "Notes"].map((item, index) => (
                <div
                  key={item}
                  className={
                    index === 0
                      ? "rounded-2xl bg-[#101828] p-3 text-sm text-white shadow-[0_14px_28px_rgba(16,24,40,0.2)]"
                      : "rounded-2xl bg-[#f8fafc] p-3 text-sm text-[#475467] ring-1 ring-[#d0d5dd]/70"
                  }
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-gradient-to-br from-[#e8f3ee] via-[#eff6ff] to-[#f8fafc] p-4 ring-1 ring-[#d0d5dd]/70">
                <div className="mb-3 h-2 w-24 rounded-full bg-[#9bad8d]" />
                <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="h-28 rounded-2xl bg-white/72" />
                  <div className="h-28 rounded-2xl bg-[#101828]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Ship", "#d9e7cf"],
                  ["Review", "#f0dfca"],
                  ["Adopt", "#d7e0ee"],
                ].map(([label, color]) => (
                  <div
                    key={label}
                    className="rounded-3xl p-3 ring-1 ring-[#d0d5dd]/70"
                    style={{ background: color }}
                  >
                    <div className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">
                      {label}
                    </div>
                    <div className="h-16 rounded-2xl bg-white/55" />
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-dashed border-[#cbd5e1] bg-white/62 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#101828]">Weekly summary</span>
                  <span className="text-xs font-medium text-[#667085]">Updated 6m ago</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Deals", "18"],
                    ["Risks", "3"],
                    ["Confident", "91%"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#f8fafc] px-3 py-4">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#667085]">
                        {label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-[#101828]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function CheckoutScene({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#f5f0eb] text-[#211c18]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.88),transparent_26rem),radial-gradient(circle_at_85%_0%,rgba(244,153,74,0.14),transparent_18rem),linear-gradient(180deg,#faf6f1_0%,#f5f0eb_100%)]" />
      <header className="relative flex h-18 items-center justify-between border-b border-[#211c18]/10 bg-white/78 px-5 backdrop-blur">
        <div>
          <div className="font-display text-2xl font-semibold tracking-tight">Field Goods</div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#86786c]">
            Checkout with confidence
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[#6f645b] sm:inline">Cart $148.00</span>
          {children}
        </div>
      </header>
      <main className="relative mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <div className="rounded-[30px] border border-[#211c18]/10 bg-white/82 p-5 shadow-[0_18px_50px_rgba(33,28,24,0.06)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#86786c]">
                  Shipping
                </div>
                <p className="mt-1 text-sm text-[#6f645b]">
                  Delivery details with saved preferences and fast autofill.
                </p>
              </div>
              <span className="rounded-full bg-[#eff8ff] px-3 py-1 text-xs font-semibold text-[#175cd3]">
                2 min
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-12 rounded-2xl border border-[#211c18]/10 bg-[#fbfaf8]" />
              <div className="h-12 rounded-2xl border border-[#211c18]/10 bg-[#fbfaf8]" />
              <div className="h-12 rounded-2xl border border-[#211c18]/10 bg-[#fbfaf8] sm:col-span-2" />
            </div>
          </div>
          <div className="rounded-[30px] border border-[#211c18]/10 bg-white/82 p-5 shadow-[0_18px_50px_rgba(33,28,24,0.06)] backdrop-blur">
            <div className="mb-4">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#86786c]">
                Payment
              </div>
              <p className="mt-1 text-sm text-[#6f645b]">
                Secure card entry, Apple Pay, and modern wallet support.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="h-12 rounded-2xl border border-[#211c18]/10 bg-[#fbfaf8]" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-12 rounded-2xl border border-[#211c18]/10 bg-[#fbfaf8]" />
                <div className="h-12 rounded-2xl border border-[#211c18]/10 bg-[#fbfaf8]" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Fast ship", "2-3 business days"],
              ["Easy return", "30-day window"],
              ["Secure pay", "Encrypted checkout"],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[24px] border border-[#211c18]/10 bg-white/72 p-4 shadow-[0_12px_30px_rgba(33,28,24,0.04)]"
              >
                <div className="text-sm font-semibold text-[#211c18]">{title}</div>
                <div className="mt-2 text-xs leading-5 text-[#6f645b]">{body}</div>
              </div>
            ))}
          </div>
        </section>
        <aside className="rounded-[34px] border border-[#211c18]/10 bg-white/90 p-5 shadow-[0_20px_60px_rgba(33,28,24,0.08)]">
          <div className="mb-5">
            <div className="font-display text-2xl font-semibold tracking-tight">Order summary</div>
            <div className="mt-1 text-sm text-[#6f645b]">
              Balanced cart, clear totals, no surprises.
            </div>
          </div>
          <div className="space-y-4">
            {[
              ["Canvas tote", "$48", "#ded6ca"],
              ["Desk tray", "$72", "#d9e7cf"],
              ["Notebook", "$28", "#f0dfca"],
            ].map(([item, price, color]) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-[#211c18]/10 p-3">
                <div className="h-16 w-16 shrink-0 rounded-2xl" style={{ background: color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#211c18]">{item}</div>
                  <div className="mt-2 h-2 w-24 rounded-full bg-[#d3cbc1]" />
                  <div className="mt-4 text-xs uppercase tracking-[0.16em] text-[#86786c]">
                    Ready to ship
                  </div>
                </div>
                <div className="text-sm font-semibold text-[#211c18]">{price}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-[#211c18]/10 pt-5">
            <div className="flex items-center justify-between text-sm text-[#6f645b]">
              <span>Subtotal</span>
              <span>$148.00</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[#6f645b]">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-[#211c18]">
              <span>Total</span>
              <span>$148.00</span>
            </div>
            <div className="mt-4 h-12 rounded-full bg-[#211c18]" />
          </div>
        </aside>
      </main>
    </div>
  );
}

function ScenePreview({
  scene,
  children,
  onOpenAuth,
  triggers,
  triggerStore,
}: {
  scene: LabScene;
  children: ReactNode;
  onOpenAuth: () => void;
  triggers: AuthConfig["triggers"];
  triggerStore: AuthTriggerStore;
}) {
  if (scene === "windows")
    return <WindowsXpScene onOpenAuth={onOpenAuth}>{children}</WindowsXpScene>;
  if (scene === "medium") {
    return (
      <>
        <MediumPaywallScene
          onOpenAuth={onOpenAuth}
          triggers={triggers}
          triggerStore={triggerStore}
        />
        {children}
      </>
    );
  }
  if (scene === "saas") return <SaasScene>{children}</SaasScene>;
  if (scene === "checkout") return <CheckoutScene>{children}</CheckoutScene>;
  return <DashboardScene>{children}</DashboardScene>;
}

/**
 * Demo-only state matrix for exercising the public AuthDrawer config contract.
 */
export function AuthDrawerLab() {
  const { resolvedTheme, setTheme } = useTheme();
  const initialUrlState = useMemo(() => readLabUrlSnapshot(), []);
  const lastLeftShiftPress = useRef(0);
  const lastRightShiftPress = useRef(0);
  const [isLabOpen, setLabOpen] = useState(true);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DrawerMode>(
    () => initialUrlState.displayMode ?? "drawer",
  );
  const [oauthLayout, setOauthLayout] = useState<"row" | "column">(
    () => initialUrlState.oauthLayout ?? "column",
  );
  const [desktopPosition, setDesktopPosition] = useState<DrawerPosition>(
    () => initialUrlState.desktopPosition ?? "center",
  );
  const [desktopWidth, setDesktopWidth] = useState<(typeof WIDTHS)[number]>(
    () => initialUrlState.desktopWidth ?? "448px",
  );
  const [providers, setProviders] = useState<OAuthProvider[]>(
    () => initialUrlState.providers ?? PROVIDERS,
  );
  const [authFlags, setAuthFlags] = useState<LabAuthFlags>({
    allowRegister: initialUrlState.authFlags?.allowRegister ?? DEFAULT_CONFIG.ui.auth.allowRegister,
    showRememberMe:
      initialUrlState.authFlags?.showRememberMe ?? DEFAULT_CONFIG.ui.auth.showRememberMe,
    initialMode: initialUrlState.authFlags?.initialMode ?? DEFAULT_CONFIG.ui.auth.initialMode,
    showForgotPassword:
      initialUrlState.authFlags?.showForgotPassword ?? DEFAULT_CONFIG.ui.auth.showForgotPassword,
    showLivePasswordMatch:
      initialUrlState.authFlags?.showLivePasswordMatch ??
      DEFAULT_CONFIG.ui.auth.showLivePasswordMatch,
  });
  const [defaultOpen, setDefaultOpen] = useState(
    () => initialUrlState.defaultOpen ?? DEFAULT_CONFIG.ui.presentation.defaultOpen,
  );
  const [backdrop, setBackdrop] = useState<LabBackdrop>(() => ({
    ...DEFAULT_CONFIG.ui.visual.backdrop,
    gradient: {
      ...DEFAULT_CONFIG.ui.visual.backdrop.gradient,
    },
    ...initialUrlState.backdrop,
    ...(initialUrlState.backdrop?.gradient
      ? {
          gradient: {
            ...DEFAULT_CONFIG.ui.visual.backdrop.gradient,
            ...initialUrlState.backdrop.gradient,
          },
        }
      : {}),
  }));
  const [motion, setMotion] = useState<MotionSettings>(() => ({
    ...DEFAULT_CONFIG.ui.motion,
    ...initialUrlState.motion,
  }));
  const [triggerDraft, setTriggerDraft] = useState<LabTriggers>({
    pageLoadEnabled: initialUrlState.triggers?.pageLoadEnabled ?? false,
    pageLoadDelayMs: initialUrlState.triggers?.pageLoadDelayMs ?? 0,
    scrollEnabled: initialUrlState.triggers?.scrollEnabled ?? true,
    scrollThreshold: initialUrlState.triggers?.scrollThreshold ?? 0.25,
    scrollOnce: initialUrlState.triggers?.scrollOnce ?? true,
    scrollCooldownMs: initialUrlState.triggers?.scrollCooldownMs ?? 0,
  });
  const [scenario, setScenario] = useState<AuthScenarioId>(
    () => initialUrlState.scenario ?? "success",
  );
  const [scene, setScene] = useState<LabScene>(() => initialUrlState.scene ?? "windows");
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const triggerStore = useMemo(() => createAuthTriggerStore(), []);

  function updateAuthFlag<Key extends keyof LabAuthFlags>(key: Key, value: LabAuthFlags[Key]) {
    setAuthFlags((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateBackdrop<Key extends keyof Omit<LabBackdrop, "gradient">>(
    key: Key,
    value: LabBackdrop[Key],
  ) {
    setBackdrop((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateGradient<Key extends keyof LabBackdrop["gradient"]>(
    key: Key,
    value: LabBackdrop["gradient"][Key],
  ) {
    setBackdrop((current) => ({
      ...current,
      gradient: {
        ...current.gradient,
        [key]: value,
      },
    }));
  }

  function updateMotion<Key extends keyof MotionSettings>(key: Key, value: MotionSettings[Key]) {
    setMotion((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTrigger<Key extends keyof LabTriggers>(key: Key, value: LabTriggers[Key]) {
    setTriggerDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    const node = document.createElement("div");
    node.setAttribute("data-skip-inert", "");
    node.className = "auth-drawer-lab-portal";
    document.body.appendChild(node);
    setPortalNode(node);
    return () => {
      document.body.removeChild(node);
    };
  }, []);

  const selectedScenario = AUTH_SCENARIOS.find((item) => item.id === scenario);
  const currentTheme = resolvedTheme ?? "dark";
  const toggleTheme = () => setTheme(currentTheme === "dark" ? "light" : "dark");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || event.repeat) {
        return;
      }

      const now = Date.now();

      // Left Shift x2 = open debugger/lab
      if (event.code === "ShiftLeft") {
        if (now - lastLeftShiftPress.current < DOUBLE_PRESS_DELAY) {
          event.preventDefault();
          setLabOpen((current) => !current);
          lastLeftShiftPress.current = 0;
        } else {
          lastLeftShiftPress.current = now;
        }

        return;
      }

      // Right Shift x2 = toggle theme
      if (event.code === "ShiftRight") {
        if (now - lastRightShiftPress.current < DOUBLE_PRESS_DELAY) {
          event.preventDefault();
          setTheme((resolvedTheme ?? "dark") === "dark" ? "light" : "dark");
          lastRightShiftPress.current = 0;
        } else {
          lastRightShiftPress.current = now;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resolvedTheme, setTheme]);

  const config = useMemo<AuthConfig>(() => {
    const isMediumScene = scene === "medium";
    const resolvedDisplayMode = isMediumScene ? "modal" : displayMode;
    const triggers: AuthTriggerConfig = {};

    if (triggerDraft.pageLoadEnabled) {
      triggers.pageLoad = {
        delayMs: triggerDraft.pageLoadDelayMs,
        once: true,
      };
    }

    if (triggerDraft.scrollEnabled) {
      triggers.scrollOpen = {
        threshold: triggerDraft.scrollThreshold,
        once: triggerDraft.scrollOnce,
        cooldownMs: triggerDraft.scrollCooldownMs || undefined,
      };
    }

    return {
      ui: {
        auth: {
          providers,
          oauthLayout,
          ...authFlags,
        },
        presentation: {
          variant: resolvedDisplayMode,
          defaultOpen,
        },
        visual: {
          backdrop,
        },
        motion: {
          ...motion,
          displayMode: resolvedDisplayMode,
          desktopPosition: isMediumScene ? "center" : desktopPosition,
          desktopWidth: isMediumScene ? "392px" : desktopWidth,
          entryDuration: isMediumScene ? 0.42 : motion.entryDuration,
          entryScale: isMediumScene ? 0.98 : motion.entryScale,
          entryY: isMediumScene ? 12 : motion.entryY,
          backdropOpacity: isMediumScene ? 0.2 : motion.backdropOpacity,
          backdropBlur: isMediumScene ? 2 : motion.backdropBlur,
          formPaddingBottom: resolvedDisplayMode === "modal" ? 0 : motion.formPaddingBottom,
        },
      },
      ...createScenarioHandlers(scenario),
      triggers,
    };
  }, [
    authFlags,
    backdrop,
    defaultOpen,
    desktopPosition,
    desktopWidth,
    displayMode,
    motion,
    oauthLayout,
    providers,
    scenario,
    scene,
    triggerDraft,
  ]);

  const usageConfig = useMemo<AuthConfig>(() => {
    return {
      ui: config.ui,
      triggers: config.triggers,
    };
  }, [config]);

  const usageCode = useMemo(() => generateUsageCode(usageConfig), [usageConfig]);
  const urlSnapshot = useMemo<LabUrlSnapshot>(
    () => ({
      scene,
      displayMode,
      oauthLayout,
      desktopPosition,
      desktopWidth,
      providers,
      authFlags,
      defaultOpen,
      backdrop,
      motion,
      triggers: triggerDraft,
      scenario,
    }),
    [
      authFlags,
      backdrop,
      defaultOpen,
      desktopPosition,
      desktopWidth,
      displayMode,
      motion,
      oauthLayout,
      providers,
      scenario,
      scene,
      triggerDraft,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("view", "playground");
    params.set(SHOWCASE_PARAM, scene);
    params.set(CONFIG_PARAM, encodeSnapshot(urlSnapshot));
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;

    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [scene, urlSnapshot]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <ScenePreview
        scene={scene}
        onOpenAuth={() => setDrawerOpen(true)}
        triggers={config.triggers}
        triggerStore={triggerStore}
      >
        <AuthDrawer
          config={config}
          triggerStore={triggerStore}
          hideTrigger={scene === "medium" || scene === "windows"}
          open={isDrawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </ScenePreview>

      {portalNode
        ? createPortal(
            <>
              {!isLabOpen && (
                <button
                  type="button"
                  onPointerDown={stopLabEvent}
                  onMouseDown={stopLabEvent}
                  onClick={(event) => {
                    stopLabEvent(event);
                    setLabOpen(true);
                  }}
                  className="fixed bottom-4 left-4 z-[320] inline-flex h-10 items-center gap-2 rounded-[4px] border border-overlay-border/12 bg-overlay-surface/88 px-3 text-xs font-semibold text-overlay-text transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
                  title="Open lab"
                >
                  <Settings2 size={14} aria-hidden="true" />
                  Lab
                </button>
              )}

              {isLabOpen && (
                <aside
                  onPointerDown={stopLabEvent}
                  onMouseDown={stopLabEvent}
                  onClick={stopLabEvent}
                  className="custom-scrollbar fixed bottom-4 left-4 z-[320] max-h-[calc(100vh-6rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-[6px] border border-overlay-border/12 bg-overlay-surface/88 p-3 text-overlay-text dark:bg-overlay-surface/78"
                >
                  <div className="mb-3 rounded-[4px] bg-overlay-bg/32 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="font-display text-xl font-semibold leading-none tracking-normal">
                            Auth component configurator
                          </h1>
                          <InfoTip>
                            The lab stays above the active auth surface and only drives the public
                            config API.
                          </InfoTip>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <ThemeToggle theme={currentTheme} onToggle={toggleTheme} />
                        <button
                          type="button"
                          onClick={() => setLabOpen(false)}
                          className="grid h-9 w-9 place-items-center rounded-[4px] border border-overlay-border/12 bg-overlay-bg/35 text-overlay-muted transition-[border-color,color,transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-overlay-border/25 hover:bg-overlay-surface/55 hover:text-overlay-text active:scale-[0.97]"
                          title="Hide lab"
                        >
                          <X size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-medium text-overlay-muted">
                      <span>{displayMode}</span>
                      <span className="text-overlay-subtle">/</span>
                      <span>{desktopWidth}</span>
                      <span className="text-overlay-subtle">/</span>
                      <span>
                        {providers.length} provider{providers.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.62rem] font-medium text-overlay-subtle">
                      <span className="inline-flex items-center gap-1.5">
                        <kbd className="font-mono border border-overlay-border/18 bg-overlay-bg/35 px-1 py-px text-[0.56rem] font-semibold tracking-normal text-overlay-text">
                          L Shift
                        </kbd>
                        <span>x2 panel</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <kbd className="font-mono border border-overlay-border/18 bg-overlay-bg/35 px-1 py-px text-[0.56rem] font-semibold tracking-normal text-overlay-text">
                          R Shift
                        </kbd>
                        <span>x2 theme</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <SceneOptions scene={scene} onSceneChange={setScene} />

                    <Segment<DrawerMode>
                      label="Surface"
                      value={displayMode}
                      onChange={setDisplayMode}
                      options={[
                        {
                          value: "drawer",
                          label: "Drawer",
                        },
                        {
                          value: "modal",
                          label: "Modal",
                        },
                      ]}
                    />

                    <Segment<"row" | "column">
                      label="OAuth layout"
                      value={oauthLayout}
                      onChange={setOauthLayout}
                      options={[
                        {
                          value: "column",
                          label: "Column",
                        },
                        { value: "row", label: "Row" },
                      ]}
                    />

                    <label className="block">
                      <FieldLabel info="Fake backend result. These errors pass through the same normalizer real providers use.">
                        Scenario
                      </FieldLabel>
                      <div className="relative">
                        <select
                          value={scenario}
                          onChange={(event) => setScenario(event.target.value as AuthScenarioId)}
                          className="h-10 w-full appearance-none border border-overlay-border/12 bg-overlay-bg/35 px-3 pr-9 text-xs font-medium text-overlay-text outline-hidden transition-colors hover:border-overlay-border/25"
                        >
                          {AUTH_SCENARIOS.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-overlay-subtle"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <FieldLabel info="Desktop auth surface width. Useful for catching wrapping and modal density issues.">
                        Width
                      </FieldLabel>
                      <div className="relative">
                        <select
                          value={desktopWidth}
                          onChange={(event) =>
                            setDesktopWidth(event.target.value as (typeof WIDTHS)[number])
                          }
                          className="h-10 w-full appearance-none border border-overlay-border/12 bg-overlay-bg/35 px-3 pr-9 text-xs font-medium text-overlay-text outline-hidden transition-colors hover:border-overlay-border/25"
                        >
                          {WIDTHS.map((width) => (
                            <option key={width} value={width}>
                              {width}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-overlay-subtle"
                        />
                      </div>
                    </label>

                    <Segment<DrawerPosition>
                      label="Position"
                      value={desktopPosition}
                      onChange={setDesktopPosition}
                      options={[
                        { value: "left", label: "Left" },
                        {
                          value: "center",
                          label: "Center",
                        },
                        {
                          value: "right",
                          label: "Right",
                        },
                      ]}
                    />

                    <div>
                      <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
                        Providers
                      </span>
                      <div className="grid grid-cols-2 gap-1 border border-overlay-border/12 bg-overlay-bg/35 p-1">
                        {PROVIDERS.map((provider) => (
                          <button
                            key={provider}
                            type="button"
                            onClick={() =>
                              setProviders((current) => cycleProvider(current, provider))
                            }
                            className={
                              providers.includes(provider)
                                ? "h-8 bg-overlay-text px-2 text-xs font-semibold text-overlay-bg"
                                : "h-8 px-2 text-xs font-medium text-overlay-muted transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-overlay-surface/55 hover:text-overlay-text active:scale-[0.97]"
                            }
                          >
                            {labelForProvider(provider)}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-[0.62rem] font-medium text-overlay-muted">
                        {providers.length > 0
                          ? `${providers.length} OAuth provider${providers.length === 1 ? "" : "s"} enabled`
                          : "No OAuth providers enabled"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-[4px] border border-overlay-border/10 bg-overlay-bg/20 p-3">
                      <h2 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
                        ui.auth
                      </h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <ToggleField
                          label="Allow register"
                          checked={authFlags.allowRegister}
                          onChange={(checked) => updateAuthFlag("allowRegister", checked)}
                          info="Enables the register form and mode switch."
                        />
                        <ToggleField
                          label="Remember me"
                          checked={authFlags.showRememberMe}
                          onChange={(checked) => updateAuthFlag("showRememberMe", checked)}
                          info="Shows the remember-me checkbox on credential login."
                        />
                        <ToggleField
                          label="Forgot password"
                          checked={authFlags.showForgotPassword}
                          onChange={(checked) => updateAuthFlag("showForgotPassword", checked)}
                          info="Shows the forgot-password action below the password field."
                        />
                        <ToggleField
                          label="Live password match"
                          checked={authFlags.showLivePasswordMatch}
                          onChange={(checked) => updateAuthFlag("showLivePasswordMatch", checked)}
                          info="Shows live confirm-password feedback while registering."
                        />
                        <Segment<"login" | "register">
                          label="Initial mode"
                          value={authFlags.initialMode}
                          onChange={(value) => updateAuthFlag("initialMode", value)}
                          options={[
                            { value: "login", label: "Login" },
                            { value: "register", label: "Register" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="rounded-[4px] border border-overlay-border/10 bg-overlay-bg/20 p-3">
                      <h2 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
                        ui.presentation
                      </h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <ToggleField
                          label="Default open"
                          checked={defaultOpen}
                          onChange={setDefaultOpen}
                          info="Config default for uncontrolled usage. This lab is controlled, so it is reflected in generated code."
                        />
                      </div>
                    </div>

                    <div className="rounded-[4px] border border-overlay-border/10 bg-overlay-bg/20 p-3">
                      <h2 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
                        ui.visual.backdrop
                      </h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ColorField
                          label="Color"
                          value={backdrop.color}
                          onChange={(value) => updateBackdrop("color", value)}
                        />
                        <RangeField
                          label="Opacity"
                          value={backdrop.opacity}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) => updateBackdrop("opacity", value)}
                        />
                        <RangeField
                          label="Blur"
                          value={backdrop.blur}
                          min={0}
                          max={24}
                          step={1}
                          onChange={(value) => updateBackdrop("blur", value)}
                        />
                        <RangeField
                          label="Gradient angle"
                          value={backdrop.gradient.angle}
                          min={0}
                          max={360}
                          step={5}
                          onChange={(value) => updateGradient("angle", value)}
                        />
                        <ColorField
                          label="Gradient from"
                          value={backdrop.gradient.from}
                          onChange={(value) => updateGradient("from", value)}
                        />
                        <ColorField
                          label="Gradient to"
                          value={backdrop.gradient.to}
                          onChange={(value) => updateGradient("to", value)}
                        />
                        <RangeField
                          label="From pos"
                          value={backdrop.gradient.fromPos}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) => updateGradient("fromPos", value)}
                        />
                        <RangeField
                          label="To pos"
                          value={backdrop.gradient.toPos}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) => updateGradient("toPos", value)}
                        />
                      </div>
                    </div>

                    <div className="rounded-[4px] border border-overlay-border/10 bg-overlay-bg/20 p-3">
                      <h2 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
                        ui.motion
                      </h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <RangeField
                          label="Up resistance"
                          value={motion.upwardResistance}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) => updateMotion("upwardResistance", value)}
                        />
                        <RangeField
                          label="Down threshold"
                          value={motion.downwardThreshold}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) => updateMotion("downwardThreshold", value)}
                        />
                        <NumberField
                          label="Velocity threshold"
                          value={motion.velocityThreshold}
                          min={0}
                          step={50}
                          onChange={(value) => updateMotion("velocityThreshold", value)}
                        />
                        <NumberField
                          label="Snap stiffness"
                          value={motion.snapStiffness}
                          min={0}
                          step={25}
                          onChange={(value) => updateMotion("snapStiffness", value)}
                        />
                        <NumberField
                          label="Snap damping"
                          value={motion.snapDamping}
                          min={0}
                          step={1}
                          onChange={(value) => updateMotion("snapDamping", value)}
                        />
                        <RangeField
                          label="Snap mass"
                          value={motion.snapMass}
                          min={0.1}
                          max={2}
                          step={0.1}
                          onChange={(value) => updateMotion("snapMass", value)}
                        />
                        <RangeField
                          label="Entry duration"
                          value={motion.entryDuration}
                          min={0}
                          max={2}
                          step={0.02}
                          onChange={(value) => updateMotion("entryDuration", value)}
                        />
                        <RangeField
                          label="Entry delay"
                          value={motion.entryDelay}
                          min={0}
                          max={1}
                          step={0.02}
                          onChange={(value) => updateMotion("entryDelay", value)}
                        />
                        <RangeField
                          label="Entry scale"
                          value={motion.entryScale}
                          min={0.7}
                          max={1.1}
                          step={0.01}
                          onChange={(value) => updateMotion("entryScale", value)}
                        />
                        <NumberField
                          label="Entry y"
                          value={motion.entryY}
                          step={1}
                          onChange={(value) => updateMotion("entryY", value)}
                        />
                        <label className="block">
                          <FieldLabel>Entry ease</FieldLabel>
                          <div className="relative">
                            <select
                              value={motion.entryEase}
                              onChange={(event) => updateMotion("entryEase", event.target.value)}
                              className="h-10 w-full appearance-none border border-overlay-border/12 bg-overlay-bg/35 px-3 pr-9 text-xs font-medium text-overlay-text outline-hidden transition-colors hover:border-overlay-border/25"
                            >
                              {EASE_OPTIONS.map((ease) => (
                                <option key={ease} value={ease}>
                                  {ease}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              size={15}
                              aria-hidden="true"
                              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-overlay-subtle"
                            />
                          </div>
                        </label>
                        <RangeField
                          label="Exit duration"
                          value={motion.exitDuration}
                          min={0}
                          max={1.5}
                          step={0.02}
                          onChange={(value) => updateMotion("exitDuration", value)}
                        />
                        <RangeField
                          label="Exit delay"
                          value={motion.exitDelay}
                          min={0}
                          max={1}
                          step={0.02}
                          onChange={(value) => updateMotion("exitDelay", value)}
                        />
                        <RangeField
                          label="Exit scale"
                          value={motion.exitScale}
                          min={0.7}
                          max={1.1}
                          step={0.01}
                          onChange={(value) => updateMotion("exitScale", value)}
                        />
                        <NumberField
                          label="Exit y"
                          value={motion.exitY}
                          step={1}
                          onChange={(value) => updateMotion("exitY", value)}
                        />
                        <TextField
                          label="Exit ease"
                          value={motion.exitEase}
                          onChange={(value) => updateMotion("exitEase", value)}
                        />
                        <RangeField
                          label="Motion backdrop opacity"
                          value={motion.backdropOpacity}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) => updateMotion("backdropOpacity", value)}
                          info="Fallback motion backdrop value. ui.visual.backdrop wins when both are set."
                        />
                        <ColorField
                          label="Motion backdrop color"
                          value={motion.backdropColor}
                          onChange={(value) => updateMotion("backdropColor", value)}
                        />
                        <RangeField
                          label="Motion backdrop blur"
                          value={motion.backdropBlur}
                          min={0}
                          max={24}
                          step={1}
                          onChange={(value) => updateMotion("backdropBlur", value)}
                        />
                        <RangeField
                          label="Backdrop angle"
                          value={motion.backdropAngle}
                          min={0}
                          max={360}
                          step={5}
                          onChange={(value) => updateMotion("backdropAngle", value)}
                        />
                        <ColorField
                          label="Backdrop start"
                          value={motion.backdropStartColor}
                          onChange={(value) => updateMotion("backdropStartColor", value)}
                        />
                        <ColorField
                          label="Backdrop end"
                          value={motion.backdropEndColor}
                          onChange={(value) => updateMotion("backdropEndColor", value)}
                        />
                        <RangeField
                          label="Backdrop start pos"
                          value={motion.backdropStartPos}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) => updateMotion("backdropStartPos", value)}
                        />
                        <RangeField
                          label="Backdrop end pos"
                          value={motion.backdropEndPos}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(value) => updateMotion("backdropEndPos", value)}
                        />
                        <NumberField
                          label="Form padding top"
                          value={motion.formPaddingTop}
                          step={8}
                          onChange={(value) => updateMotion("formPaddingTop", value)}
                        />
                        <NumberField
                          label="Form padding bottom"
                          value={motion.formPaddingBottom}
                          step={8}
                          onChange={(value) => updateMotion("formPaddingBottom", value)}
                        />
                        <Segment<(typeof FORM_JUSTIFY_OPTIONS)[number]>
                          label="Form justify"
                          value={motion.formJustify as (typeof FORM_JUSTIFY_OPTIONS)[number]}
                          onChange={(value) => updateMotion("formJustify", value)}
                          options={FORM_JUSTIFY_OPTIONS.map((value) => ({
                            value,
                            label: value,
                          }))}
                        />
                        <Segment<(typeof FORM_ALIGN_OPTIONS)[number]>
                          label="Form align"
                          value={motion.formAlign as (typeof FORM_ALIGN_OPTIONS)[number]}
                          onChange={(value) => updateMotion("formAlign", value)}
                          options={FORM_ALIGN_OPTIONS.map((value) => ({
                            value,
                            label: value,
                          }))}
                        />
                      </div>
                    </div>

                    <div className="rounded-[4px] border border-overlay-border/10 bg-overlay-bg/20 p-3">
                      <h2 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
                        triggers
                      </h2>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ToggleField
                          label="Page load"
                          checked={triggerDraft.pageLoadEnabled}
                          onChange={(checked) => updateTrigger("pageLoadEnabled", checked)}
                          info="Opens the auth surface after mount."
                        />
                        <NumberField
                          label="Page load delay"
                          value={triggerDraft.pageLoadDelayMs}
                          min={0}
                          step={100}
                          onChange={(value) => updateTrigger("pageLoadDelayMs", value)}
                        />
                        <ToggleField
                          label="Scroll open"
                          checked={triggerDraft.scrollEnabled}
                          onChange={(checked) => updateTrigger("scrollEnabled", checked)}
                          info="Medium scene emits scroll progress into the central trigger store."
                        />
                        <RangeField
                          label="Scroll threshold"
                          value={triggerDraft.scrollThreshold}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) => updateTrigger("scrollThreshold", value)}
                        />
                        <ToggleField
                          label="Scroll once"
                          checked={triggerDraft.scrollOnce}
                          onChange={(checked) => updateTrigger("scrollOnce", checked)}
                        />
                        <NumberField
                          label="Scroll cooldown"
                          value={triggerDraft.scrollCooldownMs}
                          min={0}
                          step={250}
                          onChange={(value) => updateTrigger("scrollCooldownMs", value)}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 border border-overlay-border/10 bg-overlay-bg/28 px-3 py-2.5 text-xs leading-relaxed text-overlay-muted">
                    {selectedScenario?.description}
                  </p>

                  <PropUsage code={usageCode} />
                </aside>
              )}
            </>,
            portalNode,
          )
        : null}
    </div>
  );
}
