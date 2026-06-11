import type { PropDef } from "./types";

export const SUCCESS_CONFIG_PROPS: PropDef[] = [
  {
    name: "enabled",
    type: "boolean",
    default: "true",
    description:
      "Show the success commit state after a successful sign-in, sign-up, or OAuth action.",
  },
  {
    name: "minVisibleMs",
    type: "number",
    default: "650",
    description:
      "Minimum time the success state stays visible before the drawer closes once the session is ready.",
  },
  {
    name: "maxVisibleMs",
    type: "number",
    default: "3500",
    description:
      "Maximum time the drawer will hold the success state before closing, even if the session is slow to settle.",
  },
  {
    name: "messages.signIn",
    type: "string",
    default: '"Signed in"',
    description: "Success text for a completed sign-in action.",
  },
  {
    name: "messages.signUp",
    type: "string",
    default: '"Account created"',
    description: "Success text for a completed sign-up action.",
  },
  {
    name: "messages.oauth",
    type: "string",
    default: '"Signed in with provider"',
    description: "Success text for a completed OAuth action.",
  },
  {
    name: "footer",
    type: "ReactNode",
    description:
      "Optional custom success footer. Replaces the default success message when provided.",
  },
];
