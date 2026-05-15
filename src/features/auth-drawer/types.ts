import type { ComponentType } from "react";
import type { AuthUiError } from "./auth-errors";

/**
 * Supported OAuth provider identifiers.
 * Extend this union when adding a provider definition.
 */
export type OAuthProvider = "github" | "google";

/**
 * Supported desktop display strategies for the auth surface.
 */
export type DrawerMode = "drawer" | "modal";

/**
 * Supported desktop alignment positions for the auth surface.
 */
export type DrawerPosition = "center" | "left" | "right";

/**
 * Supported credential form modes.
 */
export type FormMode = "login" | "register";

/**
 * Current loading target for auth actions.
 */
export type LoadingAction = OAuthProvider | "email" | "forgotPassword" | null;

/**
 * Credential payload passed to whichever auth backend the consumer uses.
 */
export type CredentialAuthInput = {
  mode: FormMode;
  email: string;
  password: string;
  rememberMe: boolean;
};

/**
 * Backend-agnostic auth operation contract.
 */
export type AuthHandlers = {
  onCredential?: (input: CredentialAuthInput) => Promise<void>;
  onOAuth?: (provider: OAuthProvider) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  normalizeError?: (
    error: unknown,
    context: { provider?: OAuthProvider; fallbackTarget?: AuthUiError["target"] },
  ) => AuthUiError;
};

/**
 * Motion and layout contract consumed by AuthDrawer and the motion studio.
 */
export type MotionSettings = {
  upwardResistance: number;
  downwardThreshold: number;
  velocityThreshold: number;
  snapStiffness: number;
  snapDamping: number;
  snapMass: number;
  displayMode: DrawerMode;
  desktopWidth: string;
  desktopPosition: DrawerPosition;
  entryDuration: number;
  entryDelay: number;
  entryScale: number;
  entryY: number;
  entryEase: string;
  exitDuration: number;
  exitDelay: number;
  exitScale: number;
  exitY: number;
  exitEase: string;
  backdropOpacity: number;
  backdropColor: string;
  backdropBlur: number;
  backdropAngle: number;
  backdropStartColor: string;
  backdropEndColor: string;
  backdropStartPos: number;
  backdropEndPos: number;
  formPaddingTop: number;
  formPaddingBottom: number;
  formJustify: string;
  formAlign: string;
};

/**
 * Top-level configuration contract for AuthDrawer.
 * All flags are optional and resolved at the AuthDrawer boundary.
 */
export type AuthConfig = {
  providers?: OAuthProvider[];
  oauthLayout?: "row" | "column";
  allowRegister?: boolean;
  showRememberMe?: boolean;
  motionSettings?: Partial<MotionSettings>;
} & AuthHandlers;

/**
 * Fully resolved config used inside the drawer after defaults merge.
 */
export type ResolvedAuthConfig = Omit<
  Required<AuthConfig>,
  "motionSettings"
> & {
  motionSettings: MotionSettings;
};

/**
 * OAuth provider registry entry used by the button group.
 */
export type ProviderDef = {
  id: OAuthProvider;
  label: string;
  icon: ComponentType;
};
