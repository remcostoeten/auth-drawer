import type { PropDef } from "./types";

export const AUTH_DRAWER_PROPS: PropDef[] = [
  {
    name: "adapter",
    type: "AuthAdapter",
    description:
      "Active auth adapter. The drawer routes sign-in, sign-up, forgot-password, reset-password, and OAuth through the adapter, auto-hides unsupported UI, and can request a name field for registration via adapter.requiresName.",
  },
  {
    name: "config",
    type: "AuthConfig",
    default: "DEFAULT_CONFIG",
    defaultPreview: "default-config",
    description: "Visual, behavioural, trigger, and auth routing configuration.",
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
    description: "Controlled open state. When defined, it takes precedence over provider-managed and uncontrolled state.",
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
    name: "ui.success",
    type: "AuthSuccessConfig",
    description:
      "Built-in success commit state after sign-in, sign-up, or OAuth. Controls how long the drawer stays visible before closing, plus success text and an opt-out toggle.",
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
    name: "normalizeError",
    type: "(error: unknown, context: { provider?: OAuthProvider; fallbackTarget?: AuthUiError[\"target\"] }) => AuthUiError",
    description:
      "Custom error mapper to standard AuthUiError targets.",
  },
];
