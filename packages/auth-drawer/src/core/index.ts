export { DEFAULT_CONFIG } from "./config";
export { createAdapter } from "./create-adapter";
export { createAdapterError } from "./errors";
export {
  EMPTY_AUTH_ERRORS,
  createAuthError,
  hasAuthErrors,
  mergeAuthErrors,
  normalizeAuthError,
} from "./auth-errors";
export type {
  AuthErrorCode,
  AuthErrorState,
  AuthErrorTarget,
  AuthFieldErrors,
  AuthUiError,
} from "./auth-errors";
export {
  OAUTH_PROVIDER_IDS,
  OAUTH_PROVIDER_LABELS,
  OAUTH_PROVIDER_REGISTRY,
  OAUTH_VISIBLE_COUNT,
  defaultLabelForOAuthProvider,
  resolveOAuthProviders,
  resolveOAuthVisibleCount,
} from "./oauth-providers";
export type { OAuthProviderMeta } from "./oauth-providers";
export { DEFAULT_COPY, DEFAULT_LEGAL_FOOTER_SEGMENTS, formatCopy, resolveCopyGroup } from "./copy";
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
  AuthOAuthProvider,
  ResolvedAuthCloseCopy,
  ResolvedAuthCopyConfig,
  ResolvedAuthFieldCopy,
  ResolvedAuthFieldsCopy,
  ResolvedAuthFooterCopy,
  ResolvedAuthForgotPasswordCopy,
  ResolvedAuthFormCopy,
  ResolvedAuthLastUsedCopy,
  ResolvedAuthMagicLinkCopy,
  ResolvedAuthOAuthCopy,
  ResolvedAuthPasskeyCopy,
  ResolvedAuthPasswordToggleCopy,
  ResolvedAuthRememberMeCopy,
  ResolvedAuthTriggerCopy,
  ResolvedAuthValidationCopy,
} from "./copy";
export {
  clearLastUsedMethod,
  readLastUsedMethod,
  recordLastUsedMethod,
  subscribeLastUsed,
} from "./last-used";
export type { LastUsedMethod } from "./last-used";
export { createAuthTriggerStore } from "./triggers/create-auth-trigger-store";
export { registerOverlay } from "./lib/overlay-registry";
export { getPasswordMatchFeedback, validateCredentials } from "./validation";
export type { CredentialInput, PasswordMatchFeedback } from "./validation";
export {
  DEFAULT_AUTH_SUCCESS_CONFIG,
  getAuthSuccessCloseDelay,
  getAuthSuccessFooter,
  resolveAuthSuccessConfig,
  resolveAuthSuccessMessage,
} from "./auth-success";
export type { AuthSuccessMessageMap, AuthSuccessState } from "./auth-success";
export {
  resolveAuthConfig,
  resolveAuthGroup,
  resolveBackdropGroup,
  resolveMotionSettings,
  resolvePresentationGroup,
} from "./resolve-config";
export { suggestEmailCompletion } from "./email-completion";
export {
  STATIC_SESSION,
  createPushSession,
  createSessionStore,
  createSubscriptionSession,
  sessionOf,
} from "./session";
export type {
  PushSession,
  SessionFetch,
  SessionFetchResult,
  SessionPatch,
  SessionStore,
} from "./session";
export { createSubscribers } from "./store";
export type { Controller, Subscribers } from "./store";
export { createAuthFormController } from "./controllers/auth-form-controller";
export type {
  AuthFormController,
  AuthFormControllerOptions,
  AuthFormState,
  FormButtonFeedback,
} from "./controllers/auth-form-controller";
export { createDrawerController } from "./controllers/drawer-controller";
export type {
  DrawerController,
  DrawerControllerOptions,
  DrawerState,
  OpenBinding,
} from "./controllers/drawer-controller";
export { createAuthClient } from "./controllers/auth-client";
export type { AuthClient, AuthClientOptions, AuthClientState } from "./controllers/auth-client";
export * from "./constants";
export type {
  AuthAction,
  AuthAdapter,
  AuthBackdropConfig,
  AuthBackdropGradientConfig,
  AuthConfig,
  AuthConfigGroup,
  AuthErrorNormalizer,
  AuthMagicLinkConfig,
  AuthOAuthOverflowConfig,
  AuthPasskeyConfig,
  AuthPresentationConfig,
  AuthResult,
  AuthSessionState,
  AuthSuccessAction,
  AuthSuccessConfig,
  AuthTriggerConfig,
  AuthTriggerEvent,
  AuthTriggerKind,
  AuthTriggerStorage,
  AuthTriggerStore,
  AuthTriggerStoreOptions,
  AuthTriggerStoreSnapshot,
  AuthUiConfig,
  AuthVisualConfig,
  ClickTriggerConfig,
  CredentialAuthInput,
  CustomTriggerConfig,
  DrawerMode,
  DrawerPosition,
  FormMode,
  IdleTriggerConfig,
  LoadingAction,
  MotionSettings,
  OAuthProvider,
  PageLoadTriggerConfig,
  ProviderDef,
  ResetPasswordInput,
  ResolvedAuthConfig,
  ResolvedAuthConfigGroup,
  ResolvedAuthMagicLinkConfig,
  ResolvedAuthOAuthOverflowConfig,
  ResolvedAuthPasskeyConfig,
  ResolvedAuthSuccessConfig,
  ScrollOpenTriggerConfig,
  SessionSnapshot,
  SessionSource,
  StateTriggerConfig,
  TriggerPolicy,
} from "./types";
