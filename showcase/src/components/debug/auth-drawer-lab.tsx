import { useTheme } from "next-themes";
import {
  Check,
  ChevronDown,
  Clipboard,
  Moon,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  OAUTH_PROVIDER_IDS,
  defaultLabelForOAuthProvider,
  type AuthBackdropConfig,
  type AuthConfig,
  type AuthConfigGroup,
  type DrawerMode,
  type DrawerPosition,
  type MotionSettings,
  type OAuthProvider,
  type AuthTriggerConfig,
} from "@/components/auth/auth-drawer";
import { createAuthTriggerStore } from "@remcostoeten/auth-drawer";
import { WindowsXpScene } from "@/components/debug/scenes/windows-xp";
import { AUTH_SCENARIOS, type AuthScenarioId, createScenarioAdapter } from "./auth-scenarios";

const WIDTHS = ["392px", "448px", "520px"] as const;
const PROVIDERS: OAuthProvider[] = [...OAUTH_PROVIDER_IDS];
const EASE_OPTIONS = ["[0.23,1,0.32,1]", "easeOut", "easeInOut", "linear"] as const;
const FORM_JUSTIFY_OPTIONS = ["center", "flex-start", "flex-end", "space-between"] as const;
const FORM_ALIGN_OPTIONS = ["center", "flex-start", "flex-end", "stretch"] as const;
const DOUBLE_PRESS_DELAY = 300;
const DRAWER_MODES = ["drawer", "modal"] as const;
const DRAWER_POSITIONS = ["left", "center", "right"] as const;
const OAUTH_LAYOUTS = ["row", "column"] as const;
const AUTH_MODES = ["login", "register"] as const;
const AUTH_SCENARIO_IDS = AUTH_SCENARIOS.map((item) => item.id);
const CONFIG_PARAM = "config";

type LabAuthFlags = Required<
  Pick<
    AuthConfigGroup,
    | "allowRegister"
    | "showRememberMe"
    | "showForgotPassword"
    | "showLivePasswordMatch"
  >
> & {
  initialMode: "login" | "register";
};
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
      : "login",
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
  return defaultLabelForOAuthProvider(provider);
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

function ScenePreview({
  children,
  onOpenAuth,
  desktop,
}: {
  children: ReactNode;
  onOpenAuth: () => void;
  desktop?: boolean;
}) {
  return <WindowsXpScene onOpenAuth={onOpenAuth} desktop={desktop}>{children}</WindowsXpScene>;
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
  const [desktop, setDesktop] = useState(false);
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
    initialMode: initialUrlState.authFlags?.initialMode ?? "login",
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
  const scene = "windows" as const;
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const triggerStore = useMemo(() => createAuthTriggerStore(), []);
  const adapter = useMemo(() => createScenarioAdapter(scenario), [scenario]);

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
          variant: displayMode,
          defaultOpen,
        },
        visual: {
          backdrop,
        },
        motion: {
          ...motion,
          displayMode,
          desktopPosition,
          desktopWidth,
          formPaddingBottom: displayMode === "modal" ? 0 : motion.formPaddingBottom,
        },
      },
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
      triggerDraft,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    params.set("view", "playground");
    params.set(CONFIG_PARAM, encodeSnapshot(urlSnapshot));
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;

    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [urlSnapshot]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <ScenePreview onOpenAuth={() => setDrawerOpen(true)} desktop={desktop}>
        <AuthDrawer
          adapter={adapter}
          config={config}
          triggerStore={triggerStore}
          hideTrigger
          open={isDrawerOpen}
          onOpenChange={setDrawerOpen}
          onSuccess={() => setDesktop(true)}
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
                          info="Emits scroll progress into the central trigger store."
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
