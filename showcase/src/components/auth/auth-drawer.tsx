import {
  AuthDrawer as PackageAuthDrawer,
  DEFAULT_CONFIG as PACKAGE_DEFAULT_CONFIG,
  DEFAULT_COPY as PACKAGE_DEFAULT_COPY,
  OAUTH_PROVIDER_IDS as PACKAGE_OAUTH_PROVIDER_IDS,
} from "@remcostoeten/auth-drawer";
import type { ComponentType } from "react";
import type {
  AuthConfig,
  OAuthProvider,
  ResolvedAuthConfig,
  AuthTriggerStore,
} from "../../../../packages/auth-drawer/src/types";
import type { ResolvedAuthCopyConfig } from "../../../../packages/auth-drawer/src/copy";

export {
  createAuthTriggerStore,
  defaultLabelForOAuthProvider,
  resolveOAuthVisibleCount,
  useScrollOpenTrigger,
} from "@remcostoeten/auth-drawer";

export type AuthDrawerProps = {
  config?: AuthConfig;
  className?: string;
  hideTrigger?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerStore?: AuthTriggerStore;
};

export const AuthDrawer = PackageAuthDrawer as ComponentType<AuthDrawerProps>;
export const DEFAULT_CONFIG = PACKAGE_DEFAULT_CONFIG as unknown as ResolvedAuthConfig;
export const DEFAULT_COPY = PACKAGE_DEFAULT_COPY as unknown as ResolvedAuthCopyConfig;
export const OAUTH_PROVIDER_IDS = PACKAGE_OAUTH_PROVIDER_IDS as unknown as readonly OAuthProvider[];

export type { AuthCopyConfig } from "../../../../packages/auth-drawer/src/copy";
export type { AuthConfig, AuthTriggerStore, OAuthProvider, ResolvedAuthCopyConfig };
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
} from "../../../../packages/auth-drawer/src/types";
