import type { ComponentType, ReactNode } from "react";
import type { AuthUiError } from "./auth-errors";
import type { AuthCopyConfig, ResolvedAuthCopyConfig } from "./copy";
import type { OAuthProvider } from "./oauth-providers";

export type { OAuthProvider };

/**
 * Supported desktop display strategies for the auth surface.
 */
export type DrawerMode = "drawer" | "modal";

/**
 * Supported desktop alignment positions for the auth surface.
 */
export type DrawerPosition = "center" | "left" | "right";

/**
 * Supported credential form modes.
 */
export type FormMode = "login" | "register" | "resetPassword";

/**
 * Current loading target for auth actions.
 */
export type LoadingAction = OAuthProvider | "email" | "forgotPassword" | null;

/**
 * Controls for collapsing extra OAuth providers behind a disclosure.
 */
export type AuthOAuthOverflowConfig = {
  /**
   * How many provider buttons stay visible before the disclosure appears.
   * Minimum 1. Defaults to 2.
   */
  visibleCount?: number;
  /**
   * When true, stacked icon previews for hidden providers appear on the
   * disclosure trigger. When false, only the label and chevron show.
   */
  showPreviewIcons?: boolean;
};

export type ResolvedAuthOAuthOverflowConfig = Required<AuthOAuthOverflowConfig>;

/**
 * Frontend-facing auth controls grouped under the public `auth` config key.
 */
export type AuthConfigGroup = {
  providers?: OAuthProvider[];
  oauthLayout?: "row" | "column";
  oauthOverflow?: AuthOAuthOverflowConfig;
  allowRegister?: boolean;
  showRememberMe?: boolean;
  initialMode?: FormMode;
  showForgotPassword?: boolean;
  showLivePasswordMatch?: boolean;
  showFooter?: boolean;
  emailAutocomplete?: {
    enabled?: boolean;
    domains?: string[];
  };
};

export type ResolvedAuthConfigGroup = Required<AuthConfigGroup> & {
  emailAutocomplete: Required<NonNullable<AuthConfigGroup["emailAutocomplete"]>>;
};

/**
 * Gradient controls for the drawer backdrop.
 */
export type AuthBackdropGradientConfig = {
  angle?: number;
  from?: string;
  to?: string;
  fromPos?: number;
  toPos?: number;
};

/**
 * Backdrop color and blur controls exposed through the public `visual` config key.
 */
export type AuthBackdropConfig = {
  color?: string;
  opacity?: number;
  blur?: number;
  gradient?: AuthBackdropGradientConfig;
};

/**
 * Public visual controls for the auth surface.
 */
export type AuthVisualConfig = {
  backdrop?: AuthBackdropConfig;
};

/**
 * Complete UI configuration namespace.
 *
 * This groups everything that changes how the auth surface looks, renders, or
 * behaves visually. Activation rules live separately under `triggers`.
 */
export type AuthUiConfig = {
  /**
   * Auth form controls, provider choices, and form feature flags.
   */
  auth?: AuthConfigGroup;
  /**
   * User-facing copy for labels, headings, buttons, and messages.
   */
  copy?: AuthCopyConfig;
  /**
   * Drawer/modal presentation options.
   */
  presentation?: AuthPresentationConfig;
  /**
   * Visual styling for backdrop and surface-related values.
   */
  visual?: AuthVisualConfig;
  /**
   * Low-level motion and layout tuning.
   */
  motion?: Partial<MotionSettings>;
  /**
   * Fully custom footer below the form. Overrides copy.footer segments.
   */
  footer?: ReactNode;
};

/**
 * Common repetition and eligibility policy shared by trigger types.
 *
 * Use one of these when a trigger needs to be rate-limited or sampled.
 */
export type TriggerPolicy = {
  /**
   * Fire only once for the current mount/session instance.
   */
  once?: boolean;
  /**
   * Minimum time between firings for the same trigger key.
   */
  cooldownMs?: number;
  /**
   * Scope for persisted eligibility checks.
   */
  scope?: "session" | "day" | "week" | "install";
  /**
   * Only fire on every Nth eligible event.
   */
  every?: number;
  /**
   * Probability gate for random sampling, expressed as 0..1.
   */
  sampleRate?: number;
};

/**
 * Configuration for the auth surface itself.
 *
 * Use this when you want the auth surface to render as a drawer or modal
 * independently of any trigger behavior.
 */
export type AuthPresentationConfig = {
  /**
   * Drawer or modal presentation variant.
   */
  variant?: DrawerMode;
  /**
   * Open the surface immediately on mount.
   */
  defaultOpen?: boolean;
};

/**
 * Configuration for the scroll-based auto-open trigger.
 *
 * The threshold is a normalized scroll progress value:
 * - 0 = top of the container
 * - 1 = bottom of the container
 *
 * Defaults:
 * - threshold: 0.25
 * - once: true
 */
export type ScrollOpenTriggerConfig = TriggerPolicy & {
  /**
   * Normalized scroll progress required before auth opens.
   */
  threshold?: number;
  /**
   * Scroll container to observe.
   */
  container?: "self" | "page";
};

/**
 * Configuration for opening auth on page load.
 */
export type PageLoadTriggerConfig = TriggerPolicy & {
  /**
   * Delay before opening after mount.
   */
  delayMs?: number;
};

/**
 * Configuration for opening auth on a click target.
 */
export type ClickTriggerConfig = TriggerPolicy & {
  /**
   * Optional selector used by host apps to bind the click source.
   */
  selector?: string;
  /**
   * DOM event that should be treated as the click source.
   */
  event?: "click" | "pointerdown";
};

/**
 * Configuration for opening auth when app state enters a blocked state.
 */
export type StateTriggerConfig = TriggerPolicy & {
  /**
   * The auth-related state that should open the surface.
   */
  state: "denied" | "expired" | "missing";
};

/**
 * Configuration for opening auth after inactivity.
 */
export type IdleTriggerConfig = TriggerPolicy & {
  /**
   * Milliseconds of inactivity before firing.
   */
  idleMs: number;
};

/**
 * Configuration for app-defined custom trigger events.
 */
export type CustomTriggerConfig = TriggerPolicy & {
  /**
   * App-defined event name.
   */
  event: string;
};

/**
 * Public trigger namespace for auth activation rules.
 *
 * The key names are the stable trigger identifiers; no separate `id` field is
 * needed in the config shape.
 */
export type AuthTriggerConfig = {
  pageLoad?: PageLoadTriggerConfig;
  click?: ClickTriggerConfig;
  state?: StateTriggerConfig;
  scrollOpen?: ScrollOpenTriggerConfig;
  idle?: IdleTriggerConfig;
  custom?: CustomTriggerConfig;
};

/**
 * Public trigger event name used by the store and adapters.
 */
export type AuthTriggerKind = keyof AuthTriggerConfig;

/**
 * Storage interface used by the trigger store.
 *
 * Implement this with localStorage, sessionStorage, in-memory state, or a
 * custom persistence layer.
 */
export type AuthTriggerStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Event payload emitted into the trigger store.
 *
 * Emit these events from any runtime. The store decides whether a registered
 * trigger should open auth.
 */
export type AuthTriggerEvent =
  | {
      kind: "pageLoad";
      source?: "mount" | "manual";
    }
  | {
      kind: "click";
      selector?: string;
      event?: "click" | "pointerdown";
      target?: EventTarget | null;
    }
  | {
      kind: "state";
      state: "denied" | "expired" | "missing";
      reason?: string;
      payload?: unknown;
    }
  | {
      kind: "scrollOpen";
      progress: number;
      threshold?: number;
      container?: "self" | "page";
    }
  | {
      kind: "idle";
      idleMs: number;
    }
  | {
      kind: "custom";
      event: string;
      payload?: unknown;
    };

/**
 * Snapshot of the store ledger for debugging, analytics, or test assertions.
 */
export type AuthTriggerStoreSnapshot = {
  seenCounts: Record<string, number>;
  fireCounts: Record<string, number>;
  lastSeenAt: Record<string, number>;
  lastFiredAt: Record<string, number>;
};

/**
 * Store options that control persistence and randomness.
 */
export type AuthTriggerStoreOptions = {
  namespace?: string;
  storage?: AuthTriggerStorage;
  now?: () => number;
  random?: () => number;
};

/**
 * Central trigger store contract.
 *
 * This keeps trigger bookkeeping out of component code so host apps can reuse
 * the same rules from React, vanilla DOM, or server-adjacent glue.
 */
export type AuthTriggerStore = {
  registerTrigger: <T extends AuthTriggerKind>(
    kind: T,
    config: AuthTriggerConfig[T] | undefined,
    onFire: (event: AuthTriggerEvent) => void,
  ) => () => void;
  emit: (event: AuthTriggerEvent) => void;
  subscribe: (listener: (event: AuthTriggerEvent) => void) => () => void;
  clear: (kind?: AuthTriggerKind) => void;
  snapshot: () => AuthTriggerStoreSnapshot;
};

/**
 * Credential payload passed to whichever auth backend the consumer uses.
 */
export type CredentialAuthInput = {
  mode: FormMode;
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * Reset password parameters.
 */
export interface ResetPasswordInput {
  newPassword: string;
}

/**
 * Backend-agnostic auth operation contract.
 */
export type AuthHandlers = {
  onCredential?: (input: CredentialAuthInput) => Promise<void>;
  onOAuth?: (provider: OAuthProvider) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  onResetPassword?: (input: ResetPasswordInput) => Promise<void>;
  normalizeError?: (
    error: unknown,
    context: { provider?: OAuthProvider; fallbackTarget?: AuthUiError["target"] },
  ) => AuthUiError;
};

/**
 * Motion and layout contract consumed by AuthDrawer and the motion studio.
 */
export type MotionSettings = {
  upwardResistance: number;
  downwardThreshold: number;
  velocityThreshold: number;
  snapStiffness: number;
  snapDamping: number;
  snapMass: number;
  displayMode: DrawerMode;
  desktopWidth: string;
  desktopPosition: DrawerPosition;
  entryDuration: number;
  entryDelay: number;
  entryScale: number;
  entryY: number;
  entryEase: string;
  exitDuration: number;
  exitDelay: number;
  exitScale: number;
  exitY: number;
  exitEase: string;
  backdropOpacity: number;
  backdropColor: string;
  backdropBlur: number;
  backdropAngle: number;
  backdropStartColor: string;
  backdropEndColor: string;
  backdropStartPos: number;
  backdropEndPos: number;
  formPaddingTop: number;
  formPaddingBottom: number;
  formJustify: string;
  formAlign: string;
};

/**
 * Top-level configuration contract for AuthDrawer.
 *
 * All fields are optional and merged with defaults inside AuthDrawer.
 */
export type AuthConfig = {
  /**
   * Namespace for all visual, presentation, form, and motion config.
   */
  ui?: AuthUiConfig;
  /**
   * Activation rules that can open the auth surface.
   */
  triggers?: AuthTriggerConfig;
} & AuthHandlers;

/**
 * Fully resolved config used inside the drawer after defaults merge.
 */
export type ResolvedAuthConfig = Omit<Required<AuthConfig>, "ui" | "triggers"> & {
  ui: {
    auth: ResolvedAuthConfigGroup;
    copy: ResolvedAuthCopyConfig;
    presentation: Required<AuthPresentationConfig>;
    visual: {
      backdrop: Required<AuthBackdropConfig> & {
        gradient: Required<AuthBackdropGradientConfig>;
      };
    };
    motion: MotionSettings;
    footer?: ReactNode;
  };
  triggers: AuthTriggerConfig;
};

/**
 * OAuth provider registry entry used by the button group.
 */
export type ProviderDef = {
  id: OAuthProvider;
  label: string;
  icon: ComponentType;
};
