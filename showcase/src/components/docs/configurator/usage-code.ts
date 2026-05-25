import {
  type AuthConfigGroup,
  type DrawerMode,
  type MotionSettings,
  type ResolvedAuthCopyConfig,
} from "@/components/auth/auth-drawer";
import {
  buildCopyLines,
  CONFIGURATOR_DEFAULTS,
  type BackdropState,
} from "./helpers";

export function buildUsageCode({
  mode,
  auth,
  copy,
  backdrop,
  motion,
}: {
  mode: DrawerMode;
  auth: AuthConfigGroup;
  copy: ResolvedAuthCopyConfig;
  backdrop: BackdropState;
  motion: MotionSettings;
}) {
  const motionLines: string[] = [`displayMode: "${mode}"`];
  if (motion.desktopWidth !== CONFIGURATOR_DEFAULTS.motion.desktopWidth)
    motionLines.push(`desktopWidth: "${motion.desktopWidth}"`);
  if (motion.entryDuration !== CONFIGURATOR_DEFAULTS.motion.entryDuration)
    motionLines.push(`entryDuration: ${motion.entryDuration}`);
  if (motion.exitDuration !== CONFIGURATOR_DEFAULTS.motion.exitDuration)
    motionLines.push(`exitDuration: ${motion.exitDuration}`);
  if (motion.entryEase !== CONFIGURATOR_DEFAULTS.motion.entryEase)
    motionLines.push(`entryEase: "${motion.entryEase}"`);
  if (motion.exitEase !== CONFIGURATOR_DEFAULTS.motion.exitEase)
    motionLines.push(`exitEase: "${motion.exitEase}"`);
  if (motion.entryScale !== CONFIGURATOR_DEFAULTS.motion.entryScale)
    motionLines.push(`entryScale: ${motion.entryScale}`);
  if (motion.exitScale !== CONFIGURATOR_DEFAULTS.motion.exitScale)
    motionLines.push(`exitScale: ${motion.exitScale}`);
  if (motion.entryY !== CONFIGURATOR_DEFAULTS.motion.entryY)
    motionLines.push(`entryY: ${motion.entryY}`);
  if (motion.exitY !== CONFIGURATOR_DEFAULTS.motion.exitY)
    motionLines.push(`exitY: ${motion.exitY}`);
  if (motion.entryDelay !== CONFIGURATOR_DEFAULTS.motion.entryDelay)
    motionLines.push(`entryDelay: ${motion.entryDelay}`);
  if (motion.exitDelay !== CONFIGURATOR_DEFAULTS.motion.exitDelay)
    motionLines.push(`exitDelay: ${motion.exitDelay}`);
  if (motion.upwardResistance !== CONFIGURATOR_DEFAULTS.motion.upwardResistance)
    motionLines.push(`upwardResistance: ${motion.upwardResistance}`);
  if (motion.downwardThreshold !== CONFIGURATOR_DEFAULTS.motion.downwardThreshold)
    motionLines.push(`downwardThreshold: ${motion.downwardThreshold}`);
  if (motion.velocityThreshold !== CONFIGURATOR_DEFAULTS.motion.velocityThreshold)
    motionLines.push(`velocityThreshold: ${motion.velocityThreshold}`);
  if (motion.snapStiffness !== CONFIGURATOR_DEFAULTS.motion.snapStiffness)
    motionLines.push(`snapStiffness: ${motion.snapStiffness}`);
  if (motion.snapDamping !== CONFIGURATOR_DEFAULTS.motion.snapDamping)
    motionLines.push(`snapDamping: ${motion.snapDamping}`);
  if (motion.snapMass !== CONFIGURATOR_DEFAULTS.motion.snapMass)
    motionLines.push(`snapMass: ${motion.snapMass}`);
  if (motion.formPaddingTop !== CONFIGURATOR_DEFAULTS.motion.formPaddingTop)
    motionLines.push(`formPaddingTop: ${motion.formPaddingTop}`);
  if (motion.formPaddingBottom !== CONFIGURATOR_DEFAULTS.motion.formPaddingBottom)
    motionLines.push(`formPaddingBottom: ${motion.formPaddingBottom}`);
  if (motion.formJustify !== CONFIGURATOR_DEFAULTS.motion.formJustify)
    motionLines.push(`formJustify: "${motion.formJustify}"`);
  if (motion.formAlign !== CONFIGURATOR_DEFAULTS.motion.formAlign)
    motionLines.push(`formAlign: "${motion.formAlign}"`);
  if (motion.backdropOpacity !== CONFIGURATOR_DEFAULTS.motion.backdropOpacity)
    motionLines.push(`backdropOpacity: ${motion.backdropOpacity}`);
  if (motion.backdropBlur !== CONFIGURATOR_DEFAULTS.motion.backdropBlur)
    motionLines.push(`backdropBlur: ${motion.backdropBlur}`);
  if (motion.backdropAngle !== CONFIGURATOR_DEFAULTS.motion.backdropAngle)
    motionLines.push(`backdropAngle: ${motion.backdropAngle}`);
  if (motion.backdropStartPos !== CONFIGURATOR_DEFAULTS.motion.backdropStartPos)
    motionLines.push(`backdropStartPos: ${motion.backdropStartPos}`);
  if (motion.backdropEndPos !== CONFIGURATOR_DEFAULTS.motion.backdropEndPos)
    motionLines.push(`backdropEndPos: ${motion.backdropEndPos}`);

  const authLines: string[] = [
    `providers: [${(auth.providers ?? []).map((p) => `"${p}"`).join(", ")}]`,
  ];
  if (auth.oauthLayout !== CONFIGURATOR_DEFAULTS.auth.oauthLayout)
    authLines.push(`oauthLayout: "${auth.oauthLayout}"`);

  const overflowLines: string[] = [];
  if (
    (auth.oauthOverflow?.visibleCount ??
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount) !==
    CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount
  ) {
    overflowLines.push(
      `visibleCount: ${auth.oauthOverflow?.visibleCount ?? CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount}`,
    );
  }
  if (
    (auth.oauthOverflow?.showPreviewIcons ??
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons) !==
    CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons
  ) {
    overflowLines.push(
      `showPreviewIcons: ${auth.oauthOverflow?.showPreviewIcons ?? CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons}`,
    );
  }
  if (overflowLines.length > 0) {
    authLines.push(`oauthOverflow: { ${overflowLines.join(", ")} }`);
  }

  if (auth.allowRegister !== CONFIGURATOR_DEFAULTS.auth.allowRegister)
    authLines.push(`allowRegister: ${auth.allowRegister}`);
  if (auth.showRememberMe !== CONFIGURATOR_DEFAULTS.auth.showRememberMe)
    authLines.push(`showRememberMe: ${auth.showRememberMe}`);
  if (auth.initialMode !== CONFIGURATOR_DEFAULTS.auth.initialMode)
    authLines.push(`initialMode: "${auth.initialMode}"`);
  if (auth.showForgotPassword !== CONFIGURATOR_DEFAULTS.auth.showForgotPassword)
    authLines.push(`showForgotPassword: ${auth.showForgotPassword}`);
  if (auth.showLivePasswordMatch !== CONFIGURATOR_DEFAULTS.auth.showLivePasswordMatch)
    authLines.push(`showLivePasswordMatch: ${auth.showLivePasswordMatch}`);
  if (auth.showFooter !== CONFIGURATOR_DEFAULTS.auth.showFooter)
    authLines.push(`showFooter: ${auth.showFooter}`);

  const copyLines = buildCopyLines(copy);
  const copyBlock =
    copyLines.length > 0
      ? `copy: {\n        ${copyLines.join(",\n        ")}\n      },`
      : null;

  return `<AuthDrawer
  config={{
    ui: {
      presentation: { variant: "${mode}" },
      auth: {
        ${authLines.join(",\n        ")}
      },${copyBlock ? `\n      ${copyBlock}` : ""}
      motion: {
        ${motionLines.join(",\n        ")}
      },
      visual: {
        backdrop: {
          color: "${backdrop.color}",
          opacity: ${backdrop.opacity},
          blur: ${backdrop.blur},
          gradient: {
            angle: ${backdrop.gradient.angle},
            from: "${backdrop.gradient.from}",
            to: "${backdrop.gradient.to}",
            fromPos: ${backdrop.gradient.fromPos},
            toPos: ${backdrop.gradient.toPos},
          },
        },
      },
    },
    onCredential: async (input) => signIn(input),
    onOAuth: async (provider) => signInWithOAuth(provider),
  }}
/>`;
}
