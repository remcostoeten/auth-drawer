import type { PropDef } from "./types";

export const AUTH_DRAWER_PROPS: PropDef[] = [
  {
    name: "adapter",
    type: "AuthAdapter",
    description:
      "Active auth adapter. When present, the drawer routes sign-in, sign-up, forgot-password, reset-password, and OAuth through the adapter. It also auto-hides unsupported UI (for example: register tab, forgot-password link, OAuth buttons) and can request a name field for registration via adapter.requiresName.",
  },
  {
    name: "config",
    type: "AuthConfig",
    default: "DEFAULT_CONFIG",
    defaultPreview: "default-config",
    description: "Visual, behavioural, trigger, and fallback logic configuration.",
  },
  {
    name: "hideTrigger",
    type: "boolean",
    default: "false",
    description:
      "Hides the built-in trigger button. Useful when you trigger the drawer using your own custom navbar or button.",
  },
  {
    name: "open",
    type: "boolean",
    description: "Controlled open state. When defined, the drawer operates in controlled mode, bypassing automatic trigger store bindings.",
  },
  {
    name: "defaultOpen",
    type: "boolean",
    default: "false",
    description: "Initial open state for uncontrolled mode. Ignored if open is provided.",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    description: "Called whenever the auth surface opens or closes (via drag-dismiss, backdrop click, or Escape key).",
  },
  {
    name: "triggerStore",
    type: "AuthTriggerStore",
    description: "Optional central trigger bus. Connects external/non-React code (e.g. canvas blockers, router events, third-party libraries) to the drawer.",
  },
  {
    name: "onSuccess",
    type: '(action: "signIn" | "signUp" | "signOut" | "oauth") => void',
    description: "Callback fired on any successful auth action. Perfect for custom redirects, notifications, or tracking.",
  },
  {
    name: "onError",
    type: '(error: AuthUiError, action: "signIn" | "signUp" | "signOut" | "oauth") => void',
    description: "Callback fired when any auth action fails. Useful for error logging or custom analytics.",
  },
];

export const CONFIG_PROPS: PropDef[] = [
  {
    name: "ui.auth",
    type: "AuthConfigGroup",
    description:
      "Providers, register mode, remember-me, and forgot-password controls.",
  },
  {
    name: "ui.copy",
    type: "AuthCopyConfig",
    description:
      "User-facing labels, headings, button text, validation messages, and error copy.",
  },
  {
    name: "ui.footer",
    type: "ReactNode",
    description:
      "Custom footer below the form. Overrides copy.footer segments when set.",
  },
  {
    name: "ui.presentation",
    type: "AuthPresentationConfig",
    description: "Drawer or modal presentation plus default open behaviour.",
  },
  {
    name: "ui.visual",
    type: "AuthVisualConfig",
    description: "Backdrop color, opacity, blur, and gradient treatment.",
  },
  {
    name: "ui.motion",
    type: "Partial<MotionSettings>",
    description:
      "Desktop width, position, entry timing, drag physics, and form layout.",
  },
  {
    name: "triggers",
    type: "AuthTriggerConfig",
    description:
      "pageLoad, click, scrollOpen, state, idle, or custom activation rules.",
  },
  {
    name: "onCredential",
    type: "(input: CredentialAuthInput) => Promise<void>",
    description:
      "Fallback callback receiving email/password credentials after local validation passes. Ignored when adapter is provided.",
  },
  {
    name: "onOAuth",
    type: "(provider: OAuthProvider) => Promise<void>",
    description:
      "Fallback callback receiving OAuth actions when provider buttons are clicked (ignored if adapter is provided).",
  },
  {
    name: "onForgotPassword",
    type: "(email: string) => Promise<void>",
    description:
      "Fallback callback receiving password reset requests with email input (ignored if adapter is provided).",
  },
  {
    name: "onResetPassword",
    type: "(input: ResetPasswordInput) => Promise<void>",
    description:
      "Fallback callback for setting a new password during a reset flow. Receives { newPassword }.",
  },
  {
    name: "normalizeError",
    type: "(error: unknown, context: { provider?: OAuthProvider; fallbackTarget?: AuthUiError[\"target\"] }) => AuthUiError",
    description:
      "Custom error mapper to standard AuthUiError targets. Used when no adapter is configured or when the adapter does not provide its own normalizer.",
  },
];
