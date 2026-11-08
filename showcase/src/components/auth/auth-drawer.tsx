import {
  AuthDrawer as PackageAuthDrawer,
  DEFAULT_CONFIG as PACKAGE_DEFAULT_CONFIG,
  DEFAULT_COPY as PACKAGE_DEFAULT_COPY,
  OAUTH_PROVIDER_IDS as PACKAGE_OAUTH_PROVIDER_IDS,
} from "@remcostoeten/auth-drawer/react";
import type { ComponentType } from "react";
import type {
  AuthAdapter,
  AuthConfig,
  OAuthProvider,
  ResolvedAuthConfig,
  AuthTriggerStore,
} from "../../../../packages/auth-drawer/src/react/types";
import type { ResolvedAuthCopyConfig } from "../../../../packages/auth-drawer/src/react/copy";

export {
  createAuthTriggerStore,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
  useScrollOpenTrigger,
} from "@remcostoeten/auth-drawer/react";

export type AuthDrawerProps = {
  config?: AuthConfig;
  adapter: AuthAdapter;
  className?: string;
  hideTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (action: "signIn" | "signUp" | "signOut" | "oauth") => void;
  triggerStore?: AuthTriggerStore;
};

export const AuthDrawer = PackageAuthDrawer as ComponentType<AuthDrawerProps>;
export const DEFAULT_CONFIG = PACKAGE_DEFAULT_CONFIG as unknown as ResolvedAuthConfig;
export const DEFAULT_COPY = PACKAGE_DEFAULT_COPY as unknown as ResolvedAuthCopyConfig;
export const OAUTH_PROVIDER_IDS = PACKAGE_OAUTH_PROVIDER_IDS as unknown as readonly OAuthProvider[];

export type { AuthCopyConfig } from "../../../../packages/auth-drawer/src/react/copy";
export type { AuthAdapter, AuthConfig, AuthTriggerStore, OAuthProvider, ResolvedAuthCopyConfig };
export type {
  AuthBackdropConfig,
  AuthConfigGroup,
  AuthOAuthOverflowConfig,
  AuthPresentationConfig,
  AuthTriggerConfig,
  AuthTriggerEvent,
  AuthUiConfig,
  AuthVisualConfig,
  DrawerMode,
  DrawerPosition,
  MotionSettings,
} from "../../../../packages/auth-drawer/src/react/types";
