import type { PropDef } from "./types";

export const OAUTH_AUTH_PROPS: PropDef[] = [
  {
    name: "providers",
    type: "OAuthProvider[]",
    default: '["github", "google"]',
    description:
      "Built-in provider ids in display order. Pass an empty array to hide OAuth entirely. See the OAuth docs section for overflow behaviour.",
  },
  {
    name: "oauthLayout",
    type: '"row" | "column"',
    default: '"column"',
    description: "Stack OAuth buttons vertically or side-by-side.",
  },
  {
    name: "oauthOverflow.visibleCount",
    type: "number",
    default: "2",
    description:
      "How many OAuth buttons stay visible before the disclosure appears. Minimum 1.",
  },
  {
    name: "oauthOverflow.showPreviewIcons",
    type: "boolean",
    default: "true",
    description:
      "Show stacked icon previews for hidden providers on the disclosure trigger. Set false for label and chevron only.",
  },
];

export const OAUTH_COPY_PROPS: PropDef[] = [
  {
    name: "oauth.divider",
    type: "string",
    default: '"Or continue with email"',
    description: "Separator copy between OAuth buttons and the email form.",
  },
  {
    name: "oauth.continueWith",
    type: "string",
    default: '"Continue with {{provider}}"',
    description:
      "OAuth button label template. Use {{provider}} for the provider name.",
  },
  {
    name: "oauth.providers.github",
    type: "string",
    default: '"GitHub"',
    description: "Display name used for GitHub in OAuth labels.",
  },
  {
    name: "oauth.providers.google",
    type: "string",
    default: '"Google"',
    description: "Display name used for Google in OAuth labels.",
  },
  {
    name: "oauth.providers.apple",
    type: "string",
    default: '"Apple"',
    description: "Display name used for Apple in OAuth labels.",
  },
  {
    name: "oauth.providers.discord",
    type: "string",
    default: '"Discord"',
    description: "Display name used for Discord in OAuth labels.",
  },
  {
    name: "oauth.providers.tiktok",
    type: "string",
    default: '"TikTok"',
    description: "Display name used for TikTok in OAuth labels.",
  },
  {
    name: "oauth.showAllSocial",
    type: "string",
    default: '"Show all social methods"',
    description:
      "Disclosure label when extra OAuth providers are collapsed (icon preview + chevron, not a line separator).",
  },
  {
    name: "oauth.hideAllSocial",
    type: "string",
    default: '"Show fewer social methods"',
    description: "Toggle label when extra OAuth providers are expanded.",
  },
];

export const AUTH_CONFIG_GROUP_PROPS: PropDef[] = [
  {
    name: "allowRegister",
    type: "boolean",
    default: "true",
    description: "Show the register tab and sign-up flow.",
  },
  {
    name: "showRememberMe",
    type: "boolean",
    default: "true",
    description: "Render the remember-me checkbox on login.",
  },
  {
    name: "initialMode",
    type: '"login" | "register"',
    default: '"login"',
    description: "Which form tab is active when the drawer first opens.",
  },
  {
    name: "showForgotPassword",
    type: "boolean",
    default: "true",
    description: "Show the forgot-password link below the password field.",
  },
  {
    name: "showLivePasswordMatch",
    type: "boolean",
    default: "true",
    description: "Show real-time password match feedback on the register form.",
  },
  {
    name: "showFooter",
    type: "boolean",
    default: "true",
    description:
      "Show the footer below the form. Pass ui.footer for a fully custom React footer.",
  },
  {
    name: "emailAutocomplete.enabled",
    type: "boolean",
    default: "true",
    description:
      "Toggle inline email domain completion. When enabled, typing @ suggests common domains. Set to false to disable entirely.",
  },
  {
    name: "emailAutocomplete.domains",
    type: "string[]",
    default: '["gmail.com", "outlook.com", ...]',
    description:
      "Custom domain list for email autocomplete suggestions. Falls back to built-in defaults (gmail, outlook, hotmail, icloud, yahoo) when omitted.",
  },
];
