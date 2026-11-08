import "../../styles/react/bundle.css";

export { AuthDrawer } from "./ui/auth-drawer";
export { AuthProvider, useAuth, useOptionalAuth } from "./ui/auth-provider";
export { DEFAULT_CONFIG } from "@remcostoeten/auth-drawer/core";
export { createAdapter } from "./create-adapter";
export {
  OAUTH_PROVIDER_IDS,
  OAUTH_PROVIDER_REGISTRY,
  OAUTH_VISIBLE_COUNT,
  resolveOAuthProviders,
  resolveOAuthVisibleCount,
  defaultLabelForOAuthProvider,
} from "./oauth-providers";
export {
  DEFAULT_COPY,
  DEFAULT_LEGAL_FOOTER_SEGMENTS,
  formatCopy,
  resolveCopyGroup,
} from "@remcostoeten/auth-drawer/core";
export { useScrollOpenTrigger } from "./hooks/use-scroll-open-trigger";
export {
  clearLastUsedMethod,
  readLastUsedMethod,
  recordLastUsedMethod,
  useLastUsedMethod,
} from "./last-used";
export type { LastUsedMethod } from "./last-used";
export { createAuthTriggerStore } from "@remcostoeten/auth-drawer/core";
export type {
  AuthCloseCopy,
  AuthCopyConfig,
  AuthFieldCopy,
  AuthFieldsCopy,
  AuthFooterCopy,
  AuthFooterLinkSegment,
  AuthFooterSegment,
  AuthFooterTextSegment,
  AuthForgotPasswordCopy,
  AuthFormCopy,
  AuthLastUsedCopy,
  AuthMagicLinkCopy,
  AuthOAuthCopy,
  AuthPasskeyCopy,
  AuthPasswordToggleCopy,
  AuthRememberMeCopy,
  AuthTriggerCopy,
  AuthValidationCopy,
  ResolvedAuthCopyConfig,
  ResolvedAuthFooterCopy,
  ResolvedAuthMagicLinkCopy,
} from "@remcostoeten/auth-drawer/core";
export type {
  AuthBackdropConfig,
  AuthBackdropGradientConfig,
  AuthConfig,
  AuthConfigGroup,
  AuthMagicLinkConfig,
  ResolvedAuthMagicLinkConfig,
  AuthPasskeyConfig,
  ResolvedAuthPasskeyConfig,
  AuthAdapter,
  AuthAction,
  AuthResult,
  AuthSessionState,
  AuthOAuthOverflowConfig,
  AuthSuccessAction,
  AuthSuccessConfig,
  ResolvedAuthOAuthOverflowConfig,
  AuthUiConfig,
  AuthTriggerEvent,
  AuthPresentationConfig,
  AuthTriggerConfig,
  AuthTriggerKind,
  AuthTriggerStore,
  AuthTriggerStoreOptions,
  AuthTriggerStoreSnapshot,
  AuthTriggerStorage,
  DrawerMode,
  DrawerPosition,
  OAuthProvider,
  AuthVisualConfig,
  ResolvedAuthSuccessConfig,
  ScrollOpenTriggerConfig,
  TriggerPolicy,
  CredentialAuthInput,
  ResetPasswordInput,
} from "./types";
export type { AuthProviderProps } from "./ui/auth-provider";
export type { ScrollOpenTriggerOptions } from "./hooks/use-scroll-open-trigger";
