import type { ComponentType, ReactNode } from "react";
import type {
  AuthAdapter as CoreAuthAdapter,
  AuthConfig as CoreAuthConfig,
  AuthSuccessConfig as CoreAuthSuccessConfig,
  AuthUiConfig as CoreAuthUiConfig,
  ProviderDef as CoreProviderDef,
  ResolvedAuthConfig as CoreResolvedAuthConfig,
  ResolvedAuthSuccessConfig as CoreResolvedAuthSuccessConfig,
  SessionSnapshot,
} from "@remcostoeten/auth-drawer/core";

export type * from "@remcostoeten/auth-drawer/core";

/**
 * A renderable OAuth provider icon: a React component, a JSX element, or an image URL string.
 */
export type OAuthIconSource = ComponentType<{ className?: string }> | ReactNode | string;

export type AuthSuccessConfig = CoreAuthSuccessConfig<ReactNode>;

export type ResolvedAuthSuccessConfig = CoreResolvedAuthSuccessConfig<ReactNode>;

export type AuthUiConfig = CoreAuthUiConfig<ReactNode>;

export type AuthConfig = CoreAuthConfig<ReactNode>;

export type ResolvedAuthConfig = CoreResolvedAuthConfig<ReactNode>;

/**
 * OAuth provider registry entry used by the button group.
 */
export type ProviderDef = CoreProviderDef<ComponentType>;

/**
 * Core interface for authentication adapters. `useSession` is the optional React hook form of the
 * session; when it is absent the renderer reads `session` instead.
 */
export type AuthAdapter = CoreAuthAdapter & {
  useSession?: () => SessionSnapshot;
};
