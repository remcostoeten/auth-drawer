import { useTheme } from "next-themes";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  type AuthConfig,
  type DrawerMode,
  type DrawerPosition,
  type OAuthProvider,
} from "@/components/auth/auth-drawer";
import {
  AUTH_SCENARIOS,
  type AuthScenarioId,
  createScenarioHandlers,
} from "./auth-scenarios";

const WIDTHS = ["392px", "448px", "520px"] as const;
const PROVIDERS: OAuthProvider[] = ["github", "google"];
const LAB_SHORTCUT = "`";

function labelForProvider(provider: OAuthProvider) {
  return provider === "github" ? "GitHub" : "Google";
}

function cycleProvider(
  providers: OAuthProvider[],
  provider: OAuthProvider,
): OAuthProvider[] {
  if (providers.includes(provider)) {
    const next = providers.filter((item) => item !== provider);
    return next.length ? next : providers;
  }

  return [...providers, provider];
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

function stopLabEvent(event: SyntheticEvent) {
  event.stopPropagation();
}

type SegmentProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentProps<T>) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
        {label}
      </span>
      <div className="grid grid-cols-2 gap-1 rounded-none border border-overlay-border/10 bg-overlay-surface/30 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              value === option.value
                ? "h-8 rounded-none bg-overlay-text px-2 text-xs font-semibold text-overlay-bg"
                : "h-8 rounded-none px-2 text-xs font-medium text-overlay-muted transition-colors hover:text-overlay-text"
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
        className="flex h-4 w-4 cursor-help items-center justify-center border border-overlay-border/15 text-[0.625rem] font-bold text-overlay-subtle outline-none transition-colors hover:border-overlay-border/30 hover:text-overlay-text focus-visible:border-overlay-border/40 focus-visible:text-overlay-text"
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[130] mb-2 w-56 -translate-x-1/2 border border-overlay-border/10 bg-overlay-surface px-2.5 py-2 text-[0.7rem] font-medium leading-relaxed text-overlay-muted opacity-0 shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
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
      className="group flex h-9 items-center gap-2 border border-overlay-border/10 bg-overlay-surface/30 px-2.5 text-xs font-semibold text-overlay-muted transition-colors hover:border-overlay-border/20 hover:text-overlay-text"
      title="Toggle theme: double-press Right Shift"
    >
      <span className="relative h-4 w-7 border border-overlay-border/20 bg-overlay-bg/30">
        <span
          className={
            isDark
              ? "absolute right-0.5 top-0.5 h-3 w-3 bg-overlay-text transition-transform"
              : "absolute left-0.5 top-0.5 h-3 w-3 bg-overlay-text transition-transform"
          }
        />
      </span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

/**
 * Demo-only state matrix for exercising the public AuthDrawer config contract.
 */
export function AuthDrawerLab() {
  const { resolvedTheme, setTheme } = useTheme();
  const lastRightShiftTime = useRef(0);
  const [isLabOpen, setLabOpen] = useState(true);
  const [displayMode, setDisplayMode] = useState<DrawerMode>("drawer");
  const [oauthLayout, setOauthLayout] = useState<"row" | "column">("column");
  const [desktopPosition, setDesktopPosition] =
    useState<DrawerPosition>("center");
  const [desktopWidth, setDesktopWidth] =
    useState<(typeof WIDTHS)[number]>("448px");
  const [providers, setProviders] = useState<OAuthProvider[]>(PROVIDERS);
  const [scenario, setScenario] = useState<AuthScenarioId>("success");

  const selectedScenario = AUTH_SCENARIOS.find((item) => item.id === scenario);
  const currentTheme = resolvedTheme ?? "dark";
  const toggleTheme = () => setTheme(currentTheme === "dark" ? "light" : "dark");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === LAB_SHORTCUT && !isEditableTarget(event.target)) {
        event.preventDefault();
        setLabOpen((current) => !current);
        return;
      }

      if (event.key !== "Shift" || event.location !== 2 || event.repeat) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastRightShiftTime.current;

      if (elapsed < 300 && lastRightShiftTime.current > 0) {
        event.preventDefault();
        setTheme((resolvedTheme ?? "dark") === "dark" ? "light" : "dark");
      }

      lastRightShiftTime.current = now;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvedTheme, setTheme]);

  const config = useMemo<AuthConfig>(
    () => ({
      providers,
      oauthLayout,
      ...createScenarioHandlers(scenario),
      motionSettings: {
        displayMode,
        desktopPosition,
        desktopWidth,
        formPaddingBottom:
          displayMode === "modal"
            ? 0
            : DEFAULT_CONFIG.motionSettings.formPaddingBottom,
      },
    }),
    [desktopPosition, desktopWidth, displayMode, oauthLayout, providers, scenario],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      >
        <div className="absolute left-[-10%] top-[-15%] h-80 w-80 rounded-full bg-overlay-border/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-8%] h-96 w-96 rounded-full bg-overlay-text/5 blur-3xl" />
      </div>

      <div className="fixed inset-0 z-0 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-overlay-muted">
            Open the drawer, then switch lab scenarios to verify validation,
            backend errors, OAuth failures, and modal/drawer variants.
          </p>
          <AuthDrawer config={config} />
        </div>
      </div>

      {!isLabOpen && (
        <button
          type="button"
          onPointerDown={stopLabEvent}
          onMouseDown={stopLabEvent}
          onClick={(event) => {
            stopLabEvent(event);
            setLabOpen(true);
          }}
          className="fixed bottom-4 left-4 z-[120] border border-overlay-border/10 bg-overlay-surface/85 px-3 py-2 text-xs font-semibold text-overlay-text shadow-[0_18px_70px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
          title="Open lab (`)"
        >
          Lab <kbd className="ml-1 text-overlay-subtle">`</kbd>
        </button>
      )}

      {isLabOpen && (
      <aside
        onPointerDown={stopLabEvent}
        onMouseDown={stopLabEvent}
        onClick={stopLabEvent}
        className="fixed bottom-4 left-4 z-[120] max-h-[calc(100vh-2rem)] w-[min(27rem,calc(100vw-2rem))] overflow-y-auto border border-overlay-border/10 bg-overlay-surface/85 p-3 text-overlay-text shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl dark:bg-overlay-surface/75"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-medium tracking-tight">
                Auth drawer lab
              </h1>
              <InfoTip>
                The lab stays above the active auth surface and only drives the public config API.
              </InfoTip>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-overlay-muted">
              Toggle lab with <kbd className="text-overlay-text">`</kbd>. Toggle theme with double Right Shift.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle theme={currentTheme} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={() => setLabOpen(false)}
              className="h-9 border border-overlay-border/10 bg-overlay-surface/30 px-2.5 text-xs font-semibold text-overlay-muted transition-colors hover:border-overlay-border/20 hover:text-overlay-text"
              title="Hide lab (`)"
            >
              Hide
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Segment
            label="Surface"
            value={displayMode}
            onChange={setDisplayMode}
            options={[
              { value: "drawer", label: "Drawer" },
              { value: "modal", label: "Modal" },
            ]}
          />

          <Segment
            label="OAuth layout"
            value={oauthLayout}
            onChange={setOauthLayout}
            options={[
              { value: "column", label: "Column" },
              { value: "row", label: "Row" },
            ]}
          />

          <label className="block">
            <FieldLabel info="Fake backend result. These errors pass through the same normalizer real providers use.">
              Scenario
            </FieldLabel>
            <select
              value={scenario}
              onChange={(event) =>
                setScenario(event.target.value as AuthScenarioId)
              }
              className="h-10 w-full rounded-none border border-overlay-border/10 bg-overlay-surface/30 px-3 text-xs font-medium text-overlay-text outline-none"
            >
              {AUTH_SCENARIOS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel info="Desktop auth surface width. Useful for catching wrapping and modal density issues.">
              Width
            </FieldLabel>
            <select
              value={desktopWidth}
              onChange={(event) =>
                setDesktopWidth(event.target.value as (typeof WIDTHS)[number])
              }
              className="h-10 w-full rounded-none border border-overlay-border/10 bg-overlay-surface/30 px-3 text-xs font-medium text-overlay-text outline-none"
            >
              {WIDTHS.map((width) => (
                <option key={width} value={width}>
                  {width}
                </option>
              ))}
            </select>
          </label>

          <Segment
            label="Position"
            value={desktopPosition}
            onChange={setDesktopPosition}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />

          <div>
            <span className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-overlay-subtle">
              Providers
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-none border border-overlay-border/10 bg-overlay-surface/30 p-1">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() =>
                    setProviders((current) => cycleProvider(current, provider))
                  }
                  className={
                    providers.includes(provider)
                      ? "h-8 rounded-none bg-overlay-text px-2 text-xs font-semibold text-overlay-bg"
                      : "h-8 rounded-none px-2 text-xs font-medium text-overlay-muted transition-colors hover:text-overlay-text"
                  }
                >
                  {labelForProvider(provider)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 border-t border-overlay-border/10 pt-3 text-xs leading-relaxed text-overlay-muted">
          {selectedScenario?.description}
        </p>
      </aside>
      )}
    </div>
  );
}
