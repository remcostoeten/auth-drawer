import type { Dispatch, SetStateAction } from "react";
import {
  type AuthConfigGroup,
  type AuthOAuthOverflowConfig,
  type DrawerMode,
  type MotionSettings,
  type OAuthProvider,
  type ResolvedAuthCopyConfig,
} from "@/components/auth/auth-drawer";
import type { BackdropState } from "./helpers";

export type ConfiguratorTab = "auth" | "copy" | "visual" | "motion";

export const CONFIGURATOR_TABS: ReadonlyArray<{
  id: ConfiguratorTab;
  label: string;
}> = [
  { id: "auth", label: "Auth" },
  { id: "copy", label: "Copy" },
  { id: "visual", label: "Visual" },
  { id: "motion", label: "Motion" },
];

export const CONFIGURATOR_EASE = [0.23, 1, 0.32, 1] as const;
export const DOCS_NAV_HEIGHT_PX = 36;
export const CONFIG_CODE_STICKY_GAP_PX = 12;

export const OAUTH_OVERFLOW_PROVIDERS: OAuthProvider[] = [
  "github",
  "google",
  "apple",
  "discord",
  "tiktok",
];

export type ConfiguratorContextValue = {
  mode: DrawerMode;
  setMode: (mode: DrawerMode) => void;
  auth: AuthConfigGroup;
  setAuth: Dispatch<SetStateAction<AuthConfigGroup>>;
  copy: ResolvedAuthCopyConfig;
  setCopy: Dispatch<SetStateAction<ResolvedAuthCopyConfig>>;
  backdrop: BackdropState;
  motion: MotionSettings;
  oauthVisibleCount: number;
  providerCount: number;
  hasOAuthOverflow: boolean;
  updateAuth: <K extends keyof AuthConfigGroup>(
    key: K,
    value: AuthConfigGroup[K],
  ) => void;
  cycleProvider: (provider: OAuthProvider) => void;
  updateOAuthOverflow: <K extends keyof AuthOAuthOverflowConfig>(
    key: K,
    value: NonNullable<AuthOAuthOverflowConfig[K]>,
  ) => void;
  updateBackdrop: <K extends keyof BackdropState>(
    key: K,
    value: BackdropState[K],
  ) => void;
  updateGradient: <K extends keyof BackdropState["gradient"]>(
    key: K,
    value: BackdropState["gradient"][K],
  ) => void;
  updateMotion: <K extends keyof MotionSettings>(
    key: K,
    value: MotionSettings[K],
  ) => void;
};
