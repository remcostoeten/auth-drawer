import {
  Check,
  ChevronDown,
  ChevronUp,
  Github,
  LockKeyhole,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { CodeBlock } from "../code/server-code-block";
import {
  TabbedCodeBlock,
  createPackageInstallVariants,
} from "../code/tabbed-code-block";
import { DefaultConfigPopover } from "./default-config-popover";
import {
  AuthDrawer,
  DEFAULT_CONFIG,
  DEFAULT_COPY,
  type AuthBackdropConfig,
  type AuthConfig,
  type AuthConfigGroup,
  type AuthCopyConfig,
  type DrawerMode,
  type MotionSettings,
  type OAuthProvider,
  type ResolvedAuthCopyConfig,
} from "@/components/auth/auth-drawer";

type PropDef = {
  name: string;
  type: string;
  default?: string;
  description: string;
  defaultPreview?: "default-config";
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
  ["Defaults", "showcase"],
  ["Configurator", "configurator"],
  ["API", "api"],
  ["ui.auth", "api-auth"],
  ["ui.copy", "api-copy"],
  ["ui.visual", "api-visual"],
  ["ui.motion", "api-motion"],
] as const;

const NAV_SECTION_IDS = NAV_ITEMS.map(([, id]) => id);
type NavSectionId = (typeof NAV_SECTION_IDS)[number];

/** Matches section scroll-mt (96px) and fixed app header (36px). */
const DOCS_SCROLL_SPY_OFFSET_PX = 120;

const AUTH_DRAWER_PROPS: PropDef[] = [
  {
    name: "config",
    type: "AuthConfig",
    default: "DEFAULT_CONFIG",
    defaultPreview: "default-config",
    description: "UI, trigger, motion, and backend handler configuration.",
  },
  {
    name: "hideTrigger",
    type: "boolean",
    default: "false",
    description:
      "Hide the built-in trigger when your app owns the entry point.",
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
    description:
      "Providers, register mode, remember-me, and forgot-password controls.",
  },
  {
    name: "ui.copy",
    type: "AuthCopyConfig",
    description:
      "User-facing labels, headings, button text, validation messages, and error copy.",
  },
  {
    name: "ui.footer",
    type: "ReactNode",
    description:
      "Custom footer below the form. Overrides copy.footer segments when set.",
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
    description:
      "Desktop width, position, entry timing, drag physics, and form layout.",
  },
  {
    name: "triggers",
    type: "AuthTriggerConfig",
    description:
      "Page-load, click, state, scroll, idle, or custom activation rules.",
  },
  {
    name: "onCredential",
    type: "(input) => Promise<void>",
    description:
      "Receives login/register credential submissions after validation passes.",
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
  {
    name: "showFooter",
    type: "boolean",
    default: "true",
    description:
      "Show the footer below the form. Pass ui.footer for a fully custom React footer.",
  },
];

const COPY_CONFIG_PROPS: PropDef[] = [
  {
    name: "login.title",
    type: "string",
    default: '"Welcome back"',
    description: "Heading shown on the login form.",
  },
  {
    name: "login.subtitle",
    type: "string",
    default:
      '"Sign in to sync your notes anywhere while keeping local-first saves intact"',
    description: "Supporting copy below the login heading.",
  },
  {
    name: "login.submit",
    type: "string",
    default: '"Sign in"',
    description: "Primary submit button label on login.",
  },
  {
    name: "login.switchPrompt",
    type: "string",
    default: `"Don't have an account?"`,
    description: "Prompt before the register switch action on login.",
  },
  {
    name: "login.switchAction",
    type: "string",
    default: '"Register"',
    description: "Register switch action label on login.",
  },
  {
    name: "register.title",
    type: "string",
    default: '"Create your account"',
    description: "Heading shown on the register form.",
  },
  {
    name: "register.subtitle",
    type: "string",
    default:
      '"Create an account to back up and sync your notes across devices"',
    description: "Supporting copy below the register heading.",
  },
  {
    name: "register.submit",
    type: "string",
    default: '"Create account"',
    description: "Primary submit button label on register.",
  },
  {
    name: "register.switchPrompt",
    type: "string",
    default: '"Already have an account?"',
    description: "Prompt before the login switch action on register.",
  },
  {
    name: "register.switchAction",
    type: "string",
    default: '"Sign in"',
    description: "Login switch action label on register.",
  },
  {
    name: "fields.email.label",
    type: "string",
    default: '"Email"',
    description: "Accessible label for the email field.",
  },
  {
    name: "fields.email.placeholder",
    type: "string",
    default: '"Email"',
    description: "Placeholder for the email field.",
  },
  {
    name: "fields.password.label",
    type: "string",
    default: '"Password"',
    description: "Accessible label for the password field.",
  },
  {
    name: "fields.password.placeholder",
    type: "string",
    default: '"Password"',
    description: "Placeholder for the password field.",
  },
  {
    name: "fields.confirmPassword.label",
    type: "string",
    default: '"Confirm password"',
    description: "Accessible label for the confirm-password field.",
  },
  {
    name: "fields.confirmPassword.placeholder",
    type: "string",
    default: '"Confirm password"',
    description: "Placeholder for the confirm-password field.",
  },
  {
    name: "passwordToggle.show",
    type: "string",
    default: '"Show password"',
    description: "Aria label when the password is hidden.",
  },
  {
    name: "passwordToggle.hide",
    type: "string",
    default: '"Hide password"',
    description: "Aria label when the password is visible.",
  },
  {
    name: "oauth.divider",
    type: "string",
    default: '"Or continue with email"',
    description: "Separator copy between OAuth buttons and the email form.",
  },
  {
    name: "oauth.continueWith",
    type: "string",
    default: '"Continue with {{provider}}"',
    description:
      "OAuth button label template. Use {{provider}} for the provider name.",
  },
  {
    name: "oauth.providers.github",
    type: "string",
    default: '"GitHub"',
    description: "Display name used for GitHub in OAuth labels.",
  },
  {
    name: "oauth.providers.google",
    type: "string",
    default: '"Google"',
    description: "Display name used for Google in OAuth labels.",
  },
  {
    name: "forgotPassword.label",
    type: "string",
    default: '"Forgot password?"',
    description: "Forgot-password action label.",
  },
  {
    name: "forgotPassword.loading",
    type: "string",
    default: '"Sending..."',
    description: "Forgot-password action label while the request is in flight.",
  },
  {
    name: "forgotPassword.successNotice",
    type: "string",
    default: '"If an account exists, password reset instructions were sent."',
    description: "Success notice shown after a forgot-password request.",
  },
  {
    name: "rememberMe.label",
    type: "string",
    default: '"Remember me"',
    description: "Remember-me checkbox label.",
  },
  {
    name: "footer.segments",
    type: "AuthFooterSegment[]",
    default: "DEFAULT_LEGAL_FOOTER_SEGMENTS",
    description:
      "Footer as text and link segments. The default is a legal terms/privacy example — swap segments or use ui.footer for full control.",
  },
  {
    name: "trigger.title",
    type: "string",
    default: '"Account"',
    description: "Primary label on the built-in trigger button.",
  },
  {
    name: "trigger.open",
    type: "string",
    default: '"Open"',
    description: "Secondary label when the built-in trigger is closed.",
  },
  {
    name: "trigger.close",
    type: "string",
    default: '"Close"',
    description: "Secondary label when the built-in trigger is open.",
  },
  {
    name: "close.ariaLabel",
    type: "string",
    default: '"Close sign in dialog"',
    description: "Accessible label for the drawer close button.",
  },
  {
    name: "validation.emailRequired",
    type: "string",
    default: '"Enter your email address."',
    description: "Client validation message when email is empty.",
  },
  {
    name: "validation.passwordRequired",
    type: "string",
    default: '"Enter your password."',
    description: "Client validation message when password is empty.",
  },
  {
    name: "validation.confirmRequired",
    type: "string",
    default: '"Confirm your password."',
    description: "Client validation message when confirm password is empty.",
  },
  {
    name: "validation.passwordsMatch",
    type: "string",
    default: '"Passwords match."',
    description: "Live register feedback when passwords match.",
  },
  {
    name: "validation.passwordsMismatch",
    type: "string",
    default: '"Passwords do not match."',
    description: "Live register feedback when passwords differ.",
  },
  {
    name: "errors.*",
    type: "Partial<Record<AuthErrorCode, string>>",
    description:
      "Override normalized auth error messages by error code when using the default normalizeError handler.",
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
    description:
      "Fraction of drawer height that must be dragged downward to trigger a close snap.",
  },
  {
    name: "velocityThreshold",
    type: "number",
    default: "500",
    description:
      "Pointer velocity (px/s) that triggers a close snap regardless of drag distance.",
  },
  {
    name: "snapStiffness",
    type: "number",
    default: "850",
    description:
      "Spring stiffness for the snap-back animation. Higher = snappier.",
  },
  {
    name: "snapDamping",
    type: "number",
    default: "14",
    description:
      "Spring damping for the snap-back animation. Higher = less oscillation.",
  },
  {
    name: "snapMass",
    type: "number",
    default: "0.8",
    description:
      "Simulated mass for the snap spring. Affects how much momentum carries through.",
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
    description:
      "Initial scale of the surface at the start of the open animation.",
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
    description:
      "Easing for the open animation — CSS easing string or cubic-bezier array literal.",
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
    description:
      "Final scale of the surface at the end of the close animation.",
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
    <section id={id} className="scroll-mt-24 py-4 first:pt-0">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/10 pb-3">
        <div>
          {eyebrow ? (
            <p className="docs-eyebrow text-[0.68rem] font-normal uppercase tracking-[0.16em] text-foreground/38">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl leading-[1.05] text-foreground">{title}</h2>
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
            <th className="hidden px-3 py-2 font-semibold sm:table-cell">
              Default
            </th>
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
              <td className="hidden px-3 py-2 font-mono text-[0.68rem] sm:table-cell">
                {prop.default ? (
                  prop.defaultPreview === "default-config" ? (
                    <DefaultConfigPopover label={prop.default} />
                  ) : (
                    <span className="text-foreground/42">{prop.default}</span>
                  )
                ) : (
                  <span className="text-foreground/42">-</span>
                )}
              </td>
              <td className="px-3 py-2 text-foreground/66">
                {prop.description}
              </td>
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

function isStockConfiguratorState({
  mode,
  auth,
  copy,
  backdrop,
  motion,
}: {
  mode: DrawerMode;
  auth: AuthConfigGroup;
  copy: ResolvedAuthCopyConfig;
  backdrop: ReturnType<typeof initBackdrop>;
  motion: MotionSettings;
}) {
  if (mode !== DEFAULTS.presentation.variant) return false;
  if (buildCopyConfig(copy)) return false;

  if (
    !arraysEqual(auth.providers ?? DEFAULTS.auth.providers, DEFAULTS.auth.providers) ||
    (auth.oauthLayout ?? DEFAULTS.auth.oauthLayout) !== DEFAULTS.auth.oauthLayout ||
    (auth.allowRegister ?? DEFAULTS.auth.allowRegister) !== DEFAULTS.auth.allowRegister ||
    (auth.showRememberMe ?? DEFAULTS.auth.showRememberMe) !== DEFAULTS.auth.showRememberMe ||
    (auth.initialMode ?? DEFAULTS.auth.initialMode) !== DEFAULTS.auth.initialMode ||
    (auth.showForgotPassword ?? DEFAULTS.auth.showForgotPassword) !==
      DEFAULTS.auth.showForgotPassword ||
    (auth.showLivePasswordMatch ?? DEFAULTS.auth.showLivePasswordMatch) !==
      DEFAULTS.auth.showLivePasswordMatch ||
    (auth.showFooter ?? DEFAULTS.auth.showFooter) !== DEFAULTS.auth.showFooter
  ) {
    return false;
  }

  const defaultBackdrop = initBackdrop();
  if (
    backdrop.color !== defaultBackdrop.color ||
    backdrop.opacity !== defaultBackdrop.opacity ||
    backdrop.blur !== defaultBackdrop.blur ||
    backdrop.gradient.angle !== defaultBackdrop.gradient.angle ||
    backdrop.gradient.from !== defaultBackdrop.gradient.from ||
    backdrop.gradient.to !== defaultBackdrop.gradient.to ||
    backdrop.gradient.fromPos !== defaultBackdrop.gradient.fromPos ||
    backdrop.gradient.toPos !== defaultBackdrop.gradient.toPos
  ) {
    return false;
  }

  const defaultMotion = initMotion();
  return (Object.keys(defaultMotion) as (keyof MotionSettings)[]).every(
    (key) => motion[key] === defaultMotion[key],
  );
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

function SelectField<T extends string>({
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
function SliderField({
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

type NumberFieldProps = {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
  isEdited?: boolean;
  onReset?: () => void;
};
function NumberField({
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

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isEdited?: boolean;
  onReset?: () => void;
};
function TextField({
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

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isEdited?: boolean;
  onReset?: () => void;
};
function ColorField({
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

const DEFAULT_USAGE_CODE = `import { AuthDrawer } from "@remcostoeten/auth-drawer";

export function App() {
  return (
  // todo shape to api
  <AuthDrawer
      adapter={someReffToYourAuthProvider} // This is explained later on how to couple with your authentication service
      config={} // the entire modal ui, behaviour and settings can be configured in this object, when left out you'll get the default UI as shown above 'Open default drawer'
    />
  );
}`;

function initCopy(): ResolvedAuthCopyConfig {
  return structuredClone(DEFAULT_COPY);
}

function buildCopyConfig(
  copy: ResolvedAuthCopyConfig,
): AuthCopyConfig | undefined {
  const defaults = DEFAULT_COPY;
  const result: AuthCopyConfig = {};

  const login = Object.fromEntries(
    Object.entries(copy.login).filter(
      ([key, value]) =>
        value !== defaults.login[key as keyof typeof defaults.login],
    ),
  );
  if (Object.keys(login).length > 0) result.login = login;

  const register = Object.fromEntries(
    Object.entries(copy.register).filter(
      ([key, value]) =>
        value !== defaults.register[key as keyof typeof defaults.register],
    ),
  );
  if (Object.keys(register).length > 0) result.register = register;

  const fields: NonNullable<AuthCopyConfig["fields"]> = {};
  (["email", "password", "confirmPassword"] as const).forEach((field) => {
    const next = Object.fromEntries(
      Object.entries(copy.fields[field]).filter(
        ([key, value]) =>
          value !==
          defaults.fields[field][
            key as keyof (typeof defaults.fields)["email"]
          ],
      ),
    );
    if (Object.keys(next).length > 0) fields[field] = next;
  });
  if (Object.keys(fields).length > 0) result.fields = fields;

  const passwordToggle = Object.fromEntries(
    Object.entries(copy.passwordToggle).filter(
      ([key, value]) =>
        value !==
        defaults.passwordToggle[key as keyof typeof defaults.passwordToggle],
    ),
  );
  if (Object.keys(passwordToggle).length > 0)
    result.passwordToggle = passwordToggle;

  const oauthProviders = Object.fromEntries(
    Object.entries(copy.oauth.providers).filter(
      ([key, value]) =>
        value !== defaults.oauth.providers[key as OAuthProvider],
    ),
  );
  const oauth: NonNullable<AuthCopyConfig["oauth"]> = {};
  if (copy.oauth.divider !== defaults.oauth.divider)
    oauth.divider = copy.oauth.divider;
  if (copy.oauth.continueWith !== defaults.oauth.continueWith) {
    oauth.continueWith = copy.oauth.continueWith;
  }
  if (Object.keys(oauthProviders).length > 0) oauth.providers = oauthProviders;
  if (Object.keys(oauth).length > 0) result.oauth = oauth;

  const forgotPassword = Object.fromEntries(
    Object.entries(copy.forgotPassword).filter(
      ([key, value]) =>
        value !==
        defaults.forgotPassword[key as keyof typeof defaults.forgotPassword],
    ),
  );
  if (Object.keys(forgotPassword).length > 0)
    result.forgotPassword = forgotPassword;

  if (copy.rememberMe.label !== defaults.rememberMe.label) {
    result.rememberMe = { label: copy.rememberMe.label };
  }

  if (
    JSON.stringify(copy.footer.segments) !==
    JSON.stringify(defaults.footer.segments)
  ) {
    result.footer = { segments: copy.footer.segments };
  }

  const trigger = Object.fromEntries(
    Object.entries(copy.trigger).filter(
      ([key, value]) =>
        value !== defaults.trigger[key as keyof typeof defaults.trigger],
    ),
  );
  if (Object.keys(trigger).length > 0) result.trigger = trigger;

  if (copy.close.ariaLabel !== defaults.close.ariaLabel) {
    result.close = { ariaLabel: copy.close.ariaLabel };
  }

  const validation = Object.fromEntries(
    Object.entries(copy.validation).filter(
      ([key, value]) =>
        value !== defaults.validation[key as keyof typeof defaults.validation],
    ),
  );
  if (Object.keys(validation).length > 0) result.validation = validation;

  return Object.keys(result).length > 0 ? result : undefined;
}

function formatCopyBlock(name: string, lines: string[]) {
  if (lines.length === 0) return null;
  return `${name}: {\n          ${lines.join(",\n          ")}\n        }`;
}

function buildCopyLines(copy: ResolvedAuthCopyConfig) {
  const defaults = DEFAULT_COPY;
  const blocks: string[] = [];

  const loginLines = Object.entries(copy.login)
    .filter(
      ([key, value]) =>
        value !== defaults.login[key as keyof typeof defaults.login],
    )
    .map(([key, value]) => `${key}: "${value}"`);
  const loginBlock = formatCopyBlock("login", loginLines);
  if (loginBlock) blocks.push(loginBlock);

  const registerLines = Object.entries(copy.register)
    .filter(
      ([key, value]) =>
        value !== defaults.register[key as keyof typeof defaults.register],
    )
    .map(([key, value]) => `${key}: "${value}"`);
  const registerBlock = formatCopyBlock("register", registerLines);
  if (registerBlock) blocks.push(registerBlock);

  const fieldBlocks = (["email", "password", "confirmPassword"] as const)
    .map((field) => {
      const lines = Object.entries(copy.fields[field])
        .filter(
          ([key, value]) =>
            value !==
            defaults.fields[field][
              key as keyof (typeof defaults.fields)["email"]
            ],
        )
        .map(([key, value]) => `${key}: "${value}"`);
      return formatCopyBlock(field, lines);
    })
    .filter(Boolean) as string[];

  if (fieldBlocks.length > 0) {
    blocks.push(
      `fields: {\n          ${fieldBlocks.join(",\n          ")}\n        }`,
    );
  }

  const rememberBlock =
    copy.rememberMe.label !== defaults.rememberMe.label
      ? `rememberMe: { label: "${copy.rememberMe.label}" }`
      : null;
  if (rememberBlock) blocks.push(rememberBlock);

  const forgotLines = Object.entries(copy.forgotPassword)
    .filter(
      ([key, value]) =>
        value !==
        defaults.forgotPassword[key as keyof typeof defaults.forgotPassword],
    )
    .map(([key, value]) => `${key}: "${value}"`);
  const forgotBlock = formatCopyBlock("forgotPassword", forgotLines);
  if (forgotBlock) blocks.push(forgotBlock);

  const oauthLines = [
    copy.oauth.divider !== defaults.oauth.divider
      ? `divider: "${copy.oauth.divider}"`
      : null,
    copy.oauth.continueWith !== defaults.oauth.continueWith
      ? `continueWith: "${copy.oauth.continueWith}"`
      : null,
  ].filter(Boolean) as string[];

  const providerLines = Object.entries(copy.oauth.providers)
    .filter(
      ([key, value]) =>
        value !== defaults.oauth.providers[key as OAuthProvider],
    )
    .map(([key, value]) => `${key}: "${value}"`);

  if (providerLines.length > 0) {
    oauthLines.push(`providers: { ${providerLines.join(", ")} }`);
  }

  const oauthBlock = formatCopyBlock("oauth", oauthLines);
  if (oauthBlock) blocks.push(oauthBlock);

  if (
    JSON.stringify(copy.footer.segments) !==
    JSON.stringify(defaults.footer.segments)
  ) {
    blocks.push(
      `footer: {\n          segments: ${JSON.stringify(copy.footer.segments, null, 2)
        .split("\n")
        .map((line, index) => (index === 0 ? line : `          ${line}`))
        .join("\n")}\n        }`,
    );
  }

  return blocks;
}

function buildConfig({
  mode,
  auth,
  copy,
  backdrop,
  motion,
}: {
  mode: DrawerMode;
  auth: AuthConfigGroup;
  copy: ResolvedAuthCopyConfig;
  backdrop: Required<AuthBackdropConfig> & {
    gradient: Required<NonNullable<AuthBackdropConfig["gradient"]>>;
  };
  motion: MotionSettings;
}): AuthConfig {
  const copyConfig = buildCopyConfig(copy);

  return {
    ui: {
      presentation: { variant: mode },
      auth,
      ...(copyConfig ? { copy: copyConfig } : {}),
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

type ConfiguratorTab = "auth" | "copy" | "visual" | "motion";

const CONFIGURATOR_TABS: ReadonlyArray<{
  id: ConfiguratorTab;
  label: string;
}> = [
  { id: "auth", label: "Auth" },
  { id: "copy", label: "Copy" },
  { id: "visual", label: "Visual" },
  { id: "motion", label: "Motion" },
];

const CONFIGURATOR_EASE = [0.23, 1, 0.32, 1] as const;
const DOCS_NAV_HEIGHT_PX = 36;
const CONFIG_CODE_STICKY_GAP_PX = 12;

type ConfiguratorToolbarProps = {
  tab: ConfiguratorTab;
  onTabChange: (tab: ConfiguratorTab) => void;
  onShowCurrent: () => void;
  onReset: () => void;
  onCollapse: () => void;
};

function ConfiguratorToolbar({
  tab,
  onTabChange,
  onShowCurrent,
  onReset,
  onCollapse,
}: ConfiguratorToolbarProps) {
  const reduceMotion = useReducedMotion();
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<ConfiguratorTab, HTMLButtonElement>());
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const updateIndicator = useCallback(() => {
    const list = tabListRef.current;
    const activeTab = tabRefs.current.get(tab);
    if (!list || !activeTab) return;

    const listRect = list.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    setIndicator({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    });
  }, [tab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [tab, updateIndicator]);

  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (!list) return;

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(list);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  function onTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (index + offset + CONFIGURATOR_TABS.length) % CONFIGURATOR_TABS.length;
    const next = CONFIGURATOR_TABS[nextIndex];
    if (!next) return;

    onTabChange(next.id);
    tabRefs.current.get(next.id)?.focus();
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onShowCurrent}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[5px] bg-foreground px-3.5 text-[0.8125rem] font-semibold text-background transition-transform active:scale-[0.98]"
        >
          <Play size={13} aria-hidden="true" />
          Preview
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset configurator"
            title="Reset"
            className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-transparent px-2.5 text-[0.72rem] font-semibold text-foreground/52 transition-[color,transform,border-color] duration-200 hover:border-foreground/10 hover:text-foreground active:scale-[0.98]"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse configurator"
            title="Collapse"
            className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border border-transparent px-2.5 text-[0.72rem] font-semibold text-foreground/52 transition-[color,transform,border-color] duration-200 hover:border-foreground/10 hover:text-foreground active:scale-[0.98]"
          >
            <ChevronUp size={13} aria-hidden="true" />
            Collapse
          </button>
        </div>
      </div>

      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Configurator sections"
        className="relative grid grid-cols-4 rounded-[6px] border border-foreground/10 bg-foreground/[0.03] p-0.5"
      >
        {indicator ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-0.5 bottom-0.5 z-0 rounded-[4px] bg-foreground"
            animate={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
            }}
            initial={false}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: CONFIGURATOR_EASE }
            }
          />
        ) : null}

        {CONFIGURATOR_TABS.map((item, index) => {
          const isActive = tab === item.id;

          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) tabRefs.current.set(item.id, node);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={
                isActive
                  ? "relative z-10 min-w-0 truncate rounded-[4px] px-1.5 py-1.5 text-center text-[0.68rem] font-semibold text-background transition-[color,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  : "relative z-10 min-w-0 truncate rounded-[4px] px-1.5 py-1.5 text-center text-[0.68rem] font-semibold text-foreground/42 transition-[color,transform] duration-200 ease-out hover:text-foreground/68 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useDocsActiveSection(sectionIds: readonly NavSectionId[]) {
  const [activeId, setActiveId] = useState<NavSectionId>(sectionIds[0]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let next = sectionIds[0];
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= DOCS_SCROLL_SPY_OFFSET_PX) {
            next = id;
          }
        }
        setActiveId((prev) => (prev === next ? prev : next));
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionIds]);

  return activeId;
}

function DocsSidebarNav() {
  const reduceMotion = useReducedMotion();
  const activeId = useDocsActiveSection(NAV_SECTION_IDS);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef(new Map<NavSectionId, HTMLAnchorElement>());
  const [indicator, setIndicator] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const link = linkRefs.current.get(activeId);
    if (!nav || !link) return;

    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();

    setIndicator({
      top: linkRect.top - navRect.top,
      height: linkRect.height,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [activeId, updateIndicator]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(nav);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <nav ref={navRef} className="relative space-y-1">
      {indicator ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 left-0 z-0 rounded-[5px] bg-foreground/[0.045]"
          animate={{
            top: indicator.top,
            height: indicator.height,
          }}
          initial={false}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.22, ease: CONFIGURATOR_EASE }
          }
        />
      ) : null}

      {NAV_ITEMS.map(([label, href]) => {
        const isSub = href.startsWith("api-");
        const isActive = activeId === href;

        return (
          <a
            key={`${label}-${href}`}
            ref={(node) => {
              if (node) linkRefs.current.set(href, node);
              else linkRefs.current.delete(href);
            }}
            href={`#${href}`}
            aria-current={isActive ? "location" : undefined}
            className={
              isSub
                ? isActive
                  ? "relative z-10 block rounded-[5px] py-1.5 pl-5 pr-2.5 text-[0.7rem] font-medium text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  : "relative z-10 block rounded-[5px] py-1.5 pl-5 pr-2.5 text-[0.7rem] font-medium text-foreground/36 transition-colors duration-200 hover:bg-foreground/[0.03] hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                : isActive
                  ? "relative z-10 block rounded-[5px] px-2.5 py-2 text-xs font-semibold text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                  : "relative z-10 block rounded-[5px] px-2.5 py-2 text-xs font-semibold text-foreground/48 transition-colors duration-200 hover:bg-foreground/[0.045] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
            }
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}

export function DocsPage() {
  const [isOpen, setOpen] = useState(false);
  const [isConfiguratorExpanded, setConfiguratorExpanded] = useState(false);
  const [configuratorTab, setConfiguratorTab] = useState<
    "auth" | "copy" | "visual" | "motion"
  >("auth");
  const [mode, setMode] = useState<DrawerMode>("drawer");
  const [auth, setAuth] = useState<AuthConfigGroup>({ ...DEFAULTS.auth });
  const [copy, setCopy] = useState<ResolvedAuthCopyConfig>(initCopy);
  const [backdrop, setBackdrop] = useState(initBackdrop);
  const [motion, setMotion] = useState(initMotion);
  const [isConfigInView, setConfigInView] = useState(false);
  const [isToolbarDocked, setToolbarDocked] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(88);
  const configSectionRef = useRef<HTMLDivElement>(null);
  const configToolbarSentinelRef = useRef<HTMLDivElement>(null);
  const configToolbarRef = useRef<HTMLDivElement>(null);

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
    if (!isConfiguratorExpanded) {
      setToolbarDocked(false);
      return;
    }

    const sentinel = configToolbarSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setToolbarDocked(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-36px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isConfiguratorExpanded]);

  useLayoutEffect(() => {
    if (!isConfiguratorExpanded) return;

    const toolbar = configToolbarRef.current;
    if (!toolbar) return;

    const updateHeight = () => {
      setToolbarHeight(toolbar.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [isConfiguratorExpanded, isToolbarDocked]);

  const codeStickyTopPx =
    DOCS_NAV_HEIGHT_PX + toolbarHeight + CONFIG_CODE_STICKY_GAP_PX;

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
    setCopy(initCopy());
    setBackdrop(initBackdrop());
    setMotion(initMotion());
  }

  function updateAuth<K extends keyof AuthConfigGroup>(
    key: K,
    value: AuthConfigGroup[K],
  ) {
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

  function updateBackdrop<K extends keyof typeof backdrop>(
    key: K,
    value: (typeof backdrop)[K],
  ) {
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

  function updateMotion<K extends keyof MotionSettings>(
    key: K,
    value: MotionSettings[K],
  ) {
    setMotion((prev) => ({ ...prev, [key]: value }));
  }

  const config = useMemo(
    () => buildConfig({ mode, auth, copy, backdrop, motion }),
    [mode, auth, copy, backdrop, motion],
  );

  const isStockConfig = useMemo(
    () =>
      isStockConfiguratorState({
        mode,
        auth,
        copy,
        backdrop,
        motion,
      }),
    [mode, auth, copy, backdrop, motion],
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
    if (motion.entryY !== DEFAULTS.motion.entryY)
      motionLines.push(`entryY: ${motion.entryY}`);
    if (motion.exitY !== DEFAULTS.motion.exitY)
      motionLines.push(`exitY: ${motion.exitY}`);
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
    if (auth.showFooter !== DEFAULTS.auth.showFooter)
      authLines.push(`showFooter: ${auth.showFooter}`);

    const copyLines = buildCopyLines(copy);
    const copyBlock =
      copyLines.length > 0
        ? `copy: {\n        ${copyLines.join(",\n        ")}\n      },`
        : null;

    return `<AuthDrawer
  config={{
    ui: {
      presentation: { variant: "${mode}" },
      auth: {
        ${authLines.join(",\n        ")}
      },${copyBlock ? `\n      ${copyBlock}` : ""}
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
  }, [mode, auth, copy, backdrop, motion]);

  return (
    <div className="docs-root min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-16">
            <a
              href="#start"
              className="font-display mb-7 flex items-center gap-2 text-sm font-normal tracking-[-0.01em]"
            >
              <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-foreground text-background">
                <LockKeyhole size={14} aria-hidden="true" />
              </span>
              Auth Drawer
            </a>
            <DocsSidebarNav />
          </div>
        </aside>

        <main className="min-w-0">
          <Section id="start" title="Start" eyebrow="Introduction">
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              <strong className="text-foreground">Auth Drawer</strong> is a
              configurable, animated authentication surface for React. It ships
              as a mobile-optimised bottom-sheet drawer that can also render as
              a centred modal on desktop, with a single, type-safe config object
              controlling every visual, motion, behavioural, and copy detail.
            </p>
            <p className="mb-6 max-w-2xl text-sm leading-6 text-foreground/58">
              Bring your own auth backend — Supabase, Better Auth, Lucia, custom
              sessions, or anything else. Pass async handlers via{" "}
              <code className="font-mono text-[0.72rem]">onCredential</code> and{" "}
              <code className="font-mono text-[0.72rem]">onOAuth</code>.
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.98]"
              >
                <Play size={14} aria-hidden="true" />
                Open default drawer
              </button>
              <a
                href="#configurator"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-4 text-sm font-semibold text-foreground/68 transition-colors hover:border-foreground/22 hover:text-foreground"
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Customize
              </a>
            </div>
          </Section>

          <Section id="installation" title="Install" eyebrow="Setup">
            <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground/58">
              Install and render — styles ship with the component import. No
              Tailwind setup, no separate CSS file.
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/72">
                  1. Install
                </p>
                <TabbedCodeBlock
                  variants={createPackageInstallVariants(
                    "@remcostoeten/auth-drawer",
                  )}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/72">
                  2. Render
                </p>
                <CodeBlock>{DEFAULT_USAGE_CODE}</CodeBlock>
              </div>
            </div>
          </Section>

          <Section id="showcase" title="Defaults" eyebrow="Out of the box">
            <p className="max-w-2xl text-sm leading-6 text-foreground/58">
              <code className="font-mono text-[0.72rem]">DEFAULT_CONFIG</code>{" "}
              includes OAuth buttons, login and register tabs, remember-me,
              forgot-password, backdrop, drag behaviour, and trigger hooks. The
              same config shape covers drawer vs modal presentation, desktop
              width, position, and scroll or idle open triggers — customize only
              what you need in the{" "}
              <a
                href="#configurator"
                className="text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
              >
                configurator
              </a>
              .
            </p>
          </Section>

          <Section
            id="configurator"
            title="Configurator"
            eyebrow="Opt-in controls"
          >
            <div ref={configSectionRef}>
              {!isConfiguratorExpanded ? (
                <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.55fr)] lg:items-center">
                    <div>
                      <div className="mb-3 inline-flex h-8 items-center gap-2 rounded-[5px] border border-foreground/10 bg-background px-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-foreground/46">
                        <SlidersHorizontal size={13} aria-hidden="true" />
                        Advanced
                      </div>
                      <h3 className="text-base text-foreground">
                        Customize when the defaults are not enough
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/58">
                        The{" "}
                        <DefaultConfigPopover
                          label="full configurator"
                          triggerClassName="inline cursor-help border-b border-dotted border-foreground/28 text-foreground/58 transition-[color,border-color] duration-150 ease-out hover:border-foreground/45 hover:text-foreground/78"
                        />{" "}
                        is still here, but it stays collapsed until someone
                        wants to tune providers, visual treatment, motion, drag
                        physics, and generated config output.
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
                <div
                  style={
                    {
                      "--config-toolbar-h": `${toolbarHeight}px`,
                    } as CSSProperties
                  }
                >
                  <div
                    ref={configToolbarSentinelRef}
                    className="pointer-events-none h-px w-full"
                    aria-hidden="true"
                  />
                  <div
                    ref={configToolbarRef}
                    className={
                      isToolbarDocked
                        ? "sticky top-9 z-30 -mx-4 mb-6 border-b border-foreground/10 bg-background/95 px-4 py-2.5 shadow-[0_10px_32px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md transition-[box-shadow,background-color,border-radius,padding,margin] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                        : "sticky top-9 z-30 mb-6 rounded-[8px] border border-foreground/10 bg-background/90 p-3 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md transition-[box-shadow,background-color,border-radius,padding,margin] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    }
                  >
                    <ConfiguratorToolbar
                      tab={configuratorTab}
                      onTabChange={setConfiguratorTab}
                      onShowCurrent={() => setOpen(true)}
                      onReset={resetConfig}
                      onCollapse={() => setConfiguratorExpanded(false)}
                    />
                  </div>

                  <div className="grid gap-8 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.18fr)] xl:items-start">
                    <div className="min-w-0 space-y-3">
                    {configuratorTab === "auth" && (
                      <div className="space-y-3">
                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
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
                              onReset={() =>
                                setMode(DEFAULTS.presentation.variant)
                              }
                            />
                            <label className="block">
                              <span className="mb-2 flex items-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                                {motion.desktopWidth !==
                                DEFAULTS.motion.desktopWidth ? (
                                  <EditedDot
                                    onReset={() =>
                                      updateMotion(
                                        "desktopWidth",
                                        DEFAULTS.motion.desktopWidth,
                                      )
                                    }
                                  />
                                ) : null}
                                Width
                              </span>
                              <input
                                type="text"
                                value={motion.desktopWidth}
                                onChange={(e) =>
                                  updateMotion("desktopWidth", e.target.value)
                                }
                                className="h-10 w-full rounded-[5px] border border-foreground/10 bg-[#0f0f10] px-3 text-xs font-semibold text-foreground outline-hidden transition-colors hover:border-foreground/20 focus:border-foreground/35 focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:outline-hidden dark:bg-[#0f0f10]"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
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
                              isEdited={
                                (auth.oauthLayout ?? "column") !==
                                DEFAULTS.auth.oauthLayout
                              }
                              onReset={() =>
                                updateAuth(
                                  "oauthLayout",
                                  DEFAULTS.auth.oauthLayout,
                                )
                              }
                            />
                            <SelectField
                              label="Initial mode"
                              value={auth.initialMode ?? "login"}
                              onChange={(v) => updateAuth("initialMode", v)}
                              options={[
                                { value: "login", label: "Login" },
                                { value: "register", label: "Register" },
                              ]}
                              isEdited={
                                (auth.initialMode ?? "login") !==
                                DEFAULTS.auth.initialMode
                              }
                              onReset={() =>
                                updateAuth(
                                  "initialMode",
                                  DEFAULTS.auth.initialMode,
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <ToggleButton
                              checked={(auth.providers ?? []).includes(
                                "github",
                              )}
                              onChange={() => cycleProvider("github")}
                              isEdited={
                                !arraysEqual(
                                  auth.providers ?? [],
                                  DEFAULTS.auth.providers,
                                )
                              }
                              onReset={() =>
                                setAuth((prev) => ({
                                  ...prev,
                                  providers: [...DEFAULTS.auth.providers],
                                }))
                              }
                            >
                              <Github size={13} aria-hidden="true" /> GitHub
                            </ToggleButton>
                            <ToggleButton
                              checked={(auth.providers ?? []).includes(
                                "google",
                              )}
                              onChange={() => cycleProvider("google")}
                              isEdited={
                                !arraysEqual(
                                  auth.providers ?? [],
                                  DEFAULTS.auth.providers,
                                )
                              }
                              onReset={() =>
                                setAuth((prev) => ({
                                  ...prev,
                                  providers: [...DEFAULTS.auth.providers],
                                }))
                              }
                            >
                              Google
                            </ToggleButton>
                            <ToggleButton
                              checked={auth.allowRegister ?? true}
                              onChange={(v) => updateAuth("allowRegister", v)}
                              isEdited={
                                (auth.allowRegister ?? true) !==
                                DEFAULTS.auth.allowRegister
                              }
                              onReset={() =>
                                updateAuth(
                                  "allowRegister",
                                  DEFAULTS.auth.allowRegister,
                                )
                              }
                            >
                              Register
                            </ToggleButton>
                            <ToggleButton
                              checked={auth.showRememberMe ?? true}
                              onChange={(v) => updateAuth("showRememberMe", v)}
                              isEdited={
                                (auth.showRememberMe ?? true) !==
                                DEFAULTS.auth.showRememberMe
                              }
                              onReset={() =>
                                updateAuth(
                                  "showRememberMe",
                                  DEFAULTS.auth.showRememberMe,
                                )
                              }
                            >
                              Remember
                            </ToggleButton>
                            <ToggleButton
                              checked={auth.showForgotPassword ?? true}
                              onChange={(v) =>
                                updateAuth("showForgotPassword", v)
                              }
                              isEdited={
                                (auth.showForgotPassword ?? true) !==
                                DEFAULTS.auth.showForgotPassword
                              }
                              onReset={() =>
                                updateAuth(
                                  "showForgotPassword",
                                  DEFAULTS.auth.showForgotPassword,
                                )
                              }
                            >
                              Forgot pwd
                            </ToggleButton>
                            <ToggleButton
                              checked={auth.showFooter ?? true}
                              onChange={(v) => updateAuth("showFooter", v)}
                              isEdited={
                                (auth.showFooter ?? true) !==
                                DEFAULTS.auth.showFooter
                              }
                              onReset={() =>
                                updateAuth(
                                  "showFooter",
                                  DEFAULTS.auth.showFooter,
                                )
                              }
                            >
                              Footer
                            </ToggleButton>
                            <ToggleButton
                              checked={auth.showLivePasswordMatch ?? true}
                              onChange={(v) =>
                                updateAuth("showLivePasswordMatch", v)
                              }
                              isEdited={
                                (auth.showLivePasswordMatch ?? true) !==
                                DEFAULTS.auth.showLivePasswordMatch
                              }
                              onReset={() =>
                                updateAuth(
                                  "showLivePasswordMatch",
                                  DEFAULTS.auth.showLivePasswordMatch,
                                )
                              }
                            >
                              Live match
                            </ToggleButton>
                          </div>
                        </div>
                      </div>
                    )}

                    {configuratorTab === "copy" && (
                      <div className="space-y-3">
                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                            Login
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <TextField
                              label="Title"
                              value={copy.login.title}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  login: { ...prev.login, title: value },
                                }))
                              }
                              isEdited={
                                copy.login.title !== DEFAULT_COPY.login.title
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  login: {
                                    ...prev.login,
                                    title: DEFAULT_COPY.login.title,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Submit"
                              value={copy.login.submit}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  login: { ...prev.login, submit: value },
                                }))
                              }
                              isEdited={
                                copy.login.submit !== DEFAULT_COPY.login.submit
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  login: {
                                    ...prev.login,
                                    submit: DEFAULT_COPY.login.submit,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Subtitle"
                              value={copy.login.subtitle}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  login: { ...prev.login, subtitle: value },
                                }))
                              }
                              isEdited={
                                copy.login.subtitle !==
                                DEFAULT_COPY.login.subtitle
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  login: {
                                    ...prev.login,
                                    subtitle: DEFAULT_COPY.login.subtitle,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                            Register
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <TextField
                              label="Title"
                              value={copy.register.title}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  register: { ...prev.register, title: value },
                                }))
                              }
                              isEdited={
                                copy.register.title !==
                                DEFAULT_COPY.register.title
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  register: {
                                    ...prev.register,
                                    title: DEFAULT_COPY.register.title,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Submit"
                              value={copy.register.submit}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  register: { ...prev.register, submit: value },
                                }))
                              }
                              isEdited={
                                copy.register.submit !==
                                DEFAULT_COPY.register.submit
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  register: {
                                    ...prev.register,
                                    submit: DEFAULT_COPY.register.submit,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                            Actions &amp; footer
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <TextField
                              label="Remember me"
                              value={copy.rememberMe.label}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  rememberMe: { label: value },
                                }))
                              }
                              isEdited={
                                copy.rememberMe.label !==
                                DEFAULT_COPY.rememberMe.label
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  rememberMe: {
                                    label: DEFAULT_COPY.rememberMe.label,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Forgot password"
                              value={copy.forgotPassword.label}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  forgotPassword: {
                                    ...prev.forgotPassword,
                                    label: value,
                                  },
                                }))
                              }
                              isEdited={
                                copy.forgotPassword.label !==
                                DEFAULT_COPY.forgotPassword.label
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  forgotPassword: {
                                    ...prev.forgotPassword,
                                    label: DEFAULT_COPY.forgotPassword.label,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="OAuth divider"
                              value={copy.oauth.divider}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  oauth: { ...prev.oauth, divider: value },
                                }))
                              }
                              isEdited={
                                copy.oauth.divider !==
                                DEFAULT_COPY.oauth.divider
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  oauth: {
                                    ...prev.oauth,
                                    divider: DEFAULT_COPY.oauth.divider,
                                  },
                                }))
                              }
                            />
                            <TextField
                              label="Trigger title"
                              value={copy.trigger.title}
                              onChange={(value) =>
                                setCopy((prev) => ({
                                  ...prev,
                                  trigger: { ...prev.trigger, title: value },
                                }))
                              }
                              isEdited={
                                copy.trigger.title !==
                                DEFAULT_COPY.trigger.title
                              }
                              onReset={() =>
                                setCopy((prev) => ({
                                  ...prev,
                                  trigger: {
                                    ...prev.trigger,
                                    title: DEFAULT_COPY.trigger.title,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Visual tab */}
                    {configuratorTab === "visual" && (
                      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                        <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                          ui.visual.backdrop
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                          <ColorField
                            label="Color"
                            value={backdrop.color}
                            onChange={(v) => updateBackdrop("color", v)}
                            isEdited={
                              backdrop.color !== DEFAULTS.visual.backdrop.color
                            }
                            onReset={() =>
                              updateBackdrop(
                                "color",
                                DEFAULTS.visual.backdrop.color,
                              )
                            }
                          />
                          <SliderField
                            label="Opacity"
                            value={backdrop.opacity}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) => updateBackdrop("opacity", v)}
                            isEdited={
                              backdrop.opacity !==
                              DEFAULTS.visual.backdrop.opacity
                            }
                            onReset={() =>
                              updateBackdrop(
                                "opacity",
                                DEFAULTS.visual.backdrop.opacity,
                              )
                            }
                          />
                          <SliderField
                            label="Blur (px)"
                            value={backdrop.blur}
                            min={0}
                            max={24}
                            step={1}
                            onChange={(v) => updateBackdrop("blur", v)}
                            isEdited={
                              backdrop.blur !== DEFAULTS.visual.backdrop.blur
                            }
                            onReset={() =>
                              updateBackdrop(
                                "blur",
                                DEFAULTS.visual.backdrop.blur,
                              )
                            }
                          />
                          <SliderField
                            label="Gradient angle"
                            value={backdrop.gradient.angle}
                            min={0}
                            max={360}
                            step={5}
                            onChange={(v) => updateGradient("angle", v)}
                            isEdited={
                              backdrop.gradient.angle !==
                              DEFAULTS.visual.backdrop.gradient.angle
                            }
                            onReset={() =>
                              updateGradient(
                                "angle",
                                DEFAULTS.visual.backdrop.gradient.angle,
                              )
                            }
                          />
                          <ColorField
                            label="Gradient from"
                            value={backdrop.gradient.from}
                            onChange={(v) => updateGradient("from", v)}
                            isEdited={
                              backdrop.gradient.from !==
                              DEFAULTS.visual.backdrop.gradient.from
                            }
                            onReset={() =>
                              updateGradient(
                                "from",
                                DEFAULTS.visual.backdrop.gradient.from,
                              )
                            }
                          />
                          <ColorField
                            label="Gradient to"
                            value={backdrop.gradient.to}
                            onChange={(v) => updateGradient("to", v)}
                            isEdited={
                              backdrop.gradient.to !==
                              DEFAULTS.visual.backdrop.gradient.to
                            }
                            onReset={() =>
                              updateGradient(
                                "to",
                                DEFAULTS.visual.backdrop.gradient.to,
                              )
                            }
                          />
                          <SliderField
                            label="From pos %"
                            value={backdrop.gradient.fromPos}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(v) => updateGradient("fromPos", v)}
                            isEdited={
                              backdrop.gradient.fromPos !==
                              DEFAULTS.visual.backdrop.gradient.fromPos
                            }
                            onReset={() =>
                              updateGradient(
                                "fromPos",
                                DEFAULTS.visual.backdrop.gradient.fromPos,
                              )
                            }
                          />
                          <SliderField
                            label="To pos %"
                            value={backdrop.gradient.toPos}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(v) => updateGradient("toPos", v)}
                            isEdited={
                              backdrop.gradient.toPos !==
                              DEFAULTS.visual.backdrop.gradient.toPos
                            }
                            onReset={() =>
                              updateGradient(
                                "toPos",
                                DEFAULTS.visual.backdrop.gradient.toPos,
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Motion tab */}
                    {configuratorTab === "motion" && (
                      <div className="space-y-3">
                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
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
                              isEdited={
                                motion.entryDuration !==
                                DEFAULTS.motion.entryDuration
                              }
                              onReset={() =>
                                updateMotion(
                                  "entryDuration",
                                  DEFAULTS.motion.entryDuration,
                                )
                              }
                            />
                            <SliderField
                              label="Entry delay"
                              value={motion.entryDelay}
                              min={0}
                              max={1}
                              step={0.02}
                              onChange={(v) => updateMotion("entryDelay", v)}
                              isEdited={
                                motion.entryDelay !== DEFAULTS.motion.entryDelay
                              }
                              onReset={() =>
                                updateMotion(
                                  "entryDelay",
                                  DEFAULTS.motion.entryDelay,
                                )
                              }
                            />
                            <SliderField
                              label="Entry scale"
                              value={motion.entryScale}
                              min={0.7}
                              max={1.1}
                              step={0.01}
                              onChange={(v) => updateMotion("entryScale", v)}
                              isEdited={
                                motion.entryScale !== DEFAULTS.motion.entryScale
                              }
                              onReset={() =>
                                updateMotion(
                                  "entryScale",
                                  DEFAULTS.motion.entryScale,
                                )
                              }
                            />
                            <NumberField
                              label="Entry Y (px)"
                              value={motion.entryY}
                              step={1}
                              onChange={(v) => updateMotion("entryY", v)}
                              isEdited={
                                motion.entryY !== DEFAULTS.motion.entryY
                              }
                              onReset={() =>
                                updateMotion("entryY", DEFAULTS.motion.entryY)
                              }
                            />
                            <TextField
                              label="Entry ease"
                              value={motion.entryEase}
                              onChange={(v) => updateMotion("entryEase", v)}
                              isEdited={
                                motion.entryEase !== DEFAULTS.motion.entryEase
                              }
                              onReset={() =>
                                updateMotion(
                                  "entryEase",
                                  DEFAULTS.motion.entryEase,
                                )
                              }
                            />
                            <SliderField
                              label="Exit duration"
                              value={motion.exitDuration}
                              min={0}
                              max={1.5}
                              step={0.02}
                              onChange={(v) => updateMotion("exitDuration", v)}
                              isEdited={
                                motion.exitDuration !==
                                DEFAULTS.motion.exitDuration
                              }
                              onReset={() =>
                                updateMotion(
                                  "exitDuration",
                                  DEFAULTS.motion.exitDuration,
                                )
                              }
                            />
                            <SliderField
                              label="Exit delay"
                              value={motion.exitDelay}
                              min={0}
                              max={1}
                              step={0.02}
                              onChange={(v) => updateMotion("exitDelay", v)}
                              isEdited={
                                motion.exitDelay !== DEFAULTS.motion.exitDelay
                              }
                              onReset={() =>
                                updateMotion(
                                  "exitDelay",
                                  DEFAULTS.motion.exitDelay,
                                )
                              }
                            />
                            <SliderField
                              label="Exit scale"
                              value={motion.exitScale}
                              min={0.7}
                              max={1.1}
                              step={0.01}
                              onChange={(v) => updateMotion("exitScale", v)}
                              isEdited={
                                motion.exitScale !== DEFAULTS.motion.exitScale
                              }
                              onReset={() =>
                                updateMotion(
                                  "exitScale",
                                  DEFAULTS.motion.exitScale,
                                )
                              }
                            />
                            <NumberField
                              label="Exit Y (px)"
                              value={motion.exitY}
                              step={1}
                              onChange={(v) => updateMotion("exitY", v)}
                              isEdited={motion.exitY !== DEFAULTS.motion.exitY}
                              onReset={() =>
                                updateMotion("exitY", DEFAULTS.motion.exitY)
                              }
                            />
                            <TextField
                              label="Exit ease"
                              value={motion.exitEase}
                              onChange={(v) => updateMotion("exitEase", v)}
                              isEdited={
                                motion.exitEase !== DEFAULTS.motion.exitEase
                              }
                              onReset={() =>
                                updateMotion(
                                  "exitEase",
                                  DEFAULTS.motion.exitEase,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                            Drag physics
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <SliderField
                              label="Up resistance"
                              value={motion.upwardResistance}
                              min={0}
                              max={1}
                              step={0.05}
                              onChange={(v) =>
                                updateMotion("upwardResistance", v)
                              }
                              isEdited={
                                motion.upwardResistance !==
                                DEFAULTS.motion.upwardResistance
                              }
                              onReset={() =>
                                updateMotion(
                                  "upwardResistance",
                                  DEFAULTS.motion.upwardResistance,
                                )
                              }
                            />
                            <SliderField
                              label="Down threshold"
                              value={motion.downwardThreshold}
                              min={0}
                              max={1}
                              step={0.05}
                              onChange={(v) =>
                                updateMotion("downwardThreshold", v)
                              }
                              isEdited={
                                motion.downwardThreshold !==
                                DEFAULTS.motion.downwardThreshold
                              }
                              onReset={() =>
                                updateMotion(
                                  "downwardThreshold",
                                  DEFAULTS.motion.downwardThreshold,
                                )
                              }
                            />
                            <NumberField
                              label="Velocity threshold"
                              value={motion.velocityThreshold}
                              step={50}
                              onChange={(v) =>
                                updateMotion("velocityThreshold", v)
                              }
                              isEdited={
                                motion.velocityThreshold !==
                                DEFAULTS.motion.velocityThreshold
                              }
                              onReset={() =>
                                updateMotion(
                                  "velocityThreshold",
                                  DEFAULTS.motion.velocityThreshold,
                                )
                              }
                            />
                            <NumberField
                              label="Snap stiffness"
                              value={motion.snapStiffness}
                              step={25}
                              onChange={(v) => updateMotion("snapStiffness", v)}
                              isEdited={
                                motion.snapStiffness !==
                                DEFAULTS.motion.snapStiffness
                              }
                              onReset={() =>
                                updateMotion(
                                  "snapStiffness",
                                  DEFAULTS.motion.snapStiffness,
                                )
                              }
                            />
                            <NumberField
                              label="Snap damping"
                              value={motion.snapDamping}
                              step={1}
                              onChange={(v) => updateMotion("snapDamping", v)}
                              isEdited={
                                motion.snapDamping !==
                                DEFAULTS.motion.snapDamping
                              }
                              onReset={() =>
                                updateMotion(
                                  "snapDamping",
                                  DEFAULTS.motion.snapDamping,
                                )
                              }
                            />
                            <SliderField
                              label="Snap mass"
                              value={motion.snapMass}
                              min={0.1}
                              max={2}
                              step={0.1}
                              onChange={(v) => updateMotion("snapMass", v)}
                              isEdited={
                                motion.snapMass !== DEFAULTS.motion.snapMass
                              }
                              onReset={() =>
                                updateMotion(
                                  "snapMass",
                                  DEFAULTS.motion.snapMass,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                            Form layout
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <NumberField
                              label="Padding top (px)"
                              value={motion.formPaddingTop}
                              step={8}
                              onChange={(v) =>
                                updateMotion("formPaddingTop", v)
                              }
                              isEdited={
                                motion.formPaddingTop !==
                                DEFAULTS.motion.formPaddingTop
                              }
                              onReset={() =>
                                updateMotion(
                                  "formPaddingTop",
                                  DEFAULTS.motion.formPaddingTop,
                                )
                              }
                            />
                            <NumberField
                              label="Padding bottom (px)"
                              value={motion.formPaddingBottom}
                              step={8}
                              onChange={(v) =>
                                updateMotion("formPaddingBottom", v)
                              }
                              isEdited={
                                motion.formPaddingBottom !==
                                DEFAULTS.motion.formPaddingBottom
                              }
                              onReset={() =>
                                updateMotion(
                                  "formPaddingBottom",
                                  DEFAULTS.motion.formPaddingBottom,
                                )
                              }
                            />
                            <TextField
                              label="Justify"
                              value={motion.formJustify}
                              onChange={(v) => updateMotion("formJustify", v)}
                              isEdited={
                                motion.formJustify !==
                                DEFAULTS.motion.formJustify
                              }
                              onReset={() =>
                                updateMotion(
                                  "formJustify",
                                  DEFAULTS.motion.formJustify,
                                )
                              }
                            />
                            <TextField
                              label="Align"
                              value={motion.formAlign}
                              onChange={(v) => updateMotion("formAlign", v)}
                              isEdited={
                                motion.formAlign !== DEFAULTS.motion.formAlign
                              }
                              onReset={() =>
                                updateMotion(
                                  "formAlign",
                                  DEFAULTS.motion.formAlign,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.025] p-4">
                          <h3 className="docs-label mb-3 text-[0.66rem] font-normal uppercase text-foreground/42">
                            Animated backdrop
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <SliderField
                              label="Opacity"
                              value={motion.backdropOpacity}
                              min={0}
                              max={1}
                              step={0.05}
                              onChange={(v) =>
                                updateMotion("backdropOpacity", v)
                              }
                              isEdited={
                                motion.backdropOpacity !==
                                DEFAULTS.motion.backdropOpacity
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropOpacity",
                                  DEFAULTS.motion.backdropOpacity,
                                )
                              }
                            />
                            <SliderField
                              label="Blur (px)"
                              value={motion.backdropBlur}
                              min={0}
                              max={24}
                              step={1}
                              onChange={(v) => updateMotion("backdropBlur", v)}
                              isEdited={
                                motion.backdropBlur !==
                                DEFAULTS.motion.backdropBlur
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropBlur",
                                  DEFAULTS.motion.backdropBlur,
                                )
                              }
                            />
                            <SliderField
                              label="Angle"
                              value={motion.backdropAngle}
                              min={0}
                              max={360}
                              step={5}
                              onChange={(v) => updateMotion("backdropAngle", v)}
                              isEdited={
                                motion.backdropAngle !==
                                DEFAULTS.motion.backdropAngle
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropAngle",
                                  DEFAULTS.motion.backdropAngle,
                                )
                              }
                            />
                            <ColorField
                              label="Color"
                              value={motion.backdropColor}
                              onChange={(v) => updateMotion("backdropColor", v)}
                              isEdited={
                                motion.backdropColor !==
                                DEFAULTS.motion.backdropColor
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropColor",
                                  DEFAULTS.motion.backdropColor,
                                )
                              }
                            />
                            <ColorField
                              label="Start color"
                              value={motion.backdropStartColor}
                              onChange={(v) =>
                                updateMotion("backdropStartColor", v)
                              }
                              isEdited={
                                motion.backdropStartColor !==
                                DEFAULTS.motion.backdropStartColor
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropStartColor",
                                  DEFAULTS.motion.backdropStartColor,
                                )
                              }
                            />
                            <ColorField
                              label="End color"
                              value={motion.backdropEndColor}
                              onChange={(v) =>
                                updateMotion("backdropEndColor", v)
                              }
                              isEdited={
                                motion.backdropEndColor !==
                                DEFAULTS.motion.backdropEndColor
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropEndColor",
                                  DEFAULTS.motion.backdropEndColor,
                                )
                              }
                            />
                            <SliderField
                              label="Start pos %"
                              value={motion.backdropStartPos}
                              min={0}
                              max={100}
                              step={1}
                              onChange={(v) =>
                                updateMotion("backdropStartPos", v)
                              }
                              isEdited={
                                motion.backdropStartPos !==
                                DEFAULTS.motion.backdropStartPos
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropStartPos",
                                  DEFAULTS.motion.backdropStartPos,
                                )
                              }
                            />
                            <SliderField
                              label="End pos %"
                              value={motion.backdropEndPos}
                              min={0}
                              max={100}
                              step={1}
                              onChange={(v) =>
                                updateMotion("backdropEndPos", v)
                              }
                              isEdited={
                                motion.backdropEndPos !==
                                DEFAULTS.motion.backdropEndPos
                              }
                              onReset={() =>
                                updateMotion(
                                  "backdropEndPos",
                                  DEFAULTS.motion.backdropEndPos,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="custom-scrollbar min-w-0 space-y-3 xl:sticky xl:z-20 xl:max-h-[calc(100vh-2.25rem-var(--config-toolbar-h,5.5rem)-1.5rem)] xl:self-start xl:overflow-y-auto xl:transition-[top] xl:duration-200 xl:ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{ top: `${codeStickyTopPx}px` }}
                  >
                    {isStockConfig ? (
                      <p className="text-xs leading-5 text-foreground/52">
                        Stock defaults — this is the same config{" "}
                        <code className="font-mono text-[0.68rem]">
                          DEFAULT_CONFIG
                        </code>{" "}
                        uses internally. For the stock drawer,{" "}
                        <code className="font-mono text-[0.68rem]">
                          &lt;AuthDrawer /&gt;
                        </code>{" "}
                        is enough; wire up handlers only when you integrate auth.
                      </p>
                    ) : (
                      <p className="text-xs leading-5 text-foreground/52">
                        Custom config — copy the values you changed. Unchanged
                        defaults are omitted where possible.
                      </p>
                    )}
                    <CodeBlock>{usageCode}</CodeBlock>
                  </div>
                </div>
                </div>
              )}
            </div>
          </Section>

          <Section id="api" title="API reference" eyebrow="Props">
            <div className="space-y-10">
              <div>
                <h3 className="mb-1 text-sm">AuthDrawer props</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Top-level component props. All fields are optional.
                </p>
                <PropTable props={AUTH_DRAWER_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">AuthConfig shape</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Passed to{" "}
                  <code className="font-mono text-[0.7rem]">config</code>.
                  Groups UI controls, activation triggers, and auth handlers.
                </p>
                <PropTable props={CONFIG_PROPS} />
              </div>

              <div id="api-auth" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">ui.auth — AuthConfigGroup</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls the form surface: which OAuth providers appear, which
                  flows are enabled, and initial UI state.
                </p>
                <PropTable props={AUTH_CONFIG_GROUP_PROPS} />
              </div>

              <div id="api-copy" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">ui.copy — AuthCopyConfig</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls every user-facing string in the drawer: headings,
                  field labels, button text, OAuth labels, validation messages,
                  and normalized error copy.
                </p>
                <PropTable props={COPY_CONFIG_PROPS} />
              </div>

              <div id="api-visual" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">ui.visual — backdrop</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Static visual properties for the backdrop overlay. For
                  animated backdrop values that move with the open/close
                  transition, see{" "}
                  <code className="font-mono text-[0.7rem]">ui.motion</code>.
                </p>
                <PropTable props={VISUAL_PROPS} />
              </div>

              <div id="api-motion" className="scroll-mt-24">
                <h3 className="mb-1 text-sm">
                  ui.motion — layout &amp; display
                </h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Controls how the surface is sized, positioned, and laid out on
                  desktop viewports.
                </p>
                <PropTable props={MOTION_LAYOUT_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">
                  ui.motion — entry &amp; exit animation
                </h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Tune the open and close transitions independently. Easing
                  values accept any CSS easing string or a cubic-bezier array
                  literal like{" "}
                  <code className="font-mono text-[0.7rem]">
                    [0.23, 1, 0.32, 1]
                  </code>
                  .
                </p>
                <PropTable props={MOTION_ENTRY_EXIT_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">ui.motion — drag physics</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Spring and threshold values that govern mobile drag-to-dismiss
                  behavior.
                </p>
                <PropTable props={MOTION_DRAG_PROPS} />
              </div>

              <div>
                <h3 className="mb-1 text-sm">ui.motion — animated backdrop</h3>
                <p className="mb-3 text-xs text-foreground/50">
                  Backdrop properties driven by the motion layer. These animate
                  in sync with the open/close spring rather than being applied
                  statically.
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

      <AuthDrawer
        config={config}
        hideTrigger
        open={isOpen}
        onOpenChange={setOpen}
      />
    </div>
  );
}
