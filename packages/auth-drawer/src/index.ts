import "../styles/bundle.css";

export { AuthDrawer } from "./ui/auth-drawer";
export { AuthProvider, useAuth } from "./ui/auth-provider";
export { DEFAULT_CONFIG } from "./config";
export { createAdapter } from "./create-adapter";
export {
  OAUTH_PROVIDER_IDS,
  OAUTH_PROVIDER_REGISTRY,
  OAUTH_VISIBLE_COUNT,
  resolveOAuthProviders,
  resolveOAuthVisibleCount,
  defaultLabelForOAuthProvider,
} from "./oauth-providers";
export { DEFAULT_COPY, DEFAULT_LEGAL_FOOTER_SEGMENTS, formatCopy, resolveCopyGroup } from "./copy";
export { useScrollOpenTrigger } from "./hooks/use-scroll-open-trigger";
export { createAuthTriggerStore } from "./triggers/create-auth-trigger-store";
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
  AuthOAuthCopy,
  AuthPasswordToggleCopy,
  AuthRememberMeCopy,
  AuthTriggerCopy,
  AuthValidationCopy,
  ResolvedAuthCopyConfig,
  ResolvedAuthFooterCopy,
} from "./copy";
export type {
  AuthBackdropConfig,
  AuthBackdropGradientConfig,
  AuthConfig,
  AuthConfigGroup,
  AuthAdapter,
  AuthResult,
  AuthSessionState,
  AuthOAuthOverflowConfig,
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
  ScrollOpenTriggerConfig,
  TriggerPolicy,
  CredentialAuthInput,
  ResetPasswordInput,
} from "./types";
export type { AuthProviderProps } from "./ui/auth-provider";
export type { ScrollOpenTriggerOptions } from "./hooks/use-scroll-open-trigger";
