import {
  DEFAULT_CONFIG,
  DEFAULT_COPY,
  type AuthBackdropConfig,
  type AuthConfig,
  type AuthConfigGroup,
  type AuthCopyConfig,
  type DrawerMode,
  type MotionSettings,
  type OAuthProvider,
  type ResolvedAuthCopyConfig,
} from "@/components/auth/auth-drawer";

export const CONFIGURATOR_DEFAULTS = DEFAULT_CONFIG.ui;

export const DEFAULT_USAGE_CODE = `import { AuthDrawer } from "@remcostoeten/auth-drawer";

export function App() {
  return (
  // todo shape to api
  <AuthDrawer
      adapter={someReffToYourAuthProvider} // This is explained later on how to couple with your authentication service
      config={} // the entire modal ui, behaviour and settings can be configured in this object, when left out you'll get the default UI as shown above 'Open default drawer'
    />
  );
}`;

export type BackdropState = Required<AuthBackdropConfig> & {
  gradient: Required<NonNullable<AuthBackdropConfig["gradient"]>>;
};

export function arraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function initCopy(): ResolvedAuthCopyConfig {
  return structuredClone(DEFAULT_COPY);
}

export function buildCopyConfig(
  copy: ResolvedAuthCopyConfig,
): AuthCopyConfig | undefined {
  const defaults = DEFAULT_COPY;
  const result: AuthCopyConfig = {};

  const login = Object.fromEntries(
    Object.entries(copy.login).filter(
      ([key, value]) =>
        value !== defaults.login[key as keyof typeof defaults.login],
    ),
  );
  if (Object.keys(login).length > 0) result.login = login;

  const register = Object.fromEntries(
    Object.entries(copy.register).filter(
      ([key, value]) =>
        value !== defaults.register[key as keyof typeof defaults.register],
    ),
  );
  if (Object.keys(register).length > 0) result.register = register;

  const fields: NonNullable<AuthCopyConfig["fields"]> = {};
  (["email", "password", "confirmPassword"] as const).forEach((field) => {
    const next = Object.fromEntries(
      Object.entries(copy.fields[field]).filter(
        ([key, value]) =>
          value !==
          defaults.fields[field][
            key as keyof (typeof defaults.fields)["email"]
          ],
      ),
    );
    if (Object.keys(next).length > 0) fields[field] = next;
  });
  if (Object.keys(fields).length > 0) result.fields = fields;

  const passwordToggle = Object.fromEntries(
    Object.entries(copy.passwordToggle).filter(
      ([key, value]) =>
        value !==
        defaults.passwordToggle[key as keyof typeof defaults.passwordToggle],
    ),
  );
  if (Object.keys(passwordToggle).length > 0)
    result.passwordToggle = passwordToggle;

  const oauthProviders = Object.fromEntries(
    Object.entries(copy.oauth.providers).filter(
      ([key, value]) =>
        value !== defaults.oauth.providers[key as OAuthProvider],
    ),
  );
  const oauth: NonNullable<AuthCopyConfig["oauth"]> = {};
  if (copy.oauth.divider !== defaults.oauth.divider)
    oauth.divider = copy.oauth.divider;
  if (copy.oauth.continueWith !== defaults.oauth.continueWith) {
    oauth.continueWith = copy.oauth.continueWith;
  }
  if (copy.oauth.showAllSocial !== defaults.oauth.showAllSocial) {
    oauth.showAllSocial = copy.oauth.showAllSocial;
  }
  if (copy.oauth.hideAllSocial !== defaults.oauth.hideAllSocial) {
    oauth.hideAllSocial = copy.oauth.hideAllSocial;
  }
  if (Object.keys(oauthProviders).length > 0) oauth.providers = oauthProviders;
  if (Object.keys(oauth).length > 0) result.oauth = oauth;

  const forgotPassword = Object.fromEntries(
    Object.entries(copy.forgotPassword).filter(
      ([key, value]) =>
        value !==
        defaults.forgotPassword[key as keyof typeof defaults.forgotPassword],
    ),
  );
  if (Object.keys(forgotPassword).length > 0)
    result.forgotPassword = forgotPassword;

  if (copy.rememberMe.label !== defaults.rememberMe.label) {
    result.rememberMe = { label: copy.rememberMe.label };
  }

  if (
    JSON.stringify(copy.footer.segments) !==
    JSON.stringify(defaults.footer.segments)
  ) {
    result.footer = { segments: copy.footer.segments };
  }

  const trigger = Object.fromEntries(
    Object.entries(copy.trigger).filter(
      ([key, value]) =>
        value !== defaults.trigger[key as keyof typeof defaults.trigger],
    ),
  );
  if (Object.keys(trigger).length > 0) result.trigger = trigger;

  if (copy.close.ariaLabel !== defaults.close.ariaLabel) {
    result.close = { ariaLabel: copy.close.ariaLabel };
  }

  const validation = Object.fromEntries(
    Object.entries(copy.validation).filter(
      ([key, value]) =>
        value !== defaults.validation[key as keyof typeof defaults.validation],
    ),
  );
  if (Object.keys(validation).length > 0) result.validation = validation;

  return Object.keys(result).length > 0 ? result : undefined;
}

function formatCopyBlock(name: string, lines: string[]) {
  if (lines.length === 0) return null;
  return `${name}: {\n          ${lines.join(",\n          ")}\n        }`;
}

export function buildCopyLines(copy: ResolvedAuthCopyConfig) {
  const defaults = DEFAULT_COPY;
  const blocks: string[] = [];

  const loginLines = Object.entries(copy.login)
    .filter(
      ([key, value]) =>
        value !== defaults.login[key as keyof typeof defaults.login],
    )
    .map(([key, value]) => `${key}: "${value}"`);
  const loginBlock = formatCopyBlock("login", loginLines);
  if (loginBlock) blocks.push(loginBlock);

  const registerLines = Object.entries(copy.register)
    .filter(
      ([key, value]) =>
        value !== defaults.register[key as keyof typeof defaults.register],
    )
    .map(([key, value]) => `${key}: "${value}"`);
  const registerBlock = formatCopyBlock("register", registerLines);
  if (registerBlock) blocks.push(registerBlock);

  const fieldBlocks = (["email", "password", "confirmPassword"] as const)
    .map((field) => {
      const lines = Object.entries(copy.fields[field])
        .filter(
          ([key, value]) =>
            value !==
            defaults.fields[field][
              key as keyof (typeof defaults.fields)["email"]
            ],
        )
        .map(([key, value]) => `${key}: "${value}"`);
      return formatCopyBlock(field, lines);
    })
    .filter(Boolean) as string[];

  if (fieldBlocks.length > 0) {
    blocks.push(
      `fields: {\n          ${fieldBlocks.join(",\n          ")}\n        }`,
    );
  }

  const rememberBlock =
    copy.rememberMe.label !== defaults.rememberMe.label
      ? `rememberMe: { label: "${copy.rememberMe.label}" }`
      : null;
  if (rememberBlock) blocks.push(rememberBlock);

  const forgotLines = Object.entries(copy.forgotPassword)
    .filter(
      ([key, value]) =>
        value !==
        defaults.forgotPassword[key as keyof typeof defaults.forgotPassword],
    )
    .map(([key, value]) => `${key}: "${value}"`);
  const forgotBlock = formatCopyBlock("forgotPassword", forgotLines);
  if (forgotBlock) blocks.push(forgotBlock);

  const oauthLines = [
    copy.oauth.divider !== defaults.oauth.divider
      ? `divider: "${copy.oauth.divider}"`
      : null,
    copy.oauth.continueWith !== defaults.oauth.continueWith
      ? `continueWith: "${copy.oauth.continueWith}"`
      : null,
    copy.oauth.showAllSocial !== defaults.oauth.showAllSocial
      ? `showAllSocial: "${copy.oauth.showAllSocial}"`
      : null,
    copy.oauth.hideAllSocial !== defaults.oauth.hideAllSocial
      ? `hideAllSocial: "${copy.oauth.hideAllSocial}"`
      : null,
  ].filter(Boolean) as string[];

  const providerLines = Object.entries(copy.oauth.providers)
    .filter(
      ([key, value]) =>
        value !== defaults.oauth.providers[key as OAuthProvider],
    )
    .map(([key, value]) => `${key}: "${value}"`);

  if (providerLines.length > 0) {
    oauthLines.push(`providers: { ${providerLines.join(", ")} }`);
  }

  const oauthBlock = formatCopyBlock("oauth", oauthLines);
  if (oauthBlock) blocks.push(oauthBlock);

  if (
    JSON.stringify(copy.footer.segments) !==
    JSON.stringify(defaults.footer.segments)
  ) {
    blocks.push(
      `footer: {\n          segments: ${JSON.stringify(copy.footer.segments, null, 2)
        .split("\n")
        .map((line, index) => (index === 0 ? line : `          ${line}`))
        .join("\n")}\n        }`,
    );
  }

  return blocks;
}

export function buildConfig({
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
}): AuthConfig {
  const copyConfig = buildCopyConfig(copy);

  return {
    ui: {
      presentation: { variant: mode },
      auth,
      ...(copyConfig ? { copy: copyConfig } : {}),
      motion: { ...motion, displayMode: mode },
      visual: { backdrop },
    },
    onCredential: async () => {
      await new Promise((r) => setTimeout(r, 450));
    },
    onOAuth: async () => {
      await new Promise((r) => setTimeout(r, 450));
    },
    onForgotPassword: async () => {
      await new Promise((r) => setTimeout(r, 450));
    },
  };
}

export function initBackdrop(): BackdropState {
  const b = CONFIGURATOR_DEFAULTS.visual.backdrop;
  return {
    color: b.color,
    opacity: b.opacity,
    blur: b.blur,
    gradient: {
      angle: b.gradient?.angle ?? 180,
      from: b.gradient?.from ?? "transparent",
      to: b.gradient?.to ?? "#070708",
      fromPos: b.gradient?.fromPos ?? 100,
      toPos: b.gradient?.toPos ?? 100,
    },
  };
}

export function initMotion(): MotionSettings {
  return { ...CONFIGURATOR_DEFAULTS.motion };
}

export function isStockConfiguratorState({
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
  if (mode !== CONFIGURATOR_DEFAULTS.presentation.variant) return false;
  if (buildCopyConfig(copy)) return false;

  if (
    !arraysEqual(
      auth.providers ?? CONFIGURATOR_DEFAULTS.auth.providers,
      CONFIGURATOR_DEFAULTS.auth.providers,
    ) ||
    (auth.oauthLayout ?? CONFIGURATOR_DEFAULTS.auth.oauthLayout) !==
      CONFIGURATOR_DEFAULTS.auth.oauthLayout ||
    (auth.oauthOverflow?.visibleCount ??
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount) !==
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.visibleCount ||
    (auth.oauthOverflow?.showPreviewIcons ??
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons) !==
      CONFIGURATOR_DEFAULTS.auth.oauthOverflow.showPreviewIcons ||
    (auth.allowRegister ?? CONFIGURATOR_DEFAULTS.auth.allowRegister) !==
      CONFIGURATOR_DEFAULTS.auth.allowRegister ||
    (auth.showRememberMe ?? CONFIGURATOR_DEFAULTS.auth.showRememberMe) !==
      CONFIGURATOR_DEFAULTS.auth.showRememberMe ||
    (auth.initialMode ?? CONFIGURATOR_DEFAULTS.auth.initialMode) !==
      CONFIGURATOR_DEFAULTS.auth.initialMode ||
    (auth.showForgotPassword ?? CONFIGURATOR_DEFAULTS.auth.showForgotPassword) !==
      CONFIGURATOR_DEFAULTS.auth.showForgotPassword ||
    (auth.showLivePasswordMatch ??
      CONFIGURATOR_DEFAULTS.auth.showLivePasswordMatch) !==
      CONFIGURATOR_DEFAULTS.auth.showLivePasswordMatch ||
    (auth.showFooter ?? CONFIGURATOR_DEFAULTS.auth.showFooter) !==
      CONFIGURATOR_DEFAULTS.auth.showFooter
  ) {
    return false;
  }

  const defaultBackdrop = initBackdrop();
  if (
    backdrop.color !== defaultBackdrop.color ||
    backdrop.opacity !== defaultBackdrop.opacity ||
    backdrop.blur !== defaultBackdrop.blur ||
    backdrop.gradient.angle !== defaultBackdrop.gradient.angle ||
    backdrop.gradient.from !== defaultBackdrop.gradient.from ||
    backdrop.gradient.to !== defaultBackdrop.gradient.to ||
    backdrop.gradient.fromPos !== defaultBackdrop.gradient.fromPos ||
    backdrop.gradient.toPos !== defaultBackdrop.gradient.toPos
  ) {
    return false;
  }

  const defaultMotion = initMotion();
  return (Object.keys(defaultMotion) as (keyof MotionSettings)[]).every(
    (key) => motion[key] === defaultMotion[key],
  );
}
