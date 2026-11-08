import {
  EMPTY_AUTH_ERRORS,
  hasAuthErrors,
  mergeAuthErrors,
  type AuthErrorState,
  type AuthUiError,
} from "../auth-errors";
import { REMEMBER_KEY } from "../constants";
import { formatCopy } from "../copy";
import {
  readLastUsedMethod,
  recordLastUsedMethod,
  subscribeLastUsed,
  type LastUsedMethod,
} from "../last-used";
import type { PasswordMatchFeedback } from "../validation";
import { getPasswordMatchFeedback, validateCredentials } from "../validation";
import { createSubscribers, type Controller } from "../store";
import type {
  AuthAction,
  AuthAdapter,
  AuthSuccessAction,
  FormMode,
  LoadingAction,
  OAuthProvider,
  ResolvedAuthConfig,
} from "../types";

export type FormButtonFeedback = {
  status: "error" | "success";
  message: string;
};

export type AuthFormControllerOptions<Node = unknown> = {
  adapter: AuthAdapter;
  config: ResolvedAuthConfig<Node>;
  /** Called after a sign in, sign up, OAuth or passkey success, once the adapter callbacks ran. */
  onSubmitSuccess: (action: AuthSuccessAction) => void;
  onAdapterSuccess?: (action: AuthAction) => void;
  onAdapterError?: (error: AuthUiError, action: AuthAction) => void;
};

type FormFields = {
  email: string;
  name: string;
  password: string;
  confirm: string;
  rememberMe: boolean;
  mode: FormMode;
  errors: AuthErrorState;
  nameError: string;
  notice: string;
  loadingAction: LoadingAction;
  magicLinkSentTo: string | null;
  resendSeconds: number;
  oauthSuccessProvider: OAuthProvider | null;
  submitSuccessAction: "signIn" | "signUp" | null;
  passkeySucceeded: boolean;
};

type FormView = {
  lastUsed: LastUsedMethod | null;
  isRegister: boolean;
  isResetPassword: boolean;
  isMagicLink: boolean;
  isMagicLinkSent: boolean;
  requiresName: boolean;
  showMagicLinkSwitch: boolean;
  magicLinkAvailable: boolean;
  passkeyAvailable: boolean;
  oauthProviders: OAuthProvider[];
  title: string;
  subtitle: string;
  submitLabel: string;
  confirmFeedback: PasswordMatchFeedback;
  buttonFeedback: FormButtonFeedback | undefined;
  isLoading: boolean;
};

export type AuthFormState = FormFields & FormView;

export type AuthFormController = Controller<AuthFormState> & {
  setEmail: (value: string) => void;
  acceptEmailSuggestion: (value: string) => void;
  setName: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirm: (value: string) => void;
  setRememberMe: (value: boolean) => void;
  hydrate: () => void;
  submit: () => Promise<void>;
  runOAuth: (provider: OAuthProvider) => Promise<void>;
  runPasskey: () => Promise<void>;
  sendMagicLink: (address?: string) => Promise<void>;
  requestPasswordReset: () => Promise<void>;
  toggleMagicLink: () => void;
  useAnotherEmail: () => void;
  switchMode: () => void;
  backToLogin: () => void;
  updateInputs: (inputs: Partial<AuthFormControllerOptions>) => void;
};

const PASSWORD_RESET_NOTICE = "Your password has been reset successfully. Please sign in.";
const NAME_REQUIRED_MESSAGE = "Enter your name.";

function errorForSubmit(error: AuthUiError): AuthErrorState {
  if (error.target === "email") return { fields: { email: error } };
  if (error.target === "password") return { fields: { password: error } };
  if (error.target === "confirmPassword") {
    return { fields: { confirmPassword: error } };
  }
  if (error.target === "oauth") return { fields: {}, oauth: error };

  return { fields: {}, form: error };
}

function initialMode(config: ResolvedAuthConfig<unknown>): FormMode {
  const initial = config.ui.auth.initialMode;
  if (initial === "register" && !config.ui.auth.allowRegister) return "login";
  return initial;
}

function sameValues<Shape extends object>(current: Shape, patch: Partial<Shape>) {
  return (Object.keys(patch) as Array<keyof Shape>).every((key) =>
    Object.is(current[key], patch[key]),
  );
}

function pickFormCopy(config: ResolvedAuthConfig<unknown>, mode: FormMode) {
  if (mode === "resetPassword") return config.ui.copy.resetPassword;
  if (mode === "register") return config.ui.copy.register;
  return config.ui.copy.login;
}

function deriveButtonFeedback(
  fields: FormFields,
  config: ResolvedAuthConfig<unknown>,
): FormButtonFeedback | undefined {
  if (fields.errors.form) return { status: "error", message: fields.errors.form.message };
  if (fields.notice) return { status: "success", message: fields.notice };
  if (fields.submitSuccessAction) {
    return { status: "success", message: config.ui.success.messages[fields.submitSuccessAction] };
  }
  return undefined;
}

function deriveView(
  fields: FormFields,
  inputs: Pick<AuthFormControllerOptions, "adapter" | "config">,
  storedLastUsed: LastUsedMethod | null,
): FormView {
  const { adapter, config } = inputs;
  const { mode } = fields;
  const isRegister = mode === "register";
  const isResetPassword = mode === "resetPassword";
  const isMagicLink = mode === "magicLink";
  const magicLinkCopy = config.ui.copy.magicLink;
  const magicLinkAvailable = Boolean(
    config.ui.auth.magicLink.enabled ? adapter.features?.magicLink : undefined,
  );
  const passkeyAvailable = Boolean(
    config.ui.auth.passkey.enabled ? adapter.features?.passkey : undefined,
  );
  const hasPasswordSignIn = typeof adapter.signIn === "function";
  const isMagicLinkSent = isMagicLink && fields.magicLinkSentTo !== null;
  const formCopy = pickFormCopy(config, mode);

  return {
    lastUsed: config.ui.auth.showLastUsed ? storedLastUsed : null,
    isRegister,
    isResetPassword,
    isMagicLink,
    isMagicLinkSent,
    requiresName: Boolean(adapter.requiresName && isRegister),
    showMagicLinkSwitch: magicLinkAvailable && hasPasswordSignIn && !isResetPassword,
    magicLinkAvailable,
    passkeyAvailable,
    // A misbehaving adapter can hand back a non-array `providers`; degrade to "no OAuth".
    oauthProviders: Array.isArray(config.ui.auth.providers) ? config.ui.auth.providers : [],
    title: isMagicLinkSent
      ? magicLinkCopy.sentTitle
      : isMagicLink
        ? magicLinkCopy.title
        : formCopy.title,
    subtitle: isMagicLinkSent
      ? formatCopy(magicLinkCopy.sentSubtitle, { email: fields.magicLinkSentTo ?? "" })
      : isMagicLink
        ? magicLinkCopy.subtitle
        : formCopy.subtitle,
    submitLabel: isMagicLink ? magicLinkCopy.submit : formCopy.submit,
    confirmFeedback: config.ui.auth.showLivePasswordMatch
      ? getPasswordMatchFeedback(
          { mode, password: fields.password, confirmPassword: fields.confirm },
          config.ui.copy,
        )
      : null,
    buttonFeedback: deriveButtonFeedback(fields, config),
    isLoading: fields.loadingAction !== null,
  };
}

/**
 * @name createAuthFormController
 * @description Framework-free state machine behind the credential form: fields, mode, validation,
 * sign in, sign up, password reset, magic link, OAuth, passkey, last-used tracking and the resend
 * countdown. Renderers read `getState()` and call the action methods. Timers and storage listeners
 * run only while the controller has a subscriber. Async results arriving after `destroy()` are
 * ignored.
 *
 * @example
 * const form = createAuthFormController({ adapter, config: resolveAuthConfig(undefined, adapter), onSubmitSuccess });
 * const stop = form.subscribe(() => render(form.getState()));
 * form.setEmail("ada@example.com");
 * form.setPassword("correct horse");
 * await form.submit();
 */
export function createAuthFormController<Node = unknown>(
  options: AuthFormControllerOptions<Node>,
): AuthFormController {
  let inputs: AuthFormControllerOptions<unknown> = options;
  let storedLastUsed: LastUsedMethod | null = null;
  let countdown: { seconds: number; timer: ReturnType<typeof setTimeout> } | null = null;

  let fields: FormFields = {
    email: inputs.adapter.demoCredentials?.email ?? "",
    name: "",
    password: inputs.adapter.demoCredentials?.password ?? "",
    confirm: "",
    rememberMe: false,
    mode: initialMode(inputs.config),
    errors: EMPTY_AUTH_ERRORS,
    nameError: "",
    notice: "",
    loadingAction: null,
    magicLinkSentTo: null,
    resendSeconds: 0,
    oauthSuccessProvider: null,
    submitSuccessAction: null,
    passkeySucceeded: false,
  };

  const subscribers = createSubscribers({
    onActive() {
      refreshLastUsed();
      syncCountdown();
      const stopLastUsed = subscribeLastUsed(handleLastUsedChange);

      return () => {
        stopLastUsed();
        clearCountdown();
      };
    },
  });

  let state: AuthFormState = buildState();

  function buildState(): AuthFormState {
    return { ...fields, ...deriveView(fields, inputs, storedLastUsed) };
  }

  function publish() {
    state = buildState();
    syncCountdown();
    subscribers.emit();
  }

  function commit(patch: Partial<FormFields>) {
    if (subscribers.isDestroyed() || sameValues(fields, patch)) return;
    fields = { ...fields, ...patch };
    publish();
  }

  function refreshLastUsed() {
    const next = readLastUsedMethod();
    if (next === storedLastUsed) return false;
    storedLastUsed = next;
    state = buildState();
    return true;
  }

  function handleLastUsedChange() {
    if (refreshLastUsed()) subscribers.emit();
  }

  function clearCountdown() {
    if (!countdown) return;
    clearTimeout(countdown.timer);
    countdown = null;
  }

  function tickCountdown() {
    countdown = null;
    commit({ resendSeconds: fields.resendSeconds - 1 });
  }

  function syncCountdown() {
    const seconds = fields.resendSeconds;
    if (countdown?.seconds === seconds) return;

    clearCountdown();
    if (!subscribers.isActive() || seconds <= 0) return;
    countdown = { seconds, timer: setTimeout(tickCountdown, 1000) };
  }

  function notifyAdapterError(error: AuthUiError, action: AuthAction) {
    const { adapter, onAdapterError } = inputs;
    adapter.onError?.(error, action);
    onAdapterError?.(error, action);
  }

  function notifyAdapterSuccess(action: AuthAction) {
    const { adapter, onAdapterSuccess } = inputs;
    adapter.onSuccess?.(action);
    onAdapterSuccess?.(action);
  }

  function setEmail(value: string) {
    commit({
      email: value,
      notice: "",
      errors: {
        ...fields.errors,
        fields: { ...fields.errors.fields, email: undefined },
        form: undefined,
        oauth: undefined,
      },
    });
  }

  function acceptEmailSuggestion(value: string) {
    commit({
      email: value,
      notice: "",
      errors: {
        ...fields.errors,
        fields: { ...fields.errors.fields, email: undefined },
      },
    });
  }

  function setName(value: string) {
    commit({
      name: value,
      nameError: "",
      notice: "",
      errors: { ...fields.errors, form: undefined },
    });
  }

  function setPassword(value: string) {
    commit({
      password: value,
      notice: "",
      errors: {
        ...fields.errors,
        fields: { ...fields.errors.fields, password: undefined },
        form: undefined,
      },
    });
  }

  function setConfirm(value: string) {
    commit({
      confirm: value,
      notice: "",
      errors: {
        ...fields.errors,
        fields: { ...fields.errors.fields, confirmPassword: undefined },
      },
    });
  }

  function setRememberMe(value: boolean) {
    commit({ rememberMe: value });

    try {
      localStorage.setItem(REMEMBER_KEY, String(value));
    } catch {
      return;
    }
  }

  function hydrate() {
    let stored = false;

    try {
      stored = localStorage.getItem(REMEMBER_KEY) === "true";
    } catch {
      stored = false;
    }

    const lastUsedChanged = refreshLastUsed();
    if (fields.rememberMe !== stored) {
      commit({ rememberMe: stored });
      return;
    }
    if (lastUsedChanged) subscribers.emit();
  }

  async function runOAuth(provider: OAuthProvider) {
    const { adapter, config, onSubmitSuccess } = inputs;
    commit({
      loadingAction: provider,
      errors: EMPTY_AUTH_ERRORS,
      notice: "",
      oauthSuccessProvider: null,
    });

    try {
      const result = await adapter.signInWithOAuth?.(provider);
      if (subscribers.isDestroyed()) return;

      if (!result?.success) {
        const error =
          result?.error ??
          config.normalizeError(new Error("OAuth provider unavailable."), {
            provider,
            fallbackTarget: "oauth",
          });
        notifyAdapterError(error, "oauth");
        commit({ errors: errorForSubmit(error) });
        return;
      }

      recordLastUsedMethod(provider);
      notifyAdapterSuccess("oauth");
      commit({ oauthSuccessProvider: provider });
      onSubmitSuccess("oauth");
    } catch (error) {
      if (subscribers.isDestroyed()) return;
      const normalized = adapter.normalizeError
        ? adapter.normalizeError(error)
        : config.normalizeError(error, { provider, fallbackTarget: "oauth" });
      notifyAdapterError(normalized, "oauth");
      commit({ errors: errorForSubmit(normalized) });
    } finally {
      commit({ loadingAction: null });
    }
  }

  async function runPasskey() {
    const { adapter, config, onSubmitSuccess } = inputs;
    const passkey = config.ui.auth.passkey.enabled ? adapter.features?.passkey : undefined;
    commit({
      loadingAction: "passkey",
      errors: EMPTY_AUTH_ERRORS,
      notice: "",
      passkeySucceeded: false,
    });

    try {
      const result = await passkey?.signIn();
      if (subscribers.isDestroyed()) return;

      if (!result?.success) {
        const error =
          result?.error ??
          config.normalizeError(new Error("Passkey sign-in is unavailable."), {
            fallbackTarget: "form",
          });
        notifyAdapterError(error, "passkey");
        commit({ errors: errorForSubmit(error) });
        return;
      }

      recordLastUsedMethod("passkey");
      notifyAdapterSuccess("passkey");
      commit({ passkeySucceeded: true });
      onSubmitSuccess("passkey");
    } catch (error) {
      if (subscribers.isDestroyed()) return;
      const normalized = adapter.normalizeError
        ? adapter.normalizeError(error)
        : config.normalizeError(error, { fallbackTarget: "form" });
      notifyAdapterError(normalized, "passkey");
      commit({ errors: errorForSubmit(normalized) });
    } finally {
      commit({ loadingAction: null });
    }
  }

  async function sendMagicLink(address?: string) {
    const { adapter, config } = inputs;
    const target = address ?? fields.magicLinkSentTo ?? fields.email.trim();
    const magicLink = config.ui.auth.magicLink.enabled ? adapter.features?.magicLink : undefined;
    commit({ loadingAction: "email", errors: EMPTY_AUTH_ERRORS, notice: "" });

    try {
      const result = await magicLink?.signIn(target);
      if (subscribers.isDestroyed()) return;

      if (!result?.success) {
        const error =
          result?.error ??
          config.normalizeError(new Error("Magic link sign-in is unavailable."), {
            fallbackTarget: "form",
          });
        notifyAdapterError(error, "signIn");
        commit({ errors: errorForSubmit(error) });
        return;
      }

      recordLastUsedMethod("magicLink");
      commit({
        magicLinkSentTo: target,
        resendSeconds: Math.ceil(config.ui.auth.magicLink.resendMs / 1000),
      });
    } catch (error) {
      if (subscribers.isDestroyed()) return;
      const normalized = adapter.normalizeError
        ? adapter.normalizeError(error)
        : config.normalizeError(error, { fallbackTarget: "form" });
      notifyAdapterError(normalized, "signIn");
      commit({ errors: errorForSubmit(normalized) });
    } finally {
      commit({ loadingAction: null });
    }
  }

  async function submitCredentials(validation: AuthErrorState) {
    const { adapter, config, onSubmitSuccess } = inputs;
    const { mode, email, password, name, rememberMe } = fields;
    commit({ loadingAction: "email", errors: EMPTY_AUTH_ERRORS, notice: "" });

    try {
      if (mode === "resetPassword") {
        const result = await adapter.resetPassword?.({ newPassword: password });
        if (subscribers.isDestroyed()) return;

        if (!result?.success) {
          const error =
            result?.error ??
            config.normalizeError(new Error("Password reset is unavailable."), {
              fallbackTarget: "form",
            });
          notifyAdapterError(error, "signIn");
          commit({ errors: mergeAuthErrors(validation, errorForSubmit(error)) });
          return;
        }

        commit({ mode: "login", password: "", confirm: "", notice: PASSWORD_RESET_NOTICE });
        return;
      }

      const action = mode === "register" ? "signUp" : "signIn";
      const result =
        action === "signUp"
          ? await adapter.signUp?.({ email: email.trim(), password, rememberMe, name: name.trim() })
          : await adapter.signIn?.({ email: email.trim(), password, rememberMe });
      if (subscribers.isDestroyed()) return;

      if (!result?.success) {
        const error =
          result?.error ??
          config.normalizeError(new Error("Authentication action unavailable."), {
            fallbackTarget: "form",
          });
        notifyAdapterError(error, action);
        commit({ errors: mergeAuthErrors(validation, errorForSubmit(error)) });
        return;
      }

      recordLastUsedMethod("email");
      notifyAdapterSuccess(action);
      commit({ submitSuccessAction: action });
      onSubmitSuccess(action);
    } catch (error) {
      if (subscribers.isDestroyed()) return;
      const backendError = adapter.normalizeError
        ? adapter.normalizeError(error)
        : config.normalizeError(error, { fallbackTarget: "form" });
      notifyAdapterError(backendError, mode === "register" ? "signUp" : "signIn");
      commit({ errors: mergeAuthErrors(validation, errorForSubmit(backendError)) });
    } finally {
      commit({ loadingAction: null });
    }
  }

  async function submit() {
    const { config } = inputs;
    const validation = validateCredentials(
      {
        mode: fields.mode,
        email: fields.email,
        password: fields.password,
        confirmPassword: fields.confirm,
      },
      config.ui.copy,
    );
    const nameError = state.requiresName && !fields.name.trim() ? NAME_REQUIRED_MESSAGE : "";

    if (hasAuthErrors(validation) || nameError) {
      commit({ nameError, errors: validation });
      return;
    }

    commit({ nameError });

    if (fields.mode === "magicLink") {
      await sendMagicLink(fields.email.trim());
      return;
    }

    await submitCredentials(validation);
  }

  async function requestPasswordReset() {
    const { adapter, config } = inputs;
    const validation = validateCredentials(
      { mode: "login", email: fields.email, password: "placeholder-password" },
      config.ui.copy,
    );

    if (validation.fields.email) {
      commit({ errors: { fields: { email: validation.fields.email } } });
      return;
    }

    commit({ loadingAction: "forgotPassword", errors: EMPTY_AUTH_ERRORS, notice: "" });

    try {
      const result = await adapter.requestPasswordReset?.(fields.email.trim());
      if (subscribers.isDestroyed()) return;

      if (!result?.success) {
        const error =
          result?.error ??
          config.normalizeError(new Error("Password reset is unavailable."), {
            fallbackTarget: "form",
          });
        notifyAdapterError(error, "signIn");
        commit({ errors: errorForSubmit(error) });
        return;
      }

      commit({ notice: config.ui.copy.forgotPassword.successNotice });
    } catch (error) {
      if (subscribers.isDestroyed()) return;
      const normalized = adapter.normalizeError
        ? adapter.normalizeError(error)
        : config.normalizeError(error, { fallbackTarget: "form" });
      notifyAdapterError(normalized, "signIn");
      commit({ errors: errorForSubmit(normalized) });
    } finally {
      commit({ loadingAction: null });
    }
  }

  function toggleMagicLink() {
    commit({
      mode: fields.mode === "magicLink" ? "login" : "magicLink",
      magicLinkSentTo: null,
      resendSeconds: 0,
      errors: EMPTY_AUTH_ERRORS,
      notice: "",
      submitSuccessAction: null,
      oauthSuccessProvider: null,
    });
  }

  function useAnotherEmail() {
    commit({ magicLinkSentTo: null, resendSeconds: 0, errors: EMPTY_AUTH_ERRORS });
  }

  function switchMode() {
    commit({
      mode: fields.mode === "login" ? "register" : "login",
      errors: EMPTY_AUTH_ERRORS,
      nameError: "",
      notice: "",
      submitSuccessAction: null,
      oauthSuccessProvider: null,
    });
  }

  function backToLogin() {
    commit({ mode: "login", errors: EMPTY_AUTH_ERRORS, notice: "" });
  }

  function updateInputs(next: Partial<AuthFormControllerOptions>) {
    const viewChanged =
      (next.adapter !== undefined && next.adapter !== inputs.adapter) ||
      (next.config !== undefined && next.config !== inputs.config);
    inputs = { ...inputs, ...next };

    if (viewChanged && !subscribers.isDestroyed()) publish();
  }

  function destroy() {
    clearCountdown();
    subscribers.destroy();
  }

  return {
    getState: () => state,
    subscribe: subscribers.subscribe,
    destroy,
    setEmail,
    acceptEmailSuggestion,
    setName,
    setPassword,
    setConfirm,
    setRememberMe,
    hydrate,
    submit,
    runOAuth,
    runPasskey,
    sendMagicLink,
    requestPasswordReset,
    toggleMagicLink,
    useAnotherEmail,
    switchMode,
    backToLogin,
    updateInputs,
  };
}
