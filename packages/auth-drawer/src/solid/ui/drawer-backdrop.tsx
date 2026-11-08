import type { MotionSettings } from "@remcostoeten/auth-drawer/core";

type Props = {
  settings: MotionSettings;
  state: "open" | "closing";
  onClick?: () => void;
};

function gradientOf(settings: MotionSettings) {
  return `linear-gradient(${settings.backdropAngle}deg, ${settings.backdropStartColor} ${settings.backdropStartPos}%, ${settings.backdropEndColor} ${settings.backdropEndPos}%)`;
}

export function DrawerBackdrop(props: Props) {
  const blur = () => `blur(${props.settings.backdropBlur}px)`;

  return (
    <div
      class="auth-drawer-backdrop absolute inset-0"
      data-state={props.state}
      style={{
        background: gradientOf(props.settings),
        "backdrop-filter": blur(),
        "-webkit-backdrop-filter": blur(),
        "--auth-backdrop-opacity": props.settings.backdropOpacity,
      }}
      onClick={() => props.onClick?.()}
      aria-hidden="true"
    />
  );
}
