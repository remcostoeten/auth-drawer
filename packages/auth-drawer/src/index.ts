import "../styles/bundle.css";

export { AuthDrawer } from "./ui/auth-drawer";
export { DEFAULT_CONFIG } from "./config";
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
} from "./types";
export type { ScrollOpenTriggerOptions } from "./hooks/use-scroll-open-trigger";
