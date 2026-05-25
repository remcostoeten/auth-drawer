import type { PropDef } from "./types";

export const COPY_CONFIG_PROPS: PropDef[] = [
  {
    name: "login.title",
    type: "string",
    default: '"Welcome back"',
    description: "Heading shown on the login form.",
  },
  {
    name: "login.subtitle",
    type: "string",
    default:
      '"Sign in to sync your notes anywhere while keeping local-first saves intact"',
    description: "Supporting copy below the login heading.",
  },
  {
    name: "login.submit",
    type: "string",
    default: '"Sign in"',
    description: "Primary submit button label on login.",
  },
  {
    name: "login.switchPrompt",
    type: "string",
    default: `"Don't have an account?"`,
    description: "Prompt before the register switch action on login.",
  },
  {
    name: "login.switchAction",
    type: "string",
    default: '"Register"',
    description: "Register switch action label on login.",
  },
  {
    name: "register.title",
    type: "string",
    default: '"Create your account"',
    description: "Heading shown on the register form.",
  },
  {
    name: "register.subtitle",
    type: "string",
    default:
      '"Create an account to back up and sync your notes across devices"',
    description: "Supporting copy below the register heading.",
  },
  {
    name: "register.submit",
    type: "string",
    default: '"Create account"',
    description: "Primary submit button label on register.",
  },
  {
    name: "register.switchPrompt",
    type: "string",
    default: '"Already have an account?"',
    description: "Prompt before the login switch action on register.",
  },
  {
    name: "register.switchAction",
    type: "string",
    default: '"Sign in"',
    description: "Login switch action label on register.",
  },
  {
    name: "fields.email.label",
    type: "string",
    default: '"Email"',
    description: "Accessible label for the email field.",
  },
  {
    name: "fields.email.placeholder",
    type: "string",
    default: '"Email"',
    description: "Placeholder for the email field.",
  },
  {
    name: "fields.password.label",
    type: "string",
    default: '"Password"',
    description: "Accessible label for the password field.",
  },
  {
    name: "fields.password.placeholder",
    type: "string",
    default: '"Password"',
    description: "Placeholder for the password field.",
  },
  {
    name: "fields.confirmPassword.label",
    type: "string",
    default: '"Confirm password"',
    description: "Accessible label for the confirm-password field.",
  },
  {
    name: "fields.confirmPassword.placeholder",
    type: "string",
    default: '"Confirm password"',
    description: "Placeholder for the confirm-password field.",
  },
  {
    name: "passwordToggle.show",
    type: "string",
    default: '"Show password"',
    description: "Aria label when the password is hidden.",
  },
  {
    name: "passwordToggle.hide",
    type: "string",
    default: '"Hide password"',
    description: "Aria label when the password is visible.",
  },
  {
    name: "forgotPassword.label",
    type: "string",
    default: '"Forgot password?"',
    description: "Forgot-password action label.",
  },
  {
    name: "forgotPassword.loading",
    type: "string",
    default: '"Sending..."',
    description: "Forgot-password action label while the request is in flight.",
  },
  {
    name: "forgotPassword.successNotice",
    type: "string",
    default: '"If an account exists, password reset instructions were sent."',
    description: "Success notice shown after a forgot-password request.",
  },
  {
    name: "rememberMe.label",
    type: "string",
    default: '"Remember me"',
    description: "Remember-me checkbox label.",
  },
  {
    name: "footer.segments",
    type: "AuthFooterSegment[]",
    default: "DEFAULT_LEGAL_FOOTER_SEGMENTS",
    description:
      "Footer as text and link segments. The default is a legal terms/privacy example — swap segments or use ui.footer for full control.",
  },
  {
    name: "trigger.title",
    type: "string",
    default: '"Account"',
    description: "Primary label on the built-in trigger button.",
  },
  {
    name: "trigger.open",
    type: "string",
    default: '"Open"',
    description: "Secondary label when the built-in trigger is closed.",
  },
  {
    name: "trigger.close",
    type: "string",
    default: '"Close"',
    description: "Secondary label when the built-in trigger is open.",
  },
  {
    name: "close.ariaLabel",
    type: "string",
    default: '"Close sign in dialog"',
    description: "Accessible label for the drawer close button.",
  },
  {
    name: "validation.emailRequired",
    type: "string",
    default: '"Enter your email address."',
    description: "Client validation message when email is empty.",
  },
  {
    name: "validation.passwordRequired",
    type: "string",
    default: '"Enter your password."',
    description: "Client validation message when password is empty.",
  },
  {
    name: "validation.confirmRequired",
    type: "string",
    default: '"Confirm your password."',
    description: "Client validation message when confirm password is empty.",
  },
  {
    name: "validation.passwordsMatch",
    type: "string",
    default: '"Passwords match."',
    description: "Live register feedback when passwords match.",
  },
  {
    name: "validation.passwordsMismatch",
    type: "string",
    default: '"Passwords do not match."',
    description: "Live register feedback when passwords differ.",
  },
  {
    name: "errors.*",
    type: "Partial<Record<AuthErrorCode, string>>",
    description:
      "Override normalized auth error messages by error code when using the default normalizeError handler.",
  },
];
