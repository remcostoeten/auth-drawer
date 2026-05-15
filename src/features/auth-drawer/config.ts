import type { ResolvedAuthConfig } from "./types";
import { normalizeAuthError } from "./auth-errors";

async function noopAuthAction() {
  await new Promise((resolveDone) => setTimeout(resolveDone, 800));
}

/**
 * Default resolved configuration for AuthDrawer.
 * Downstream components receive this merged shape only.
 */
export const DEFAULT_CONFIG: ResolvedAuthConfig = {
  providers: ["github", "google"],
  oauthLayout: "column",
  allowRegister: true,
  showRememberMe: true,
  onCredential: noopAuthAction,
  onOAuth: noopAuthAction,
  onForgotPassword: noopAuthAction,
  normalizeError: normalizeAuthError,
  motionSettings: {
    upwardResistance: 0.15,
    downwardThreshold: 0.25,
    velocityThreshold: 500,
    snapStiffness: 850,
    snapDamping: 14,
    snapMass: 0.8,
    displayMode: "drawer",
    desktopWidth: "448px",
    desktopPosition: "center",
    entryDuration: 0.9,
    entryDelay: 0,
    entryScale: 0.95,
    entryY: 20,
    entryEase: "[0.23,1,0.32,1]",
    exitDuration: 0.3,
    exitDelay: 0,
    exitScale: 0.95,
    exitY: 10,
    exitEase: "easeIn",
    backdropOpacity: 0.85,
    backdropColor: "#070708",
    backdropBlur: 6,
    backdropAngle: 180,
    backdropStartColor: "transparent",
    backdropEndColor: "#070708",
    backdropStartPos: 100,
    backdropEndPos: 100,
    formPaddingTop: 0,
    formPaddingBottom: 200,
    formJustify: "center",
    formAlign: "center",
  },
};
