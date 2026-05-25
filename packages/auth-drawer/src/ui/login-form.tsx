import { memo, useCallback, useId, useState, useTransition, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EMPTY_AUTH_ERRORS,
  type AuthErrorState,
  type AuthUiError,
  hasAuthErrors,
  mergeAuthErrors,
} from "../auth-errors";
import type { AuthAdapter, FormMode, LoadingAction, OAuthProvider, ResolvedAuthConfig } from "../types";
import { EASE_OUT, MAX_STAGGER } from "../constants";
import { useRememberMe } from "../hooks/use-remember-me";
import { getPasswordMatchFeedback, validateCredentials } from "../validation";
import { AuthButton } from "./auth-button";
import { AuthFooter } from "./auth-footer";
import { ConfirmPasswordField } from "./confirm-password-field";
import { EmailField } from "./email-field";
import { OauthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";
import { RememberMe } from "./remember-me";
import { ValidationMessage } from "./validation-message";

type Props = {
  onSuccess: () => void;
  onAdapterSuccess?: NonNullable<AuthAdapter["onSuccess"]>;
  onAdapterError?: NonNullable<AuthAdapter["onError"]>;
  adapter: AuthAdapter;
  titleId: string;
  descId: string;
  config: ResolvedAuthConfig;
};

const FORM_VIEW = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
} as const;

const FADE_VIEW = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

const SLIDE_VIEW = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 },
} as const;

function errorForSubmit(error: AuthUiError): AuthErrorState {
  if (error.target === "email") return { fields: { email: error } };
  if (error.target === "password") return { fields: { password: error } };
  if (error.target === "confirmPassword") {
    return { fields: { confirmPassword: error } };
  }
  if (error.target === "oauth") return { fields: {}, oauth: error };

  return { fields: {}, form: error };
}

function fieldErrorId(base: string, field: string) {
  return `${base}-${field}-error`;
}

/**
 * Renders the auth form and owns form-only UI state.
 *
 * @param props - Auth callbacks, ids, and resolved feature config.
 * @returns Complete credential and OAuth form.
 */
type AuthAction = "signIn" | "signUp" | "signOut" | "oauth";

function Form({
  onSuccess,
  onAdapterSuccess,
  onAdapterError,
  adapter,
  titleId,
  descId,
  config,
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<FormMode>(
    config.ui.auth.allowRegister ? config.ui.auth.initialMode : "login",
  );
  const [rememberMe, setRememberMe] = useRememberMe();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setAction] = useState<LoadingAction>(null);
  const [errors, setErrors] = useState<AuthErrorState>(EMPTY_AUTH_ERRORS);
  const [nameError, setNameError] = useState("");
  const [notice, setNotice] = useState("");
  const errorBaseId = useId();

  const isRegister = mode === "register";
  const isResetPassword = mode === "resetPassword";
  const formCopy = isResetPassword
    ? config.ui.copy.resetPassword
    : isRegister
      ? config.ui.copy.register
      : config.ui.copy.login;
  const title = formCopy.title;
  const subtitle = formCopy.subtitle;
  const emailErrorId = fieldErrorId(errorBaseId, "email");
  const nameErrorId = fieldErrorId(errorBaseId, "name");
  const passwordErrorId = fieldErrorId(errorBaseId, "password");
  const confirmErrorId = fieldErrorId(errorBaseId, "confirm");
  const confirmLiveId = fieldErrorId(errorBaseId, "confirm-live");
  const formErrorId = fieldErrorId(errorBaseId, "form");
  const oauthErrorId = fieldErrorId(errorBaseId, "oauth");
  const hasOAuthProviders = config.ui.auth.providers.length > 0;
  const requiresName = Boolean(adapter.requiresName && isRegister);
  const emailError = errors.fields.email;
  const passwordError = errors.fields.password;
  const confirmError = errors.fields.confirmPassword;
  const confirmFeedback = config.ui.auth.showLivePasswordMatch
    ? getPasswordMatchFeedback(
        {
          mode,
          password,
          confirmPassword: confirm,
        },
        config.ui.copy,
      )
    : null;
  const formError = errors.form;
  const oauthError = errors.oauth;
  const isLoading = isPending || loadingAction !== null;

  const handleAdapterError = useCallback(
    (error: AuthUiError, action: AuthAction) => {
      adapter.onError?.(error, action);
      onAdapterError?.(error, action);
    },
    [adapter, onAdapterError],
  );

  const handleAdapterSuccess = useCallback(
    (action: AuthAction) => {
      adapter.onSuccess?.(action);
      onAdapterSuccess?.(action);
    },
    [adapter, onAdapterSuccess],
  );

  const runOAuth = useCallback(
    (provider: OAuthProvider) => {
      setAction(provider);
      setErrors(EMPTY_AUTH_ERRORS);
      setNotice("");

      startTransition(async () => {
        try {
          const result = await adapter.signInWithOAuth?.(provider);
          if (!result?.success) {
            const error =
              result?.error ??
              config.normalizeError(new Error("OAuth provider unavailable."), {
                provider,
                fallbackTarget: "oauth",
              });
            handleAdapterError(error, "oauth");
            setErrors(errorForSubmit(error));
            return;
          }
          handleAdapterSuccess("oauth");

          onSuccess();
        } catch (error) {
          const normalized = adapter.normalizeError
            ? adapter.normalizeError(error)
            : config.normalizeError(error, { provider, fallbackTarget: "oauth" });
          handleAdapterError(normalized, "oauth");
          setErrors(errorForSubmit(normalized));
        } finally {
          setAction(null);
        }
      });
    },
    [adapter, config, handleAdapterError, handleAdapterSuccess, onSuccess, startTransition],
  );

  const submitForm = useCallback(
    (event: FormEvent) => {
      event.preventDefault();

      const validation = validateCredentials(
        {
          mode,
          email,
          password,
          confirmPassword: confirm,
        },
        config.ui.copy,
      );
      const nextNameError = requiresName && !name.trim() ? "Enter your name." : "";
      setNameError(nextNameError);

      if (hasAuthErrors(validation) || nextNameError) {
        setErrors(validation);
        return;
      }

      setAction("email");
      setErrors(EMPTY_AUTH_ERRORS);
      setNotice("");

      startTransition(async () => {
        try {
          if (mode === "resetPassword") {
            const result = await adapter.resetPassword?.({ newPassword: password });
            if (!result?.success) {
              const error =
                result?.error ??
                config.normalizeError(new Error("Password reset is unavailable."), {
                  fallbackTarget: "form",
                });
              handleAdapterError(error, "signIn");
              setErrors(mergeAuthErrors(validation, errorForSubmit(error)));
              return;
            }
            setMode("login");
            setPassword("");
            setConfirm("");
            setNotice("Your password has been reset successfully. Please sign in.");
            return;
          }

          const action = mode === "register" ? "signUp" : "signIn";
          const result =
            action === "signUp"
              ? await adapter.signUp?.({
                  email: email.trim(),
                  password,
                  rememberMe,
                  name: name.trim(),
                })
              : await adapter.signIn({
                  email: email.trim(),
                  password,
                  rememberMe,
                });

          if (!result?.success) {
            const error =
              result?.error ??
              config.normalizeError(new Error("Authentication action unavailable."), {
                fallbackTarget: "form",
              });
            handleAdapterError(error, action);
            setErrors(mergeAuthErrors(validation, errorForSubmit(error)));
            return;
          }

          handleAdapterSuccess(action);
          onSuccess();
          return;
        } catch (error) {
          const backendError = adapter.normalizeError
            ? adapter.normalizeError(error)
            : config.normalizeError(error, { fallbackTarget: "form" });
          handleAdapterError(backendError, mode === "register" ? "signUp" : "signIn");
          setErrors(mergeAuthErrors(validation, errorForSubmit(backendError)));
        } finally {
          setAction(null);
        }
      });
    },
    [
      adapter,
      confirm,
      config,
      email,
      handleAdapterError,
      handleAdapterSuccess,
      mode,
      name,
      onSuccess,
      password,
      rememberMe,
      requiresName,
      startTransition,
    ],
  );

  const switchMode = useCallback(() => {
    setMode((value) => (value === "login" ? "register" : "login"));
    setErrors(EMPTY_AUTH_ERRORS);
    setNameError("");
    setNotice("");
  }, []);

  const acceptEmail = useCallback((value: string) => {
    setEmail(value);
    setNotice("");
    setErrors((current) => ({
      ...current,
      fields: { ...current.fields, email: undefined },
    }));
  }, []);

  const changeEmail = useCallback((value: string) => {
    setEmail(value);
    setNotice("");
    setErrors((current) => ({
      ...current,
      fields: { ...current.fields, email: undefined },
      form: undefined,
      oauth: undefined,
    }));
  }, []);

  const changeName = useCallback((value: string) => {
    setName(value);
    setNameError("");
    setNotice("");
    setErrors((current) => ({
      ...current,
      form: undefined,
    }));
  }, []);

  const changePassword = useCallback((value: string) => {
    setPassword(value);
    setNotice("");
    setErrors((current) => ({
      ...current,
      fields: { ...current.fields, password: undefined },
      form: undefined,
      confirmPassword: undefined,
    }));
  }, []);

  const changeConfirm = useCallback((value: string) => {
    setConfirm(value);
    setNotice("");
    setErrors((current) => ({
      ...current,
      fields: { ...current.fields, confirmPassword: undefined },
    }));
  }, []);

  const resetPassword = useCallback(() => {
    const validation = validateCredentials(
      {
        mode: "login",
        email,
        password: "placeholder-password",
      },
      config.ui.copy,
    );

    if (validation.fields.email) {
      setErrors({ fields: { email: validation.fields.email } });
      return;
    }

    setAction("forgotPassword");
    setErrors(EMPTY_AUTH_ERRORS);
    setNotice("");

    startTransition(async () => {
      try {
        const result = await adapter.requestPasswordReset?.(email.trim());
        if (!result?.success) {
          const error =
            result?.error ??
            config.normalizeError(new Error("Password reset is unavailable."), {
              fallbackTarget: "form",
            });
          handleAdapterError(error, "signIn");
          setErrors(errorForSubmit(error));
          return;
        }

        setNotice(config.ui.copy.forgotPassword.successNotice);
      } catch (error) {
        const normalized = adapter.normalizeError
          ? adapter.normalizeError(error)
          : config.normalizeError(error, { fallbackTarget: "form" });
        handleAdapterError(normalized, "signIn");
        setErrors(errorForSubmit(normalized));
      } finally {
        setAction(null);
      }
    });
  }, [adapter, config, email, handleAdapterError, startTransition]);

  return (
    <motion.div className="w-full max-w-md" variants={FORM_VIEW} initial="hidden" animate="visible">
      <motion.header className="mb-6 text-center" variants={FADE_VIEW}>
        <h2
          id={titleId}
          className="mb-2 font-display text-2xl font-medium tracking-tight text-overlay-text"
        >
          {title.length > MAX_STAGGER ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              {title}
            </motion.span>
          ) : (
            title.split("").map((char, index) => (
              <motion.span
                key={`${char}-${index}`}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.02,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                style={{ display: "inline-block", whiteSpace: "pre" }}
              >
                {char}
              </motion.span>
            ))
          )}
        </h2>
        <p id={descId} className="text-sm text-overlay-muted">
          {subtitle.length > MAX_STAGGER ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {subtitle}
            </motion.span>
          ) : (
            subtitle.split(" ").map((word, index) => (
              <span key={`${word}-${index}`} style={{ display: "inline-block", whiteSpace: "pre" }}>
                {word.split("").map((char, subIndex) => (
                  <motion.span
                    key={`${char}-${subIndex}`}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.4,
                      delay: 0.2 + index * 0.05 + subIndex * 0.01,
                      ease: "easeOut",
                    }}
                    style={{ display: "inline-block" }}
                  >
                    {char}
                  </motion.span>
                ))}
                <span> </span>
              </span>
            ))
          )}
        </p>
      </motion.header>

      {hasOAuthProviders && !isResetPassword ? (
        <>
          <OauthButtons
            providers={config.ui.auth.providers}
            layout={config.ui.auth.oauthLayout}
            visibleCount={config.ui.auth.oauthOverflow.visibleCount}
            showPreviewIcons={config.ui.auth.oauthOverflow.showPreviewIcons}
            loadingAction={loadingAction}
            isLoading={isLoading}
            copy={config.ui.copy.oauth}
            onAction={runOAuth}
          />

          <motion.div
            className="mb-6 flex items-center gap-3"
            role="separator"
            aria-orientation="horizontal"
            variants={FADE_VIEW}
          >
            <div className="h-px flex-1 bg-overlay-border/20" aria-hidden="true" />
            <span className="shrink-0 text-xs uppercase tracking-wide text-overlay-muted">
              {config.ui.copy.oauth.divider}
            </span>
            <div className="h-px flex-1 bg-overlay-border/20" aria-hidden="true" />
          </motion.div>
        </>
      ) : null}

      <motion.form
        onSubmit={submitForm}
        className="flex flex-col gap-3"
        noValidate
        variants={SLIDE_VIEW}
      >
        {!isResetPassword && (
          <>
            <AnimatePresence>
              {requiresName ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <label htmlFor={`${titleId}-name`} className="sr-only">
                      Name
                    </label>
                    <input
                      id={`${titleId}-name`}
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(event) => changeName(event.target.value)}
                      required
                      autoComplete="name"
                      aria-invalid={!!nameError || undefined}
                      aria-describedby={nameError ? nameErrorId : undefined}
                      className="relative z-1 h-11 w-full rounded-none border border-overlay-border/20 bg-transparent px-4 text-sm font-normal tracking-[0.01em] text-overlay-text outline-hidden transition-colors placeholder:text-overlay-subtle focus:border-overlay-border/50 aria-invalid:border-overlay-error/35 aria-invalid:focus:border-overlay-error/50"
                    />
                  </div>
                  <ValidationMessage id={nameErrorId} error={nameError} />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <EmailField
              id={`${titleId}-email`}
              value={email}
              onChange={changeEmail}
              onSuggestionAccept={acceptEmail}
              copy={config.ui.copy.fields.email}
              ariaInvalid={!!emailError}
              ariaDescribedBy={emailError ? emailErrorId : undefined}
              autocompleteConfig={config.ui.auth.emailAutocomplete}
            />
            <ValidationMessage id={emailErrorId} error={emailError?.message} />
          </>
        )}

        <div>
          <PasswordField
            id={`${titleId}-password`}
            value={password}
            onChange={changePassword}
            autoComplete={isRegister || isResetPassword ? "new-password" : "current-password"}
            copy={config.ui.copy.fields.password}
            passwordToggle={config.ui.copy.passwordToggle}
            ariaInvalid={!!passwordError}
            ariaDescribedBy={passwordError ? passwordErrorId : undefined}
          />
          <ValidationMessage id={passwordErrorId} error={passwordError?.message} />
        </div>

        <AnimatePresence>
          {((config.ui.auth.allowRegister && isRegister) || isResetPassword) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ConfirmPasswordField
                id={`${titleId}-confirm`}
                value={confirm}
                onChange={changeConfirm}
                copy={config.ui.copy.fields.confirmPassword}
                passwordToggle={config.ui.copy.passwordToggle}
                ariaInvalid={!!confirmError || confirmFeedback?.tone === "error"}
                ariaDescribedBy={
                  confirmError ? confirmErrorId : confirmFeedback ? confirmLiveId : undefined
                }
              />
              <ValidationMessage
                id={confirmError ? confirmErrorId : confirmLiveId}
                error={confirmError?.message ?? confirmFeedback?.message}
                tone={confirmError?.message ? "error" : (confirmFeedback?.tone ?? "success")}
                live={!confirmError && !!confirmFeedback}
                variant={confirmError ? "default" : "chip"}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!isResetPassword && (
          <div className="mb-4 mt-1 flex items-center justify-between px-0.5">
            {config.ui.auth.showRememberMe ? (
              <RememberMe
                checked={rememberMe}
                onChange={setRememberMe}
                label={config.ui.copy.rememberMe.label}
              />
            ) : (
              <span />
            )}

            {!isRegister && config.ui.auth.showForgotPassword && (
              <button
                type="button"
                onClick={resetPassword}
                disabled={isLoading}
                className="text-[0.8125rem] font-medium text-overlay-muted transition-colors hover:text-overlay-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "forgotPassword"
                  ? config.ui.copy.forgotPassword.loading
                  : config.ui.copy.forgotPassword.label}
              </button>
            )}
          </div>
        )}

        <ValidationMessage id={formErrorId} error={formError?.message} />
        <ValidationMessage id={`${errorBaseId}-notice`} tone="success" error={notice} />
        <ValidationMessage id={oauthErrorId} error={oauthError?.message} />

        <AuthButton
          type="submit"
          variant="primary"
          isLoading={loadingAction === "email"}
          disabled={isLoading}
        >
          {formCopy.submit}
        </AuthButton>

        {(config.ui.auth.allowRegister || isResetPassword) && (
          <motion.p
            className="mt-4 flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center text-sm text-overlay-muted"
            variants={SLIDE_VIEW}
          >
            <span>{formCopy.switchPrompt}</span>
            <button
              type="button"
              onClick={isResetPassword ? () => { setMode("login"); setErrors(EMPTY_AUTH_ERRORS); setNotice(""); } : switchMode}
              className="cursor-pointer rounded-sm px-1 text-overlay-text underline underline-offset-4 transition-colors hover:text-overlay-text/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-overlay-border/20"
            >
              {formCopy.switchAction}
            </button>
          </motion.p>
        )}
      </motion.form>

      {config.ui.auth.showFooter &&
        (config.ui.footer ?? (
          <AuthFooter segments={config.ui.copy.footer.segments} />
        ))}
    </motion.div>
  );
}

/**
 * Memoized auth form.
 *
 * @returns Complete credential and OAuth form.
 */
export const LoginForm = memo(Form);
