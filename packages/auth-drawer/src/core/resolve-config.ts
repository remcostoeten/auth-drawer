import { normalizeAuthError } from "./auth-errors";
import { resolveAuthSuccessConfig } from "./auth-success";
import { DEFAULT_CONFIG } from "./config";
import { SETTINGS_KEY } from "./constants";
import { resolveCopyGroup } from "./copy";
import { resolveOAuthVisibleCount } from "./oauth-providers";
import type {
  AuthAdapter,
  AuthBackdropConfig,
  AuthConfig,
  AuthPresentationConfig,
  FormMode,
  MotionSettings,
  ResolvedAuthConfig,
  ResolvedAuthConfigGroup,
} from "./types";

type ResolvedBackdrop = Required<AuthBackdropConfig> & {
  gradient: Required<NonNullable<AuthBackdropConfig["gradient"]>>;
};

function readSavedSettings(): Partial<MotionSettings> {
  if (typeof window === "undefined") return {};

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return {};

    return JSON.parse(saved) as Partial<MotionSettings>;
  } catch {
    return {};
  }
}

function resolveInitialMode(input: {
  requested: FormMode;
  magicLinkEnabled: boolean;
  hasPasswordSignIn: boolean;
}): FormMode {
  if (input.requested === "magicLink") {
    return input.magicLinkEnabled ? "magicLink" : "login";
  }
  if (!input.hasPasswordSignIn && input.magicLinkEnabled) return "magicLink";
  return input.requested;
}

/**
 * @name resolveAuthGroup
 * @description Resolves the `ui.auth` group against defaults and the adapter's capabilities.
 *
 * @example
 * const group = resolveAuthGroup(config, adapter);
 */
export function resolveAuthGroup<Node>(
  config: AuthConfig<Node> | undefined,
  adapter: AuthAdapter,
): ResolvedAuthConfigGroup {
  const auth = config?.ui?.auth ?? {};
  // Better Auth Proxy clients can surface a non-array here, so only trust a real array.
  const adapterProviders = Array.isArray(adapter.providers) ? adapter.providers : undefined;
  const magicLinkEnabled =
    typeof adapter.features?.magicLink?.signIn === "function" &&
    (auth.magicLink?.enabled ?? DEFAULT_CONFIG.ui.auth.magicLink.enabled);
  const passkeyEnabled =
    typeof adapter.features?.passkey?.signIn === "function" &&
    (auth.passkey?.enabled ?? DEFAULT_CONFIG.ui.auth.passkey.enabled);
  const hasPasswordSignIn = typeof adapter.signIn === "function";
  // With both lists set, intersect them so the UI never shows a provider the adapter lacks.
  const providers = !adapter.signInWithOAuth
    ? []
    : auth.providers && adapterProviders
      ? auth.providers.filter((p) => adapterProviders.includes(p))
      : (auth.providers ?? adapterProviders ?? DEFAULT_CONFIG.ui.auth.providers);

  return {
    providers,
    oauthLayout: auth.oauthLayout ?? DEFAULT_CONFIG.ui.auth.oauthLayout,
    oauthOverflow: {
      visibleCount: resolveOAuthVisibleCount(
        auth.oauthOverflow?.visibleCount ?? DEFAULT_CONFIG.ui.auth.oauthOverflow.visibleCount,
      ),
      showPreviewIcons:
        auth.oauthOverflow?.showPreviewIcons ??
        DEFAULT_CONFIG.ui.auth.oauthOverflow.showPreviewIcons,
    },
    allowRegister: !adapter.signUp
      ? false
      : (auth.allowRegister ?? DEFAULT_CONFIG.ui.auth.allowRegister),
    showRememberMe: auth.showRememberMe ?? DEFAULT_CONFIG.ui.auth.showRememberMe,
    initialMode: resolveInitialMode({
      requested: auth.initialMode ?? DEFAULT_CONFIG.ui.auth.initialMode,
      magicLinkEnabled,
      hasPasswordSignIn,
    }),
    showForgotPassword: !adapter.requestPasswordReset
      ? false
      : (auth.showForgotPassword ?? DEFAULT_CONFIG.ui.auth.showForgotPassword),
    showLivePasswordMatch:
      auth.showLivePasswordMatch ?? DEFAULT_CONFIG.ui.auth.showLivePasswordMatch,
    showFooter: auth.showFooter ?? DEFAULT_CONFIG.ui.auth.showFooter,
    emailAutocomplete: {
      enabled: auth.emailAutocomplete?.enabled ?? DEFAULT_CONFIG.ui.auth.emailAutocomplete.enabled,
      domains: auth.emailAutocomplete?.domains ?? DEFAULT_CONFIG.ui.auth.emailAutocomplete.domains,
    },
    magicLink: {
      enabled: magicLinkEnabled,
      resendMs: auth.magicLink?.resendMs ?? DEFAULT_CONFIG.ui.auth.magicLink.resendMs,
    },
    passkey: { enabled: passkeyEnabled },
    showLastUsed: auth.showLastUsed ?? DEFAULT_CONFIG.ui.auth.showLastUsed,
  };
}

/**
 * @name resolveBackdropGroup
 * @description Resolves backdrop colors, blur and gradient from `ui.visual.backdrop`, falling back
 * to the legacy `ui.motion` backdrop fields and then the defaults.
 *
 * @example
 * resolveBackdropGroup(config).blur;
 */
export function resolveBackdropGroup<Node>(config?: AuthConfig<Node>): ResolvedBackdrop {
  const backdrop = config?.ui?.visual?.backdrop ?? {};
  const motion = config?.ui?.motion ?? {};

  return {
    color: backdrop.color ?? motion.backdropColor ?? DEFAULT_CONFIG.ui.visual.backdrop.color,
    opacity:
      backdrop.opacity ?? motion.backdropOpacity ?? DEFAULT_CONFIG.ui.visual.backdrop.opacity,
    blur: backdrop.blur ?? motion.backdropBlur ?? DEFAULT_CONFIG.ui.visual.backdrop.blur,
    gradient: {
      angle:
        backdrop.gradient?.angle ??
        motion.backdropAngle ??
        DEFAULT_CONFIG.ui.visual.backdrop.gradient.angle,
      from:
        backdrop.gradient?.from ??
        motion.backdropStartColor ??
        DEFAULT_CONFIG.ui.visual.backdrop.gradient.from,
      to:
        backdrop.gradient?.to ??
        motion.backdropEndColor ??
        DEFAULT_CONFIG.ui.visual.backdrop.gradient.to,
      fromPos:
        backdrop.gradient?.fromPos ??
        motion.backdropStartPos ??
        DEFAULT_CONFIG.ui.visual.backdrop.gradient.fromPos,
      toPos:
        backdrop.gradient?.toPos ??
        motion.backdropEndPos ??
        DEFAULT_CONFIG.ui.visual.backdrop.gradient.toPos,
    },
  };
}

/**
 * @name resolveMotionSettings
 * @description Merges defaults, motion settings saved by the studio in localStorage, and explicit
 * overrides, then applies the resolved backdrop and display mode on top.
 *
 * @example
 * resolveMotionSettings(config.ui?.motion, backdrop, "modal").displayMode; // "modal"
 */
export function resolveMotionSettings(
  overrides?: Partial<MotionSettings>,
  backdrop?: AuthBackdropConfig,
  displayMode?: MotionSettings["displayMode"],
): MotionSettings {
  const merged = {
    ...DEFAULT_CONFIG.ui.motion,
    ...readSavedSettings(),
    ...overrides,
  };

  return {
    ...merged,
    displayMode: displayMode ?? overrides?.displayMode ?? DEFAULT_CONFIG.ui.motion.displayMode,
    backdropColor: backdrop?.color ?? overrides?.backdropColor ?? merged.backdropColor,
    backdropOpacity: backdrop?.opacity ?? overrides?.backdropOpacity ?? merged.backdropOpacity,
    backdropBlur: backdrop?.blur ?? overrides?.backdropBlur ?? merged.backdropBlur,
    backdropAngle: backdrop?.gradient?.angle ?? overrides?.backdropAngle ?? merged.backdropAngle,
    backdropStartColor:
      backdrop?.gradient?.from ?? overrides?.backdropStartColor ?? merged.backdropStartColor,
    backdropEndColor:
      backdrop?.gradient?.to ?? overrides?.backdropEndColor ?? merged.backdropEndColor,
    backdropStartPos:
      backdrop?.gradient?.fromPos ?? overrides?.backdropStartPos ?? merged.backdropStartPos,
    backdropEndPos: backdrop?.gradient?.toPos ?? overrides?.backdropEndPos ?? merged.backdropEndPos,
  };
}

/**
 * @name resolvePresentationGroup
 * @description Resolves `ui.presentation` against the defaults.
 *
 * @example
 * resolvePresentationGroup(config).dismissible; // true
 */
export function resolvePresentationGroup<Node>(
  config?: AuthConfig<Node>,
): Required<AuthPresentationConfig> {
  return {
    ...DEFAULT_CONFIG.ui.presentation,
    ...config?.ui?.presentation,
  };
}

/**
 * @name resolveAuthConfig
 * @description Resolves a partial config and an adapter into the complete config used by the
 * controllers: auth group, copy, presentation, backdrop, motion, success handling, triggers and
 * the default error normalizer that applies the configured error copy.
 *
 * @example
 * const resolved = resolveAuthConfig(config, adapter);
 * resolved.ui.auth.providers;
 */
export function resolveAuthConfig<Node = unknown>(
  config: AuthConfig<Node> | undefined,
  adapter: AuthAdapter,
): ResolvedAuthConfig<Node> {
  const copy = resolveCopyGroup(config);
  const auth = resolveAuthGroup(config, adapter);
  const backdrop = resolveBackdropGroup(config);
  const presentation = resolvePresentationGroup(config);
  const motion = resolveMotionSettings(config?.ui?.motion, backdrop, presentation.variant);
  const success = resolveAuthSuccessConfig(config?.ui?.success);

  return {
    ...DEFAULT_CONFIG,
    ...config,
    normalizeError: config?.normalizeError
      ? config.normalizeError
      : (error, context) => {
          const normalized = normalizeAuthError(error, context);
          return {
            ...normalized,
            message: copy.errors[normalized.code] ?? normalized.message,
          };
        },
    triggers: {
      ...DEFAULT_CONFIG.triggers,
      ...config?.triggers,
    },
    ui: {
      auth,
      copy,
      presentation,
      visual: {
        backdrop,
      },
      motion,
      footer: config?.ui?.footer,
      success,
    },
  };
}
