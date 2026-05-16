import {
  Check,
  ChevronDown,
  Github,
  Layers3,
  LockKeyhole,
  Play,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CodeBlock } from "../code/server-code-block";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  type AuthBackdropConfig,
  type AuthConfig,
  type AuthConfigGroup,
  type DrawerMode,
  type MotionSettings,
  type OAuthProvider,
} from "@/components/auth/auth-drawer";

type PropDef = {
  name: string;
  type: string;
  default?: string;
  description: string;
};

type SectionProps = {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

const NAV_ITEMS = [
  ["Start", "start"],
  ["Install", "installation"],
  ["Showcase", "showcase"],
  ["Configurator", "configurator"],
  ["API", "api"],
  ["ui.auth", "api-auth"],
  ["ui.visual", "api-visual"],
  ["ui.motion", "api-motion"],
] as const;

const AUTH_DRAWER_PROPS: PropDef[] = [
  {
    name: "config",
    type: "AuthConfig",
    default: "DEFAULT_CONFIG",
    description: "UI, trigger, motion, and backend handler configuration.",
  },
  {
    name: "hideTrigger",
    type: "boolean",
    default: "false",
    description: "Hide the built-in trigger when your app owns the entry point.",
  },
  {
    name: "open",
    type: "boolean",
    description: "Controlled open state. Pair with onOpenChange.",
  },
  {
    name: "defaultOpen",
    type: "boolean",
    default: "false",
    description: "Initial open state for uncontrolled mode.",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    description: "Called whenever the auth surface opens or closes.",
  },
  {
    name: "triggerStore",
    type: "AuthTriggerStore",
    description: "Optional central trigger bus shared with app code.",
  },
];

const CONFIG_PROPS: PropDef[] = [
  {
    name: "ui.auth",
    type: "AuthConfigGroup",
    description: "Providers, register mode, remember-me, and forgot-password controls.",
  },
  {
    name: "ui.presentation",
    type: "AuthPresentationConfig",
    description: "Drawer or modal presentation plus default open behavior.",
  },
  {
    name: "ui.visual",
    type: "AuthVisualConfig",
    description: "Backdrop color, opacity, blur, and gradient treatment.",
  },
  {
    name: "ui.motion",
    type: "Partial<MotionSettings>",
    description: "Desktop width, position, entry timing, drag physics, and form layout.",
  },
  {
    name: "triggers",
    type: "AuthTriggerConfig",
    description: "Page-load, click, state, scroll, idle, or custom activation rules.",
  },
  {
    name: "onCredential",
    type: "(input) => Promise<void>",
    description: "Receives login/register credential submissions after validation passes.",
  },
];

const AUTH_CONFIG_GROUP_PROPS: PropDef[] = [
  {
    name: "providers",
    type: "OAuthProvider[]",
    default: '["github", "google"]',
    description:
      "OAuth providers to render. Pass an empty array to hide the OAuth section entirely.",
  },
  {
    name: "oauthLayout",
    type: '"row" | "column"',
    default: '"column"',
    description: "Stack OAuth buttons vertically or side-by-side.",
  },
  {
    name: "allowRegister",
    type: "boolean",
    default: "true",
    description: "Show the register tab and sign-up flow.",
  },
  {
    name: "showRememberMe",
    type: "boolean",
    default: "true",
    description: "Render the remember-me checkbox on login.",
  },
  {
    name: "initialMode",
    type: '"login" | "register"',
    default: '"login"',
    description: "Which form tab is active when the drawer first opens.",
  },
  {
    name: "showForgotPassword",
    type: "boolean",
    default: "true",
    description: "Show the forgot-password link below the password field.",
  },
  {
    name: "showLivePasswordMatch",
    type: "boolean",
    default: "true",
    description: "Show real-time password match feedback on the register form.",
  },
];

const VISUAL_PROPS: PropDef[] = [
  {
    name: "backdrop.color",
    type: "string",
    default: '"#070708"',
    description: "Base fill color of the backdrop overlay.",
  },
  {
    name: "backdrop.opacity",
    type: "number",
    default: "0.85",
    description: "Opacity of the backdrop fill (0–1).",
  },
  {
    name: "backdrop.blur",
    type: "number",
    default: "6",
    description: "Backdrop-filter blur radius in pixels.",
  },
  {
    name: "backdrop.gradient.angle",
    type: "number",
    default: "180",
    description: "CSS linear-gradient angle in degrees.",
  },
  {
    name: "backdrop.gradient.from",
    type: "string",
    default: '"transparent"',
    description: "Gradient start color.",
  },
  {
    name: "backdrop.gradient.to",
    type: "string",
    default: '"#070708"',
    description: "Gradient end color.",
  },
  {
    name: "backdrop.gradient.fromPos",
    type: "number",
    default: "100",
    description: "Gradient start stop as a percentage (0–100).",
  },
  {
    name: "backdrop.gradient.toPos",
    type: "number",
    default: "100",
    description: "Gradient end stop as a percentage (0–100).",
  },
];

const MOTION_DRAG_PROPS: PropDef[] = [
  {
    name: "upwardResistance",
    type: "number",
    default: "0.15",
    description:
      "Resistance factor applied when dragging upward past the natural top. Lower = more rubber-band.",
  },
  {
    name: "downwardThreshold",
    type: "number",
    default: "0.25",
    description: "Fraction of drawer height that must be dragged downward to trigger a close snap.",
  },
  {
    name: "velocityThreshold",
    type: "number",
    default: "500",
    description: "Pointer velocity (px/s) that triggers a close snap regardless of drag distance.",
  },
  {
    name: "snapStiffness",
    type: "number",
    default: "850",
    description: "Spring stiffness for the snap-back animation. Higher = snappier.",
  },
  {
    name: "snapDamping",
    type: "number",
    default: "14",
    description: "Spring damping for the snap-back animation. Higher = less oscillation.",
  },
  {
    name: "snapMass",
    type: "number",
    default: "0.8",
    description: "Simulated mass for the snap spring. Affects how much momentum carries through.",
  },
];

const MOTION_LAYOUT_PROPS: PropDef[] = [
  {
    name: "displayMode",
    type: '"drawer" | "modal"',
    default: '"drawer"',
    description:
      "Controls how the surface is positioned on desktop — bottom-sheet drawer or centred modal.",
  },
  {
    name: "desktopWidth",
    type: "string",
    default: '"448px"',
    description: "CSS width of the auth surface on desktop viewports.",
  },
  {
    name: "desktopPosition",
    type: '"center" | "left" | "right"',
    default: '"center"',
    description: "Horizontal alignment of the surface on desktop.",
  },
  {
    name: "formPaddingTop",
    type: "number",
    default: "0",
    description: "Extra top padding inside the form panel (px).",
  },
  {
    name: "formPaddingBottom",
    type: "number",
    default: "0",
    description:
      "Extra bottom padding inside the form panel (px). Useful when a host needs to bias the form upward.",
  },
  {
    name: "formJustify",
    type: "string",
    default: '"center"',
    description: "CSS justify-content value for the form container.",
  },
  {
    name: "formAlign",
    type: "string",
    default: '"center"',
    description: "CSS align-items value for the form container.",
  },
];

const MOTION_ENTRY_EXIT_PROPS: PropDef[] = [
  {
    name: "entryDuration",
    type: "number",
    default: "0.9",
    description: "Duration of the open animation in seconds.",
  },
  {
    name: "entryDelay",
    type: "number",
    default: "0",
    description: "Delay before the open animation starts (seconds).",
  },
  {
    name: "entryScale",
    type: "number",
    default: "0.95",
    description: "Initial scale of the surface at the start of the open animation.",
  },
  {
    name: "entryY",
    type: "number",
    default: "20",
    description: "Initial Y offset (px) at the start of the open animation.",
  },
  {
    name: "entryEase",
    type: "string",
    default: '"[0.23,1,0.32,1]"',
    description: "Easing for the open animation — CSS easing string or cubic-bezier array literal.",
  },
  {
    name: "exitDuration",
    type: "number",
    default: "0.3",
    description: "Duration of the close animation in seconds.",
  },
  {
    name: "exitDelay",
    type: "number",
    default: "0",
    description: "Delay before the close animation starts (seconds).",
  },
  {
    name: "exitScale",
    type: "number",
    default: "0.95",
    description: "Final scale of the surface at the end of the close animation.",
  },
  {
    name: "exitY",
    type: "number",
    default: "10",
    description: "Final Y offset (px) at the end of the close animation.",
  },
  {
    name: "exitEase",
    type: "string",
    default: '"easeIn"',
    description: "Easing for the close animation.",
  },
];

const MOTION_BACKDROP_PROPS: PropDef[] = [
  {
    name: "backdropOpacity",
    type: "number",
    default: "0.85",
    description: "Target opacity of the animated backdrop (0–1).",
  },
  {
    name: "backdropColor",
    type: "string",
    default: '"#070708"',
    description: "Backdrop fill color used by the motion layer.",
  },
  {
    name: "backdropBlur",
    type: "number",
    default: "6",
    description: "Backdrop blur radius (px) applied via the motion layer.",
  },
  {
    name: "backdropAngle",
    type: "number",
    default: "180",
    description: "Gradient angle (degrees) on the motion backdrop.",
  },
  {
    name: "backdropStartColor",
    type: "string",
    default: '"transparent"',
    description: "Gradient start color on the motion backdrop.",
  },
  {
    name: "backdropEndColor",
    type: "string",
    default: '"#070708"',
    description: "Gradient end color on the motion backdrop.",
  },
  {
    name: "backdropStartPos",
    type: "number",
    default: "100",
    description: "Gradient start stop (%) on the motion backdrop.",
  },
  {
    name: "backdropEndPos",
    type: "number",
    default: "100",
    description: "Gradient end stop (%) on the motion backdrop.",
  },
];

function Section({ id, title, eyebrow, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 py-14 first:pt-0">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/10 pb-3">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground/38">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-xl font-semibold leading-[1.1] tracking-normal text-foreground">
            {title}
          </h2>
        </div>
        <a
          href={`#${id}`}
          className="hidden text-[0.7rem] font-semibold text-foreground/36 transition-colors hover:text-foreground sm:block"
        >
          #{id}
        </a>
      </div>
      {children}
    </section>
  );
}

function PropTable({ props }: { props: PropDef[] }) {
  return (
    <div className="custom-scrollbar overflow-x-auto rounded-[6px] border border-foreground/10 bg-background">
      <table className="min-w-[44rem] w-full text-left text-xs">
        <thead className="bg-foreground/[0.035] text-foreground/48">
          <tr>
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold">Type</th>
            <th className="hidden px-3 py-2 font-semibold sm:table-cell">Default</th>
            <th className="px-3 py-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-t border-foreground/8">
              <td className="px-3 py-2 font-mono text-[0.72rem] font-semibold text-foreground">
                {prop.name}
              </td>
              <td className="max-w-48 px-3 py-2 font-mono text-[0.68rem] text-foreground/55">
                {prop.type}
              </td>
              <td className="hidden px-3 py-2 font-mono text-[0.68rem] text-foreground/42 sm:table-cell">
                {prop.default ?? "-"}
              </td>
              <td className="px-3 py-2 text-foreground/66">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DEFAULTS = DEFAULT_CONFIG.ui;

function arraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function EditedDot({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      className="group -ml-0.5 mr-1 inline-flex items-center justify-center"
      title="Reset to default"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70 transition-[background-color,transform] duration-100 group-hover:bg-blue-500 group-active:scale-90" />
    </button>
  );
}

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  isEdited?: boolean;
  onReset?: () => void;
};

function SelectField<T extends string>({ label, value, options, onChange, isEdited, onReset }: SelectFieldProps<T>) {
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
          className="h-10 w-full appearance-none rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 pr-9 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 dark:bg-[#0f0f10]"
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

function ToggleButton({
  checked,
  children,
  onChange,
  isEdited,
  onReset,
}: {
  checked: boolean;
  children: ReactNode;
  onChange: (checked: boolean) => void;
  isEdited?: boolean;
  onReset?: () => void;
}) {
  return (
    <span className="relative inline-flex items-center gap-1">
      {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={
          checked
            ? "inline-flex h-9 items-center gap-2 rounded-[5px] border border-foreground bg-foreground px-3 text-xs font-semibold text-background"
            : "inline-flex h-9 items-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-3 text-xs font-semibold text-foreground/62 transition-colors hover:border-foreground/22 hover:text-foreground"
        }
      >
        {checked ? <Check size={13} aria-hidden="true" /> : null}
        {children}
      </button>
    </span>
  );
}

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  isEdited?: boolean;
  onReset?: () => void;
};
function SliderField({ label, value, min, max, step, onChange, isEdited, onReset }: SliderFieldProps) {
  return (
    <label className="block rounded-[5px] border border-foreground/10 bg-foreground/[0.025] px-3 py-2.5">
      <span className="mb-1.5 flex items-center justify-between text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
        <span className="flex items-center">
          {isEdited && onReset ? <EditedDot onReset={onReset} /> : null}
          {label}
        </span>
        <span className="font-mono text-[0.68rem] font-semibold text-foreground/60">{value}</span>
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

type NumberFieldProps = {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
  isEdited?: boolean;
  onReset?: () => void;
};
function NumberField({ label, value, step, onChange, isEdited, onReset }: NumberFieldProps) {
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
        className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 dark:bg-[#0f0f10]"
      />
    </label>
  );
}

type TextFieldProps = { label: string; value: string; onChange: (value: string) => void; isEdited?: boolean; onReset?: () => void };
function TextField({ label, value, onChange, isEdited, onReset }: TextFieldProps) {
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
        className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 dark:bg-[#0f0f10]"
      />
    </label>
  );
}

type ColorFieldProps = { label: string; value: string; onChange: (value: string) => void; isEdited?: boolean; onReset?: () => void };
function ColorField({ label, value, onChange, isEdited, onReset }: ColorFieldProps) {
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
          className="h-10 w-10 border-0 bg-transparent p-1"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 font-mono text-xs font-semibold text-foreground outline-hidden"
        />
      </div>
    </label>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-[6px] border border-foreground/10 bg-background p-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[5px] bg-foreground text-background">
        <Icon size={15} aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-foreground/58">{body}</p>
      </div>
    </div>
  );
}

const DEFAULT_USAGE_CODE = `import { AuthDrawer } from "@remcostoeten/auth-drawer";

export function App() {
  return (
    <AuthDrawer
      config={{
        onCredential: async (input) => signIn(input),
        onOAuth: async (provider) => signInWithOAuth(provider),
      }}
    />
  );
}`;

function buildConfig({
  mode,
  auth,
  backdrop,
  motion,
}: {
  mode: DrawerMode;
  auth: AuthConfigGroup;
  backdrop: Required<AuthBackdropConfig> & {
    gradient: Required<NonNullable<AuthBackdropConfig["gradient"]>>;
  };
  motion: MotionSettings;
}): AuthConfig {
  return {
    ui: {
      presentation: { variant: mode },
      auth,
      motion: { ...motion, displayMode: mode },
      visual: { backdrop },
    },
    onCredential: async () => {
      await new Promise((r) => setTimeout(r, 450));
    },
    onOAuth: async () => {
      await new Promise((r) => setTimeout(r, 450));
    },
    onForgotPassword: async () => {
      await new Promise((r) => setTimeout(r, 450));
    },
  };
}

function initBackdrop(): Required<AuthBackdropConfig> & {
  gradient: Required<NonNullable<AuthBackdropConfig["gradient"]>>;
} {
  const b = DEFAULTS.visual.backdrop;
  return {
    color: b.color,
    opacity: b.opacity,
    blur: b.blur,
    gradient: {
      angle: b.gradient?.angle ?? 180,
      from: b.gradient?.from ?? "transparent",
      to: b.gradient?.to ?? "#070708",
      fromPos: b.gradient?.fromPos ?? 100,
      toPos: b.gradient?.toPos ?? 100,
    },
  };
}

function initMotion(): MotionSettings {
  return { ...DEFAULTS.motion };
}

export function DocsPage() {
  const [isOpen, setOpen] = useState(false);
  const [isConfiguratorExpanded, setConfiguratorExpanded] = useState(false);
  const [configuratorTab, setConfiguratorTab] = useState<"auth" | "visual" | "motion">("auth");
  const [mode, setMode] = useState<DrawerMode>("drawer");
  const [auth, setAuth] = useState<AuthConfigGroup>({ ...DEFAULTS.auth });
  const [backdrop, setBackdrop] = useState(initBackdrop);
  const [motion, setMotion] = useState(initMotion);
  const [isConfigInView, setConfigInView] = useState(false);
  const configSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = configSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setConfigInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "ShiftLeft" || event.repeat) return;
      if (!isConfigInView) return;
      event.preventDefault();
      setOpen((prev) => !prev);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfigInView]);

  function resetConfig() {
    setMode("drawer");
    setAuth({ ...DEFAULTS.auth });
    setBackdrop(initBackdrop());
    setMotion(initMotion());
  }

  function updateAuth<K extends keyof AuthConfigGroup>(key: K, value: AuthConfigGroup[K]) {
    setAuth((prev) => ({ ...prev, [key]: value }));
  }

  function cycleProvider(provider: OAuthProvider) {
    setAuth((prev) => ({
      ...prev,
      providers: prev.providers?.includes(provider)
        ? prev.providers.filter((p) => p !== provider)
        : [...(prev.providers ?? []), provider],
    }));
  }

  function updateBackdrop<K extends keyof typeof backdrop>(key: K, value: (typeof backdrop)[K]) {
    setBackdrop((prev) => ({ ...prev, [key]: value }));
  }

  function updateGradient<K extends keyof typeof backdrop.gradient>(
    key: K,
    value: (typeof backdrop.gradient)[K],
  ) {
    setBackdrop((prev) => ({
      ...prev,
      gradient: { ...prev.gradient, [key]: value },
    }));
  }

  function updateMotion<K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) {
    setMotion((prev) => ({ ...prev, [key]: value }));
  }

  const config = useMemo(
    () => buildConfig({ mode, auth, backdrop, motion }),
    [mode, auth, backdrop, motion],
  );

  const usageCode = useMemo(() => {
    const motionLines: string[] = [`displayMode: "${mode}"`];
    if (motion.desktopWidth !== DEFAULTS.motion.desktopWidth)
      motionLines.push(`desktopWidth: "${motion.desktopWidth}"`);
    if (motion.entryDuration !== DEFAULTS.motion.entryDuration)
      motionLines.push(`entryDuration: ${motion.entryDuration}`);
    if (motion.exitDuration !== DEFAULTS.motion.exitDuration)
      motionLines.push(`exitDuration: ${motion.exitDuration}`);
    if (motion.entryEase !== DEFAULTS.motion.entryEase)
      motionLines.push(`entryEase: "${motion.entryEase}"`);
    if (motion.exitEase !== DEFAULTS.motion.exitEase)
      motionLines.push(`exitEase: "${motion.exitEase}"`);
    if (motion.entryScale !== DEFAULTS.motion.entryScale)
      motionLines.push(`entryScale: ${motion.entryScale}`);
    if (motion.exitScale !== DEFAULTS.motion.exitScale)
      motionLines.push(`exitScale: ${motion.exitScale}`);
    if (motion.entryY !== DEFAULTS.motion.entryY) motionLines.push(`entryY: ${motion.entryY}`);
    if (motion.exitY !== DEFAULTS.motion.exitY) motionLines.push(`exitY: ${motion.exitY}`);
    if (motion.entryDelay !== DEFAULTS.motion.entryDelay)
      motionLines.push(`entryDelay: ${motion.entryDelay}`);
    if (motion.exitDelay !== DEFAULTS.motion.exitDelay)
      motionLines.push(`exitDelay: ${motion.exitDelay}`);
    if (motion.upwardResistance !== DEFAULTS.motion.upwardResistance)
      motionLines.push(`upwardResistance: ${motion.upwardResistance}`);
    if (motion.downwardThreshold !== DEFAULTS.motion.downwardThreshold)
      motionLines.push(`downwardThreshold: ${motion.downwardThreshold}`);
    if (motion.velocityThreshold !== DEFAULTS.motion.velocityThreshold)
      motionLines.push(`velocityThreshold: ${motion.velocityThreshold}`);
    if (motion.snapStiffness !== DEFAULTS.motion.snapStiffness)
      motionLines.push(`snapStiffness: ${motion.snapStiffness}`);
    if (motion.snapDamping !== DEFAULTS.motion.snapDamping)
      motionLines.push(`snapDamping: ${motion.snapDamping}`);
    if (motion.snapMass !== DEFAULTS.motion.snapMass)
      motionLines.push(`snapMass: ${motion.snapMass}`);
    if (motion.formPaddingTop !== DEFAULTS.motion.formPaddingTop)
      motionLines.push(`formPaddingTop: ${motion.formPaddingTop}`);
    if (motion.formPaddingBottom !== DEFAULTS.motion.formPaddingBottom)
      motionLines.push(`formPaddingBottom: ${motion.formPaddingBottom}`);
    if (motion.formJustify !== DEFAULTS.motion.formJustify)
      motionLines.push(`formJustify: "${motion.formJustify}"`);
    if (motion.formAlign !== DEFAULTS.motion.formAlign)
      motionLines.push(`formAlign: "${motion.formAlign}"`);
    if (motion.backdropOpacity !== DEFAULTS.motion.backdropOpacity)
      motionLines.push(`backdropOpacity: ${motion.backdropOpacity}`);
    if (motion.backdropBlur !== DEFAULTS.motion.backdropBlur)
      motionLines.push(`backdropBlur: ${motion.backdropBlur}`);
    if (motion.backdropAngle !== DEFAULTS.motion.backdropAngle)
      motionLines.push(`backdropAngle: ${motion.backdropAngle}`);
    if (motion.backdropStartPos !== DEFAULTS.motion.backdropStartPos)
      motionLines.push(`backdropStartPos: ${motion.backdropStartPos}`);
    if (motion.backdropEndPos !== DEFAULTS.motion.backdropEndPos)
      motionLines.push(`backdropEndPos: ${motion.backdropEndPos}`);

    const authLines: string[] = [
      `providers: [${(auth.providers ?? []).map((p) => `"${p}"`).join(", ")}]`,
    ];
    if (auth.oauthLayout !== DEFAULTS.auth.oauthLayout)
      authLines.push(`oauthLayout: "${auth.oauthLayout}"`);
    if (auth.allowRegister !== DEFAULTS.auth.allowRegister)
      authLines.push(`allowRegister: ${auth.allowRegister}`);
    if (auth.showRememberMe !== DEFAULTS.auth.showRememberMe)
      authLines.push(`showRememberMe: ${auth.showRememberMe}`);
    if (auth.initialMode !== DEFAULTS.auth.initialMode)
      authLines.push(`initialMode: "${auth.initialMode}"`);
    if (auth.showForgotPassword !== DEFAULTS.auth.showForgotPassword)
      authLines.push(`showForgotPassword: ${auth.showForgotPassword}`);
    if (auth.showLivePasswordMatch !== DEFAULTS.auth.showLivePasswordMatch)
      authLines.push(`showLivePasswordMatch: ${auth.showLivePasswordMatch}`);

    return `<AuthDrawer
  config={{
    ui: {
      presentation: { variant: "${mode}" },
      auth: {
        ${authLines.join(",\n        ")}
      },
      motion: {
        ${motionLines.join(",\n        ")}
      },
      visual: {
        backdrop: {
          color: "${backdrop.color}",
          opacity: ${backdrop.opacity},
          blur: ${backdrop.blur},
          gradient: {
            angle: ${backdrop.gradient.angle},
            from: "${backdrop.gradient.from}",
            to: "${backdrop.gradient.to}",
            fromPos: ${backdrop.gradient.fromPos},
            toPos: ${backdrop.gradient.toPos},
          },
        },
      },
    },
    onCredential: async (input) => signIn(input),
    onOAuth: async (provider) => signInWithOAuth(provider),
  }}
/>`;
  }, [mode, auth, backdrop, motion]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-16">
            <a href="#start" className="mb-7 flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-foreground text-background">
                <LockKeyhole size={14} aria-hidden="true" />
              </span>
              Auth Drawer
            </a>
            <nav className="space-y-1">
              {NAV_ITEMS.map(([label, href]) => {
                const isSub = href.startsWith("api-");
                return (
                  <a
                    key={`${label}-${href}`}
                    href={`#${href}`}
                    className={
                      isSub
                        ? "block rounded-[5px] py-1.5 pl-5 pr-2.5 text-[0.7rem] font-medium text-foreground/36 transition-colors hover:bg-foreground/[0.03] hover:text-foreground/70"
                        : "block rounded-[5px] px-2.5 py-2 text-xs font-semibold text-foreground/48 transition-colors hover:bg-foreground/[0.045] hover:text-foreground"
                    }
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Section id="start" title="Start" eyebrow="Introduction">
            <p className="mb-6 max-w-2xl text-sm leading-6 text-foreground/58">
              <strong className="text-foreground">Auth Drawer</strong> is a configurable, animated
              authentication surface for React. It ships as a mobile-optimised bottom-sheet drawer
              that can also render as a centred modal on desktop, with a single, type-safe config
              object controlling every visual, motion, and behavioural detail.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[6px] border border-foreground/10 bg-foreground/[0.025] p-3.5">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  One config, full control
                </h4>
                <p className="text-xs leading-5 text-foreground/54">
                  Every aspect — providers, backdrop, spring physics, form layout — lives in a
                  single typed object. No scattered props, no hidden defaults.
                </p>
              </div>
              <div className="rounded-[6px] border border-foreground/10 bg-foreground/[0.025] p-3.5">
                <h4 className="mb-1 text-sm font-semibold text-foreground">Desktop + mobile</h4>
                <p className="text-xs leading-5 text-foreground/54">
                  Bottom-sheet on mobile with drag-to-dismiss; configurable drawer or centred modal
                  on desktop. Responsive by default.
                </p>
              </div>
              <div className="rounded-[6px] border border-foreground/10 bg-foreground/[0.025] p-3.5">
                <h4 className="mb-1 text-sm font-semibold text-foreground">Trigger any way</h4>
                <p className="text-xs leading-5 text-foreground/54">
                  Page load, scroll, idle state, app state, click, or a shared trigger bus — wire it
                  up however your UX requires.
                </p>
              </div>
              <div className="rounded-[6px] border border-foreground/10 bg-foreground/[0.025] p-3.5">
                <h4 className="mb-1 text-sm font-semibold text-foreground">Bring your own auth</h4>
                <p className="text-xs leading-5 text-foreground/54">
                  Supabase, Better Auth, Lucia, custom sessions — pass any async handler via{" "}
                  <code className="font-mono text-[0.65rem]">onCredential</code> /{" "}
                  <code className="font-mono text-[0.65rem]">onOAuth</code>.
                </p>
              </div>
            </div>
          </Section>

          <Section id="installation" title="Install in two steps" eyebrow="Setup">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                <h3 className="mb-3 text-sm font-semibold">Package</h3>
                <CodeBlock>npm install @remcostoeten/auth-drawer</CodeBlock>
              </div>
              <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                <h3 className="mb-3 text-sm font-semibold">CSS</h3>
                <CodeBlock>{`@import "@remcostoeten/auth-drawer/styles.css";
@source "node_modules/@remcostoeten/auth-drawer/dist";`}</CodeBlock>
              </div>
            </div>
            <div className="mt-4">
              <CodeBlock>{DEFAULT_USAGE_CODE}</CodeBlock>
            </div>
          </Section>

          <Section id="showcase" title="Out of the box" eyebrow="Default experience">
            <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Ship the default drawer first
                    </h3>
                    <p className="mt-2 max-w-xl text-xs leading-5 text-foreground/58">
                      The package opens as a polished mobile-first drawer with OAuth, login,
                      register, remember-me, forgot-password, backdrop, and drag behaviour already
                      configured.
                    </p>
                  </div>
                  <span className="hidden h-8 shrink-0 items-center rounded-[5px] border border-foreground/10 px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/42 sm:inline-flex">
                    DEFAULT_CONFIG
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
                  >
                    <Play size={14} aria-hidden="true" />
                    Try default drawer
                  </button>
                  <a
                    href="#configurator"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/68 transition-colors hover:border-foreground/22 hover:text-foreground"
                  >
                    <SlidersHorizontal size={14} aria-hidden="true" />
                    Customize after
                  </a>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <FeatureRow
                  icon={ShieldCheck}
                  title="Backend agnostic"
                  body="Bring Supabase, Better Auth, custom JWT & sessions, or any async auth handlers."
                />
                <FeatureRow
                  icon={Layers3}
                  title="Drawer or modal"
                  body="Use the same config shape for modal, drawer, desktop width, and position."
                />
                <FeatureRow
                  icon={Sparkles}
                  title="Triggerable"
                  body="Open from app state, scroll, clicks, page load, idle state, or your own event bus."
                />
              </div>
            </div>
          </Section>

          <Section id="configurator" title="Configurator" eyebrow="Opt-in controls">
            <div ref={configSectionRef}>
            {!isConfiguratorExpanded ? (
              <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.55fr)] lg:items-center">
                  <div>
                    <div className="mb-3 inline-flex h-8 items-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/46">
                      <SlidersHorizontal size={13} aria-hidden="true" />
                      Advanced
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Customize when the defaults are not enough
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/58">
                      The full configurator is still here, but it stays collapsed until someone
                      wants to tune providers, visual treatment, motion, drag physics, and generated
                      config output.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
                    >
                      <Play size={14} aria-hidden="true" />
                      Show default
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfiguratorExpanded(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/68 transition-colors hover:border-foreground/22 hover:text-foreground"
                    >
                      <SlidersHorizontal size={14} aria-hidden="true" />
                      Open configurator
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)]">
                <div className="custom-scrollbar space-y-3 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
                  {/* Always-visible show button */}
                  <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
                    >
                      <Play size={14} aria-hidden="true" />
                      Show current
                    </button>
                    <button
                      type="button"
                      onClick={resetConfig}
                      className="inline-flex h-10 items-center justify-center rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/58 transition-colors hover:border-foreground/22 hover:text-foreground"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfiguratorExpanded(false)}
                      className="inline-flex h-10 items-center justify-center rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/58 transition-colors hover:border-foreground/22 hover:text-foreground"
                    >
                      Collapse
                    </button>
                  </div>

                  {/* Tab bar */}
                  <div className="flex rounded-[6px] border border-foreground/10 bg-foreground/[0.025] p-1 gap-1">
                    {(["auth", "visual", "motion"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setConfiguratorTab(tab)}
                        className={
                          configuratorTab === tab
                            ? "flex-1 rounded-[4px] bg-foreground px-3 py-1.5 text-[0.7rem] font-semibold text-background transition-colors"
                            : "flex-1 rounded-[4px] px-3 py-1.5 text-[0.7rem] font-semibold text-foreground/42 transition-colors hover:text-foreground/70"
                        }
                      >
                        {tab === "auth" ? "Auth" : tab === "visual" ? "Visual" : "Motion"}
                      </button>
                    ))}
                  </div>

                  {/* Auth tab */}
                  {configuratorTab === "auth" && (
                    <div className="space-y-3">
                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                          Presentation
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                          <SelectField
                            label="Surface"
                            value={mode}
                            onChange={setMode}
                            options={[
                              { value: "drawer", label: "Drawer" },
                              { value: "modal", label: "Modal" },
                            ]}
                            isEdited={mode !== DEFAULTS.presentation.variant}
                            onReset={() => setMode(DEFAULTS.presentation.variant)}
                          />
                          <label className="block">
                            <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                              {motion.desktopWidth !== DEFAULTS.motion.desktopWidth ? (
                                <EditedDot onReset={() => updateMotion("desktopWidth", DEFAULTS.motion.desktopWidth)} />
                              ) : null}
                              Width
                            </span>
                            <input
                              type="text"
                              value={motion.desktopWidth}
                              onChange={(e) => updateMotion("desktopWidth", e.target.value)}
                              className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 dark:bg-[#0f0f10]"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                          ui.auth
                        </h3>
                        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                          <SelectField
                            label="OAuth layout"
                            value={auth.oauthLayout ?? "column"}
                            onChange={(v) => updateAuth("oauthLayout", v)}
                            options={[
                              { value: "column", label: "Column" },
                              { value: "row", label: "Row" },
                            ]}
                            isEdited={(auth.oauthLayout ?? "column") !== DEFAULTS.auth.oauthLayout}
                            onReset={() => updateAuth("oauthLayout", DEFAULTS.auth.oauthLayout)}
                          />
                          <SelectField
                            label="Initial mode"
                            value={auth.initialMode ?? "login"}
                            onChange={(v) => updateAuth("initialMode", v)}
                            options={[
                              { value: "login", label: "Login" },
                              { value: "register", label: "Register" },
                            ]}
                            isEdited={(auth.initialMode ?? "login") !== DEFAULTS.auth.initialMode}
                            onReset={() => updateAuth("initialMode", DEFAULTS.auth.initialMode)}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ToggleButton
                            checked={(auth.providers ?? []).includes("github")}
                            onChange={() => cycleProvider("github")}
                            isEdited={!arraysEqual(auth.providers ?? [], DEFAULTS.auth.providers)}
                            onReset={() => setAuth((prev) => ({ ...prev, providers: [...DEFAULTS.auth.providers] }))}
                          >
                            <Github size={13} aria-hidden="true" /> GitHub
                          </ToggleButton>
                          <ToggleButton
                            checked={(auth.providers ?? []).includes("google")}
                            onChange={() => cycleProvider("google")}
                            isEdited={!arraysEqual(auth.providers ?? [], DEFAULTS.auth.providers)}
                            onReset={() => setAuth((prev) => ({ ...prev, providers: [...DEFAULTS.auth.providers] }))}
                          >
                            Google
                          </ToggleButton>
                          <ToggleButton
                            checked={auth.allowRegister ?? true}
                            onChange={(v) => updateAuth("allowRegister", v)}
                            isEdited={(auth.allowRegister ?? true) !== DEFAULTS.auth.allowRegister}
                            onReset={() => updateAuth("allowRegister", DEFAULTS.auth.allowRegister)}
                          >
                            Register
                          </ToggleButton>
                          <ToggleButton
                            checked={auth.showRememberMe ?? true}
                            onChange={(v) => updateAuth("showRememberMe", v)}
                            isEdited={(auth.showRememberMe ?? true) !== DEFAULTS.auth.showRememberMe}
                            onReset={() => updateAuth("showRememberMe", DEFAULTS.auth.showRememberMe)}
                          >
                            Remember
                          </ToggleButton>
                          <ToggleButton
                            checked={auth.showForgotPassword ?? true}
                            onChange={(v) => updateAuth("showForgotPassword", v)}
                            isEdited={(auth.showForgotPassword ?? true) !== DEFAULTS.auth.showForgotPassword}
                            onReset={() => updateAuth("showForgotPassword", DEFAULTS.auth.showForgotPassword)}
                          >
                            Forgot pwd
                          </ToggleButton>
                          <ToggleButton
                            checked={auth.showLivePasswordMatch ?? true}
                            onChange={(v) => updateAuth("showLivePasswordMatch", v)}
                            isEdited={(auth.showLivePasswordMatch ?? true) !== DEFAULTS.auth.showLivePasswordMatch}
                            onReset={() => updateAuth("showLivePasswordMatch", DEFAULTS.auth.showLivePasswordMatch)}
                          >
                            Live match
                          </ToggleButton>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual tab */}
                  {configuratorTab === "visual" && (
                    <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                      <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                        ui.visual.backdrop
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <ColorField
                          label="Color"
                          value={backdrop.color}
                          onChange={(v) => updateBackdrop("color", v)}
                          isEdited={backdrop.color !== DEFAULTS.visual.backdrop.color}
                          onReset={() => updateBackdrop("color", DEFAULTS.visual.backdrop.color)}
                        />
                        <SliderField
                          label="Opacity"
                          value={backdrop.opacity}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(v) => updateBackdrop("opacity", v)}
                          isEdited={backdrop.opacity !== DEFAULTS.visual.backdrop.opacity}
                          onReset={() => updateBackdrop("opacity", DEFAULTS.visual.backdrop.opacity)}
                        />
                        <SliderField
                          label="Blur (px)"
                          value={backdrop.blur}
                          min={0}
                          max={24}
                          step={1}
                          onChange={(v) => updateBackdrop("blur", v)}
                          isEdited={backdrop.blur !== DEFAULTS.visual.backdrop.blur}
                          onReset={() => updateBackdrop("blur", DEFAULTS.visual.backdrop.blur)}
                        />
                        <SliderField
                          label="Gradient angle"
                          value={backdrop.gradient.angle}
                          min={0}
                          max={360}
                          step={5}
                          onChange={(v) => updateGradient("angle", v)}
                          isEdited={backdrop.gradient.angle !== DEFAULTS.visual.backdrop.gradient.angle}
                          onReset={() => updateGradient("angle", DEFAULTS.visual.backdrop.gradient.angle)}
                        />
                        <ColorField
                          label="Gradient from"
                          value={backdrop.gradient.from}
                          onChange={(v) => updateGradient("from", v)}
                          isEdited={backdrop.gradient.from !== DEFAULTS.visual.backdrop.gradient.from}
                          onReset={() => updateGradient("from", DEFAULTS.visual.backdrop.gradient.from)}
                        />
                        <ColorField
                          label="Gradient to"
                          value={backdrop.gradient.to}
                          onChange={(v) => updateGradient("to", v)}
                          isEdited={backdrop.gradient.to !== DEFAULTS.visual.backdrop.gradient.to}
                          onReset={() => updateGradient("to", DEFAULTS.visual.backdrop.gradient.to)}
                        />
                        <SliderField
                          label="From pos %"
                          value={backdrop.gradient.fromPos}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(v) => updateGradient("fromPos", v)}
                          isEdited={backdrop.gradient.fromPos !== DEFAULTS.visual.backdrop.gradient.fromPos}
                          onReset={() => updateGradient("fromPos", DEFAULTS.visual.backdrop.gradient.fromPos)}
                        />
                        <SliderField
                          label="To pos %"
                          value={backdrop.gradient.toPos}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(v) => updateGradient("toPos", v)}
                          isEdited={backdrop.gradient.toPos !== DEFAULTS.visual.backdrop.gradient.toPos}
                          onReset={() => updateGradient("toPos", DEFAULTS.visual.backdrop.gradient.toPos)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Motion tab */}
                  {configuratorTab === "motion" && (
                    <div className="space-y-3">
                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                          Entry / exit
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <SliderField
                            label="Entry duration"
                            value={motion.entryDuration}
                            min={0}
                            max={2}
                            step={0.02}
                            onChange={(v) => updateMotion("entryDuration", v)}
                            isEdited={motion.entryDuration !== DEFAULTS.motion.entryDuration}
                            onReset={() => updateMotion("entryDuration", DEFAULTS.motion.entryDuration)}
                          />
                          <SliderField
                            label="Entry delay"
                            value={motion.entryDelay}
                            min={0}
                            max={1}
                            step={0.02}
                            onChange={(v) => updateMotion("entryDelay", v)}
                            isEdited={motion.entryDelay !== DEFAULTS.motion.entryDelay}
                            onReset={() => updateMotion("entryDelay", DEFAULTS.motion.entryDelay)}
                          />
                          <SliderField
                            label="Entry scale"
                            value={motion.entryScale}
                            min={0.7}
                            max={1.1}
                            step={0.01}
                            onChange={(v) => updateMotion("entryScale", v)}
                            isEdited={motion.entryScale !== DEFAULTS.motion.entryScale}
                            onReset={() => updateMotion("entryScale", DEFAULTS.motion.entryScale)}
                          />
                          <NumberField
                            label="Entry Y (px)"
                            value={motion.entryY}
                            step={1}
                            onChange={(v) => updateMotion("entryY", v)}
                            isEdited={motion.entryY !== DEFAULTS.motion.entryY}
                            onReset={() => updateMotion("entryY", DEFAULTS.motion.entryY)}
                          />
                          <TextField
                            label="Entry ease"
                            value={motion.entryEase}
                            onChange={(v) => updateMotion("entryEase", v)}
                            isEdited={motion.entryEase !== DEFAULTS.motion.entryEase}
                            onReset={() => updateMotion("entryEase", DEFAULTS.motion.entryEase)}
                          />
                          <SliderField
                            label="Exit duration"
                            value={motion.exitDuration}
                            min={0}
                            max={1.5}
                            step={0.02}
                            onChange={(v) => updateMotion("exitDuration", v)}
                            isEdited={motion.exitDuration !== DEFAULTS.motion.exitDuration}
                            onReset={() => updateMotion("exitDuration", DEFAULTS.motion.exitDuration)}
                          />
                          <SliderField
                            label="Exit delay"
                            value={motion.exitDelay}
                            min={0}
                            max={1}
                            step={0.02}
                            onChange={(v) => updateMotion("exitDelay", v)}
                            isEdited={motion.exitDelay !== DEFAULTS.motion.exitDelay}
                            onReset={() => updateMotion("exitDelay", DEFAULTS.motion.exitDelay)}
                          />
                          <SliderField
                            label="Exit scale"
                            value={motion.exitScale}
                            min={0.7}
                            max={1.1}
                            step={0.01}
                            onChange={(v) => updateMotion("exitScale", v)}
                            isEdited={motion.exitScale !== DEFAULTS.motion.exitScale}
                            onReset={() => updateMotion("exitScale", DEFAULTS.motion.exitScale)}
                          />
                          <NumberField
                            label="Exit Y (px)"
                            value={motion.exitY}
                            step={1}
                            onChange={(v) => updateMotion("exitY", v)}
                            isEdited={motion.exitY !== DEFAULTS.motion.exitY}
                            onReset={() => updateMotion("exitY", DEFAULTS.motion.exitY)}
                          />
                          <TextField
                            label="Exit ease"
                            value={motion.exitEase}
                            onChange={(v) => updateMotion("exitEase", v)}
                            isEdited={motion.exitEase !== DEFAULTS.motion.exitEase}
                            onReset={() => updateMotion("exitEase", DEFAULTS.motion.exitEase)}
                          />
                        </div>
                      </div>

                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                          Drag physics
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <SliderField
                            label="Up resistance"
                            value={motion.upwardResistance}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) => updateMotion("upwardResistance", v)}
                            isEdited={motion.upwardResistance !== DEFAULTS.motion.upwardResistance}
                            onReset={() => updateMotion("upwardResistance", DEFAULTS.motion.upwardResistance)}
                          />
                          <SliderField
                            label="Down threshold"
                            value={motion.downwardThreshold}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) => updateMotion("downwardThreshold", v)}
                            isEdited={motion.downwardThreshold !== DEFAULTS.motion.downwardThreshold}
                            onReset={() => updateMotion("downwardThreshold", DEFAULTS.motion.downwardThreshold)}
                          />
                          <NumberField
                            label="Velocity threshold"
                            value={motion.velocityThreshold}
                            step={50}
                            onChange={(v) => updateMotion("velocityThreshold", v)}
                            isEdited={motion.velocityThreshold !== DEFAULTS.motion.velocityThreshold}
                            onReset={() => updateMotion("velocityThreshold", DEFAULTS.motion.velocityThreshold)}
                          />
                          <NumberField
                            label="Snap stiffness"
                            value={motion.snapStiffness}
                            step={25}
                            onChange={(v) => updateMotion("snapStiffness", v)}
                            isEdited={motion.snapStiffness !== DEFAULTS.motion.snapStiffness}
                            onReset={() => updateMotion("snapStiffness", DEFAULTS.motion.snapStiffness)}
                          />
                          <NumberField
                            label="Snap damping"
                            value={motion.snapDamping}
                            step={1}
                            onChange={(v) => updateMotion("snapDamping", v)}
                            isEdited={motion.snapDamping !== DEFAULTS.motion.snapDamping}
                            onReset={() => updateMotion("snapDamping", DEFAULTS.motion.snapDamping)}
                          />
                          <SliderField
                            label="Snap mass"
                            value={motion.snapMass}
                            min={0.1}
                            max={2}
                            step={0.1}
                            onChange={(v) => updateMotion("snapMass", v)}
                            isEdited={motion.snapMass !== DEFAULTS.motion.snapMass}
                            onReset={() => updateMotion("snapMass", DEFAULTS.motion.snapMass)}
                          />
                        </div>
                      </div>

                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                          Form layout
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <NumberField
                            label="Padding top (px)"
                            value={motion.formPaddingTop}
                            step={8}
                            onChange={(v) => updateMotion("formPaddingTop", v)}
                            isEdited={motion.formPaddingTop !== DEFAULTS.motion.formPaddingTop}
                            onReset={() => updateMotion("formPaddingTop", DEFAULTS.motion.formPaddingTop)}
                          />
                          <NumberField
                            label="Padding bottom (px)"
                            value={motion.formPaddingBottom}
                            step={8}
                            onChange={(v) => updateMotion("formPaddingBottom", v)}
                            isEdited={motion.formPaddingBottom !== DEFAULTS.motion.formPaddingBottom}
                            onReset={() => updateMotion("formPaddingBottom", DEFAULTS.motion.formPaddingBottom)}
                          />
                          <TextField
                            label="Justify"
                            value={motion.formJustify}
                            onChange={(v) => updateMotion("formJustify", v)}
                            isEdited={motion.formJustify !== DEFAULTS.motion.formJustify}
                            onReset={() => updateMotion("formJustify", DEFAULTS.motion.formJustify)}
                          />
                          <TextField
                            label="Align"
                            value={motion.formAlign}
                            onChange={(v) => updateMotion("formAlign", v)}
                            isEdited={motion.formAlign !== DEFAULTS.motion.formAlign}
                            onReset={() => updateMotion("formAlign", DEFAULTS.motion.formAlign)}
                          />
                        </div>
                      </div>

                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                          Animated backdrop
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <SliderField
                            label="Opacity"
                            value={motion.backdropOpacity}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) => updateMotion("backdropOpacity", v)}
                            isEdited={motion.backdropOpacity !== DEFAULTS.motion.backdropOpacity}
                            onReset={() => updateMotion("backdropOpacity", DEFAULTS.motion.backdropOpacity)}
                          />
                          <SliderField
                            label="Blur (px)"
                            value={motion.backdropBlur}
                            min={0}
                            max={24}
                            step={1}
                            onChange={(v) => updateMotion("backdropBlur", v)}
                            isEdited={motion.backdropBlur !== DEFAULTS.motion.backdropBlur}
                            onReset={() => updateMotion("backdropBlur", DEFAULTS.motion.backdropBlur)}
                          />
                          <SliderField
                            label="Angle"
                            value={motion.backdropAngle}
                            min={0}
                            max={360}
                            step={5}
                            onChange={(v) => updateMotion("backdropAngle", v)}
                            isEdited={motion.backdropAngle !== DEFAULTS.motion.backdropAngle}
                            onReset={() => updateMotion("backdropAngle", DEFAULTS.motion.backdropAngle)}
                          />
                          <ColorField
                            label="Color"
                            value={motion.backdropColor}
                            onChange={(v) => updateMotion("backdropColor", v)}
                            isEdited={motion.backdropColor !== DEFAULTS.motion.backdropColor}
                            onReset={() => updateMotion("backdropColor", DEFAULTS.motion.backdropColor)}
                          />
                          <ColorField
                            label="Start color"
                            value={motion.backdropStartColor}
                            onChange={(v) => updateMotion("backdropStartColor", v)}
                            isEdited={motion.backdropStartColor !== DEFAULTS.motion.backdropStartColor}
                            onReset={() => updateMotion("backdropStartColor", DEFAULTS.motion.backdropStartColor)}
                          />
                          <ColorField
                            label="End color"
                            value={motion.backdropEndColor}
                            onChange={(v) => updateMotion("backdropEndColor", v)}
                            isEdited={motion.backdropEndColor !== DEFAULTS.motion.backdropEndColor}
                            onReset={() => updateMotion("backdropEndColor", DEFAULTS.motion.backdropEndColor)}
                          />
                          <SliderField
                            label="Start pos %"
                            value={motion.backdropStartPos}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(v) => updateMotion("backdropStartPos", v)}
                            isEdited={motion.backdropStartPos !== DEFAULTS.motion.backdropStartPos}
                            onReset={() => updateMotion("backdropStartPos", DEFAULTS.motion.backdropStartPos)}
                          />
                          <SliderField
                            label="End pos %"
                            value={motion.backdropEndPos}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(v) => updateMotion("backdropEndPos", v)}
                            isEdited={motion.backdropEndPos !== DEFAULTS.motion.backdropEndPos}
                            onReset={() => updateMotion("backdropEndPos", DEFAULTS.motion.backdropEndPos)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0 xl:sticky xl:top-16 xl:self-start">
                  <CodeBlock>{usageCode}</CodeBlock>
                </div>
              </div>
            )}
            </div>
          </Section>

          <Section id="api" title="API reference" eyebrow="Props">
            <div className="space-y-10">
              <div>
                <h3 className="mb-1 text-sm font-semibold">AuthDrawer props</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Top-level component props. All fields are optional.
                </p>
                <PropTable props={AUTH_DRAWER_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold">AuthConfig shape</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Passed to <code className="font-mono text-[0.7rem]">config</code>. Groups UI
                  controls, activation triggers, and auth handlers.
                </p>
                <PropTable props={CONFIG_PROPS} />
              </div>

              <div id="api-auth" className="scroll-mt-24">
                <h3 className="mb-1 text-sm font-semibold">ui.auth — AuthConfigGroup</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls the form surface: which OAuth providers appear, which flows are enabled,
                  and initial UI state.
                </p>
                <PropTable props={AUTH_CONFIG_GROUP_PROPS} />
              </div>

              <div id="api-visual" className="scroll-mt-24">
                <h3 className="mb-1 text-sm font-semibold">ui.visual — backdrop</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Static visual properties for the backdrop overlay. For animated backdrop values
                  that move with the open/close transition, see{" "}
                  <code className="font-mono text-[0.7rem]">ui.motion</code>.
                </p>
                <PropTable props={VISUAL_PROPS} />
              </div>

              <div id="api-motion" className="scroll-mt-24">
                <h3 className="mb-1 text-sm font-semibold">ui.motion — layout &amp; display</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls how the surface is sized, positioned, and laid out on desktop viewports.
                </p>
                <PropTable props={MOTION_LAYOUT_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold">
                  ui.motion — entry &amp; exit animation
                </h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Tune the open and close transitions independently. Easing values accept any CSS
                  easing string or a cubic-bezier array literal like{" "}
                  <code className="font-mono text-[0.7rem]">[0.23, 1, 0.32, 1]</code>.
                </p>
                <PropTable props={MOTION_ENTRY_EXIT_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold">ui.motion — drag physics</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Spring and threshold values that govern mobile drag-to-dismiss behavior.
                </p>
                <PropTable props={MOTION_DRAG_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold">ui.motion — animated backdrop</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Backdrop properties driven by the motion layer. These animate in sync with the
                  open/close spring rather than being applied statically.
                </p>
                <PropTable props={MOTION_BACKDROP_PROPS} />
              </div>
            </div>
          </Section>
        </main>
      </div>

      {isConfigInView ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="fixed bottom-4 right-4 z-50 inline-flex h-9 items-center gap-2 border border-foreground/10 bg-background/90 px-3 text-xs font-semibold text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground backdrop-blur-sm"
        >
          <kbd className="font-mono border border-foreground/15 bg-foreground/8 px-1 py-px text-[0.55rem] text-foreground/50">
            L Shift
          </kbd>
          {isOpen ? "Close" : "Open"} drawer
        </button>
      ) : null}

      <AuthDrawer config={config} hideTrigger open={isOpen} onOpenChange={setOpen} />
    </div>
  );
}
