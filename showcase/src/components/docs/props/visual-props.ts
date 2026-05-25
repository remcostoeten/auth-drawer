import type { PropDef } from "./types";

export const VISUAL_PROPS: PropDef[] = [
  {
    name: "backdrop.color",
    type: "string",
    default: '"#070708"',
    description: "Base fill color of the backdrop overlay.",
  },
  {
    name: "backdrop.opacity",
    type: "number",
    default: "0.85",
    description: "Opacity of the backdrop fill (0–1).",
  },
  {
    name: "backdrop.blur",
    type: "number",
    default: "6",
    description: "Backdrop-filter blur radius in pixels.",
  },
  {
    name: "backdrop.gradient.angle",
    type: "number",
    default: "180",
    description: "CSS linear-gradient angle in degrees.",
  },
  {
    name: "backdrop.gradient.from",
    type: "string",
    default: '"transparent"',
    description: "Gradient start color.",
  },
  {
    name: "backdrop.gradient.to",
    type: "string",
    default: '"#070708"',
    description: "Gradient end color.",
  },
  {
    name: "backdrop.gradient.fromPos",
    type: "number",
    default: "100",
    description: "Gradient start stop as a percentage (0–100).",
  },
  {
    name: "backdrop.gradient.toPos",
    type: "number",
    default: "100",
    description: "Gradient end stop as a percentage (0–100).",
  },
];

export const MOTION_DRAG_PROPS: PropDef[] = [
  {
    name: "upwardResistance",
    type: "number",
    default: "0.15",
    description:
      "Resistance factor applied when dragging upward past the natural top. Lower = more rubber-band.",
  },
  {
    name: "downwardThreshold",
    type: "number",
    default: "0.25",
    description:
      "Fraction of drawer height that must be dragged downward to trigger a close snap.",
  },
  {
    name: "velocityThreshold",
    type: "number",
    default: "500",
    description:
      "Pointer velocity (px/s) that triggers a close snap regardless of drag distance.",
  },
  {
    name: "snapStiffness",
    type: "number",
    default: "850",
    description:
      "Spring stiffness for the snap-back animation. Higher = snappier.",
  },
  {
    name: "snapDamping",
    type: "number",
    default: "14",
    description:
      "Spring damping for the snap-back animation. Higher = less oscillation.",
  },
  {
    name: "snapMass",
    type: "number",
    default: "0.8",
    description:
      "Simulated mass for the snap spring. Affects how much momentum carries through.",
  },
];

export const MOTION_LAYOUT_PROPS: PropDef[] = [
  {
    name: "displayMode",
    type: '"drawer" | "modal"',
    default: '"drawer"',
    description:
      "Controls how the surface is positioned on desktop — bottom-sheet drawer or centred modal.",
  },
  {
    name: "desktopWidth",
    type: "string",
    default: '"448px"',
    description: "CSS width of the auth surface on desktop viewports.",
  },
  {
    name: "desktopPosition",
    type: '"center" | "left" | "right"',
    default: '"center"',
    description: "Horizontal alignment of the surface on desktop.",
  },
  {
    name: "formPaddingTop",
    type: "number",
    default: "0",
    description: "Extra top padding inside the form panel (px).",
  },
  {
    name: "formPaddingBottom",
    type: "number",
    default: "0",
    description:
      "Extra bottom padding inside the form panel (px). Useful when a host needs to bias the form upward.",
  },
  {
    name: "formJustify",
    type: "string",
    default: '"center"',
    description: "CSS justify-content value for the form container.",
  },
  {
    name: "formAlign",
    type: "string",
    default: '"center"',
    description: "CSS align-items value for the form container.",
  },
];

export const MOTION_ENTRY_EXIT_PROPS: PropDef[] = [
  {
    name: "entryDuration",
    type: "number",
    default: "0.9",
    description: "Duration of the open animation in seconds.",
  },
  {
    name: "entryDelay",
    type: "number",
    default: "0",
    description: "Delay before the open animation starts (seconds).",
  },
  {
    name: "entryScale",
    type: "number",
    default: "0.95",
    description:
      "Initial scale of the surface at the start of the open animation.",
  },
  {
    name: "entryY",
    type: "number",
    default: "20",
    description: "Initial Y offset (px) at the start of the open animation.",
  },
  {
    name: "entryEase",
    type: "string",
    default: '"[0.23,1,0.32,1]"',
    description:
      "Easing for the open animation — CSS easing string or cubic-bezier array literal.",
  },
  {
    name: "exitDuration",
    type: "number",
    default: "0.3",
    description: "Duration of the close animation in seconds.",
  },
  {
    name: "exitDelay",
    type: "number",
    default: "0",
    description: "Delay before the close animation starts (seconds).",
  },
  {
    name: "exitScale",
    type: "number",
    default: "0.95",
    description:
      "Final scale of the surface at the end of the close animation.",
  },
  {
    name: "exitY",
    type: "number",
    default: "10",
    description: "Final Y offset (px) at the end of the close animation.",
  },
  {
    name: "exitEase",
    type: "string",
    default: '"easeIn"',
    description: "Easing for the close animation.",
  },
];

export const MOTION_BACKDROP_PROPS: PropDef[] = [
  {
    name: "backdropOpacity",
    type: "number",
    default: "0.85",
    description: "Target opacity of the animated backdrop (0–1).",
  },
  {
    name: "backdropColor",
    type: "string",
    default: '"#070708"',
    description: "Backdrop fill color used by the motion layer.",
  },
  {
    name: "backdropBlur",
    type: "number",
    default: "6",
    description: "Backdrop blur radius (px) applied via the motion layer.",
  },
  {
    name: "backdropAngle",
    type: "number",
    default: "180",
    description: "Gradient angle (degrees) on the motion backdrop.",
  },
  {
    name: "backdropStartColor",
    type: "string",
    default: '"transparent"',
    description: "Gradient start color on the motion backdrop.",
  },
  {
    name: "backdropEndColor",
    type: "string",
    default: '"#070708"',
    description: "Gradient end color on the motion backdrop.",
  },
  {
    name: "backdropStartPos",
    type: "number",
    default: "100",
    description: "Gradient start stop (%) on the motion backdrop.",
  },
  {
    name: "backdropEndPos",
    type: "number",
    default: "100",
    description: "Gradient end stop (%) on the motion backdrop.",
  },
];
