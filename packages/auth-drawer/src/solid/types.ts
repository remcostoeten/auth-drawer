import type { Component, JSX } from "solid-js";
import type {
  AuthConfig as CoreAuthConfig,
  AuthSuccessConfig as CoreAuthSuccessConfig,
  AuthUiConfig as CoreAuthUiConfig,
  ProviderDef as CoreProviderDef,
  ResolvedAuthConfig as CoreResolvedAuthConfig,
  ResolvedAuthSuccessConfig as CoreResolvedAuthSuccessConfig,
} from "@remcostoeten/auth-drawer/core";

export type * from "@remcostoeten/auth-drawer/core";

export type OAuthIconSource = Component<{ class?: string }> | JSX.Element | string;

export type AuthSuccessConfig = CoreAuthSuccessConfig<JSX.Element>;

export type ResolvedAuthSuccessConfig = CoreResolvedAuthSuccessConfig<JSX.Element>;

export type AuthUiConfig = CoreAuthUiConfig<JSX.Element>;

export type AuthConfig = CoreAuthConfig<JSX.Element>;

export type ResolvedAuthConfig = CoreResolvedAuthConfig<JSX.Element>;

export type ProviderDef = CoreProviderDef<Component<{ class?: string }>>;
