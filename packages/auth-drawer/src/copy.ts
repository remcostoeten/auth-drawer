import type { AuthErrorCode } from "./auth-errors";

export type AuthOAuthProvider = "github" | "google";

export type AuthFooterTextSegment = {
  type: "text";
  value: string;
};

export type AuthFooterLinkSegment = {
  type: "link";
  label: string;
  href: string;
  target?: "_blank" | "_self";
};

export type AuthFooterSegment = AuthFooterTextSegment | AuthFooterLinkSegment;

export type AuthFooterCopy = {
  segments?: AuthFooterSegment[];
};

export type AuthFormCopy = {
  title?: string;
  subtitle?: string;
  submit?: string;
  switchPrompt?: string;
  switchAction?: string;
};

export type AuthFieldCopy = {
  label?: string;
  placeholder?: string;
};

export type AuthFieldsCopy = {
  email?: AuthFieldCopy;
  password?: AuthFieldCopy;
  confirmPassword?: AuthFieldCopy;
};

export type AuthOAuthCopy = {
  divider?: string;
  continueWith?: string;
  providers?: Partial<Record<AuthOAuthProvider, string>>;
};

export type AuthForgotPasswordCopy = {
  label?: string;
  loading?: string;
  successNotice?: string;
};

export type AuthRememberMeCopy = {
  label?: string;
};

export type AuthTriggerCopy = {
  title?: string;
  open?: string;
  close?: string;
};

export type AuthCloseCopy = {
  ariaLabel?: string;
};

export type AuthPasswordToggleCopy = {
  show?: string;
  hide?: string;
};

export type AuthValidationCopy = {
  emailRequired?: string;
  passwordRequired?: string;
  confirmRequired?: string;
  passwordsMatch?: string;
  passwordsMismatch?: string;
};

export type AuthCopyConfig = {
  login?: AuthFormCopy;
  register?: AuthFormCopy;
  fields?: AuthFieldsCopy;
  passwordToggle?: AuthPasswordToggleCopy;
  oauth?: AuthOAuthCopy;
  forgotPassword?: AuthForgotPasswordCopy;
  rememberMe?: AuthRememberMeCopy;
  footer?: AuthFooterCopy;
  trigger?: AuthTriggerCopy;
  close?: AuthCloseCopy;
  validation?: AuthValidationCopy;
  errors?: Partial<Record<AuthErrorCode, string>>;
};

export type ResolvedAuthFormCopy = Required<AuthFormCopy>;
export type ResolvedAuthFieldCopy = Required<AuthFieldCopy>;
export type ResolvedAuthFieldsCopy = {
  email: ResolvedAuthFieldCopy;
  password: ResolvedAuthFieldCopy;
  confirmPassword: ResolvedAuthFieldCopy;
};
export type ResolvedAuthOAuthCopy = Required<Omit<AuthOAuthCopy, "providers">> & {
  providers: Record<AuthOAuthProvider, string>;
};
export type ResolvedAuthForgotPasswordCopy = Required<AuthForgotPasswordCopy>;
export type ResolvedAuthRememberMeCopy = Required<AuthRememberMeCopy>;
export type ResolvedAuthFooterCopy = Required<AuthFooterCopy>;
export type ResolvedAuthTriggerCopy = Required<AuthTriggerCopy>;
export type ResolvedAuthCloseCopy = Required<AuthCloseCopy>;
export type ResolvedAuthPasswordToggleCopy = Required<AuthPasswordToggleCopy>;
export type ResolvedAuthValidationCopy = Required<AuthValidationCopy>;

export type ResolvedAuthCopyConfig = {
  login: ResolvedAuthFormCopy;
  register: ResolvedAuthFormCopy;
  fields: ResolvedAuthFieldsCopy;
  passwordToggle: ResolvedAuthPasswordToggleCopy;
  oauth: ResolvedAuthOAuthCopy;
  forgotPassword: ResolvedAuthForgotPasswordCopy;
  rememberMe: ResolvedAuthRememberMeCopy;
  footer: ResolvedAuthFooterCopy;
  trigger: ResolvedAuthTriggerCopy;
  close: ResolvedAuthCloseCopy;
  validation: ResolvedAuthValidationCopy;
  errors: Record<AuthErrorCode, string>;
};

const DEFAULT_ERROR_COPY: Record<AuthErrorCode, string> = {
  required: "This field is required.",
  invalid_email: "Enter a valid email address.",
  weak_password: "Use at least 8 characters.",
  password_mismatch: "Passwords do not match.",
  invalid_credentials: "Email or password is incorrect.",
  email_not_verified: "Verify your email before signing in.",
  email_taken: "An account with this email already exists.",
  user_not_found: "No account exists for this email.",
  provider_unavailable: "This sign-in provider is unavailable.",
  oauth_cancelled: "Sign-in was cancelled.",
  popup_blocked: "Allow popups and try again.",
  rate_limited: "Too many attempts. Wait a moment and try again.",
  network_error: "Could not connect. Check your connection and try again.",
  server_error: "The auth service is unavailable. Try again shortly.",
  unknown: "Something went wrong. Try again.",
};

/** Default legal-style footer — replace segments or pass ui.footer for anything else. */
export const DEFAULT_LEGAL_FOOTER_SEGMENTS: AuthFooterSegment[] = [
  {
    type: "text",
    value: "By creating an account or signing in, you agree to our ",
  },
  { type: "link", label: "Terms", href: "#" },
  { type: "text", value: " and " },
  { type: "link", label: "Privacy Policy", href: "#" },
  { type: "text", value: "." },
];

export const DEFAULT_COPY: ResolvedAuthCopyConfig = {
  login: {
    title: "Welcome back",
    subtitle:
      "Sign in to sync your notes anywhere while keeping local-first saves intact",
    submit: "Sign in",
    switchPrompt: "Don't have an account?",
    switchAction: "Register",
  },
  register: {
    title: "Create your account",
    subtitle: "Create an account to back up and sync your notes across devices",
    submit: "Create account",
    switchPrompt: "Already have an account?",
    switchAction: "Sign in",
  },
  fields: {
    email: { label: "Email", placeholder: "Email" },
    password: { label: "Password", placeholder: "Password" },
    confirmPassword: {
      label: "Confirm password",
      placeholder: "Confirm password",
    },
  },
  passwordToggle: {
    show: "Show password",
    hide: "Hide password",
  },
  oauth: {
    divider: "Or continue with email",
    continueWith: "Continue with {{provider}}",
    providers: {
      github: "GitHub",
      google: "Google",
    },
  },
  forgotPassword: {
    label: "Forgot password?",
    loading: "Sending...",
    successNotice: "If an account exists, password reset instructions were sent.",
  },
  rememberMe: {
    label: "Remember me",
  },
  footer: {
    segments: DEFAULT_LEGAL_FOOTER_SEGMENTS,
  },
  trigger: {
    title: "Account",
    open: "Open",
    close: "Close",
  },
  close: {
    ariaLabel: "Close sign in dialog",
  },
  validation: {
    emailRequired: "Enter your email address.",
    passwordRequired: "Enter your password.",
    confirmRequired: "Confirm your password.",
    passwordsMatch: "Passwords match.",
    passwordsMismatch: "Passwords do not match.",
  },
  errors: DEFAULT_ERROR_COPY,
};

export function formatCopy(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }, template);
}

export function resolveCopyGroup(config?: {
  ui?: {
    copy?: AuthCopyConfig;
  };
}): ResolvedAuthCopyConfig {
  const copy = config?.ui?.copy ?? {};
  const defaults = DEFAULT_COPY;

  return {
    login: { ...defaults.login, ...copy.login },
    register: { ...defaults.register, ...copy.register },
    fields: {
      email: { ...defaults.fields.email, ...copy.fields?.email },
      password: { ...defaults.fields.password, ...copy.fields?.password },
      confirmPassword: {
        ...defaults.fields.confirmPassword,
        ...copy.fields?.confirmPassword,
      },
    },
    passwordToggle: { ...defaults.passwordToggle, ...copy.passwordToggle },
    oauth: {
      divider: copy.oauth?.divider ?? defaults.oauth.divider,
      continueWith: copy.oauth?.continueWith ?? defaults.oauth.continueWith,
      providers: {
        github: copy.oauth?.providers?.github ?? defaults.oauth.providers.github,
        google: copy.oauth?.providers?.google ?? defaults.oauth.providers.google,
      },
    },
    forgotPassword: { ...defaults.forgotPassword, ...copy.forgotPassword },
    rememberMe: { ...defaults.rememberMe, ...copy.rememberMe },
    footer: {
      segments: copy.footer?.segments ?? defaults.footer.segments,
    },
    trigger: { ...defaults.trigger, ...copy.trigger },
    close: { ...defaults.close, ...copy.close },
    validation: { ...defaults.validation, ...copy.validation },
    errors: { ...defaults.errors, ...copy.errors },
  };
}
