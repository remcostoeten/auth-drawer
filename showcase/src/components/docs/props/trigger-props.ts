import type { PropDef } from "./types";

export const TRIGGER_POLICY_PROPS: PropDef[] = [
  {
    name: "once",
    type: "boolean",
    default: "false",
    description:
      "Fire at most once per scope bucket. Scroll defaults to true when omitted.",
  },
  {
    name: "cooldownMs",
    type: "number",
    description: "Minimum milliseconds between firings for the same trigger key.",
  },
  {
    name: "scope",
    type: '"session" | "day" | "week" | "install"',
    default: '"session"',
    description:
      "Eligibility bucket for once, cooldown, every, and sampleRate. session uses in-memory storage; day, week, and install persist in localStorage.",
  },
  {
    name: "every",
    type: "number",
    description: "Only fire on every Nth matching event (for example, every: 3 fires on the 3rd, 6th, …).",
  },
  {
    name: "sampleRate",
    type: "number",
    description:
      "Random gate between 0 and 1. The trigger fires only when a random draw passes this check.",
  },
];

export const PAGE_LOAD_TRIGGER_PROPS: PropDef[] = [
  {
    name: "triggers.pageLoad",
    type: "PageLoadTriggerConfig",
    description:
      "Opens the auth surface after mount. AuthDrawer emits a pageLoad event automatically; the store applies policy before opening.",
  },
  {
    name: "pageLoad.delayMs",
    type: "number",
    default: "0",
    description: "Delay in milliseconds before emitting the mount pageLoad event.",
  },
  ...TRIGGER_POLICY_PROPS.map((prop) => ({
    ...prop,
    name: `pageLoad.${prop.name}`,
  })),
];

export const SCROLL_OPEN_TRIGGER_PROPS: PropDef[] = [
  {
    name: "triggers.scrollOpen",
    type: "ScrollOpenTriggerConfig",
    description:
      "Opens when scroll progress crosses a threshold. Your host app must emit scrollOpen events — typically via useScrollOpenTrigger.",
  },
  {
    name: "scrollOpen.threshold",
    type: "number",
    default: "0.25",
    description:
      "Normalized scroll progress (0 = top, 1 = bottom) required before the trigger can fire.",
  },
  {
    name: "scrollOpen.container",
    type: '"self" | "page"',
    default: '"self"',
    description:
      "Hint for which scroll container emitted the event. Matching is based on progress vs threshold, not container identity.",
  },
  ...TRIGGER_POLICY_PROPS.map((prop) => ({
    ...prop,
    name: `scrollOpen.${prop.name}`,
    default: prop.name === "once" ? "true" : prop.default,
  })),
];

export const CLICK_TRIGGER_PROPS: PropDef[] = [
  {
    name: "triggers.click",
    type: "ClickTriggerConfig",
    description:
      "Opens when the user clicks a matching selector. AuthDrawer binds document listeners when selector is set.",
  },
  {
    name: "click.selector",
    type: "string",
    description: "CSS selector for the click target. Required for built-in click binding.",
  },
  {
    name: "click.event",
    type: '"click" | "pointerdown"',
    default: '"click"',
    description: "DOM event AuthDrawer listens for on document.",
  },
  ...TRIGGER_POLICY_PROPS.map((prop) => ({
    ...prop,
    name: `click.${prop.name}`,
  })),
];

export const STATE_TRIGGER_PROPS: PropDef[] = [
  {
    name: "triggers.state",
    type: "StateTriggerConfig",
    description:
      "Opens when your app emits a matching auth state event (for example after a 401 or expired session).",
  },
  {
    name: "state.state",
    type: '"denied" | "expired" | "missing"',
    description: "Auth-related state that must match the emitted event.",
  },
  ...TRIGGER_POLICY_PROPS.map((prop) => ({
    ...prop,
    name: `state.${prop.name}`,
  })),
];

export const IDLE_TRIGGER_PROPS: PropDef[] = [
  {
    name: "triggers.idle",
    type: "IdleTriggerConfig",
    description:
      "Opens after inactivity. Your host app must emit idle events when the user has been inactive for idleMs.",
  },
  {
    name: "idle.idleMs",
    type: "number",
    description: "Minimum inactivity duration in milliseconds required on emitted idle events.",
  },
  ...TRIGGER_POLICY_PROPS.map((prop) => ({
    ...prop,
    name: `idle.${prop.name}`,
  })),
];

export const CUSTOM_TRIGGER_PROPS: PropDef[] = [
  {
    name: "triggers.custom",
    type: "CustomTriggerConfig",
    description:
      "Opens on app-defined events. Emit custom events with a matching event name from anywhere in your runtime.",
  },
  {
    name: "custom.event",
    type: "string",
    description: "App-defined event name that must match the emitted custom event.",
  },
  ...TRIGGER_POLICY_PROPS.map((prop) => ({
    ...prop,
    name: `custom.${prop.name}`,
  })),
];

export const TRIGGER_STORE_PROPS: PropDef[] = [
  {
    name: "createAuthTriggerStore()",
    type: "AuthTriggerStore",
    description:
      "Creates a shared trigger bus. Pass the same instance to AuthDrawer and any code that calls emit.",
  },
  {
    name: "registerTrigger(kind, config, onFire)",
    type: "function",
    description:
      "AuthDrawer calls this internally. Advanced integrations can register additional listeners on the same store.",
  },
  {
    name: "emit(event)",
    type: "(event: AuthTriggerEvent) => void",
    description:
      "Send a trigger event into the store. The store evaluates policy and opens auth when a registered rule matches.",
  },
  {
    name: "subscribe(listener)",
    type: "(event: AuthTriggerEvent) => void",
    description: "Observe every emitted event — useful for analytics or debugging.",
  },
  {
    name: "snapshot()",
    type: "AuthTriggerStoreSnapshot",
    description: "Read seen/fire counts and timestamps for debugging or tests.",
  },
  {
    name: "clear(kind?)",
    type: "(kind?: AuthTriggerKind) => void",
    description: "Reset ledger entries for one trigger kind or all kinds.",
  },
];

export const TRIGGER_EVENT_PROPS: PropDef[] = [
  {
    name: 'kind: "pageLoad"',
    type: "AuthTriggerEvent",
    description: 'Optional source: "mount" | "manual". Emitted by AuthDrawer on mount when pageLoad is configured.',
  },
  {
    name: 'kind: "click"',
    type: "AuthTriggerEvent",
    description: "Carries selector, event, and target. Emitted by AuthDrawer when click.selector is configured.",
  },
  {
    name: 'kind: "scrollOpen"',
    type: "AuthTriggerEvent",
    description:
      "Requires progress (0–1). Emit from scroll observers or useScrollOpenTrigger. Fires when progress >= threshold.",
  },
  {
    name: 'kind: "state"',
    type: "AuthTriggerEvent",
    description:
      'Requires state: "denied" | "expired" | "missing". Emit from API clients, route guards, or session checks.',
  },
  {
    name: 'kind: "idle"',
    type: "AuthTriggerEvent",
    description: "Requires idleMs. Emit when your idle detector crosses the configured duration.",
  },
  {
    name: 'kind: "custom"',
    type: "AuthTriggerEvent",
    description: "Requires event string matching triggers.custom.event. Optional payload for host-side use.",
  },
];

export const SCROLL_HOOK_PROPS: PropDef[] = [
  {
    name: "useScrollOpenTrigger(options)",
    type: "void",
    description:
      "Observes a scroll container ref and invokes onTrigger when threshold is crossed. Pair with triggerStore.emit for scrollOpen rules.",
  },
  {
    name: "containerRef",
    type: "RefObject<HTMLElement | null>",
    description: "Scroll container to observe.",
  },
  {
    name: "onTrigger",
    type: "(progress: number) => void",
    description: "Called with normalized scroll progress when threshold is reached.",
  },
  {
    name: "threshold",
    type: "number",
    default: "0.25",
    description: "Normalized scroll progress required before onTrigger runs.",
  },
  {
    name: "once",
    type: "boolean",
    default: "true",
    description: "If true, onTrigger runs at most once per mount.",
  },
  {
    name: "enabled",
    type: "boolean",
    default: "true",
    description: "Toggle the scroll observer without unmounting the host.",
  },
];
