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
    default: "900",
    description:
      "How long the confirmation stays visible after the session is fully loaded, before the drawer closes. Measured from when the session becomes ready, so the success state never flashes and vanishes the instant auth completes.",
  },
  {
    name: "maxVisibleMs",
    type: "number",
    default: "3500",
    description:
      "Failsafe cap: the longest the drawer waits for the session to load before closing anyway. Only applies while the session is still pending.",
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
