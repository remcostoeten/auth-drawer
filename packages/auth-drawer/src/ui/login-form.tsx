import { memo, useCallback, useId, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EMPTY_AUTH_ERRORS,
  type AuthErrorState,
  type AuthUiError,
  hasAuthErrors,
  mergeAuthErrors,
} from "../auth-errors";
import type { FormMode, LoadingAction, OAuthProvider, ResolvedAuthConfig } from "../types";
import { EASE_OUT, MAX_STAGGER } from "../constants";
import { useRememberMe } from "../hooks/use-remember-me";
import { getPasswordMatchFeedback, validateCredentials } from "../validation";
import { AuthButton } from "./auth-button";
import { ConfirmPasswordField } from "./confirm-password-field";
import { EmailField } from "./email-field";
import { OauthButtons } from "./oauth-buttons";
import { PasswordField } from "./password-field";
import { RememberMe } from "./remember-me";
import { ValidationMessage } from "./validation-message";

type Props = {
  onSuccess: () => void;
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
function Form({ onSuccess, titleId, descId, config }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState<FormMode>(
    config.ui.auth.allowRegister ? config.ui.auth.initialMode : "login",
  );
  const [rememberMe, setRememberMe] = useRememberMe();
  const [isLoading, setLoading] = useState(false);
  const [loadingAction, setAction] = useState<LoadingAction>(null);
  const [errors, setErrors] = useState<AuthErrorState>(EMPTY_AUTH_ERRORS);
  const [notice, setNotice] = useState("");
  const errorBaseId = useId();

  const isRegister = mode === "register";
  const title = isRegister ? "Create your account" : "Welcome back";
  const subtitle = isRegister
    ? "Create an account to back up and sync your notes across devices"
    : "Sign in to sync your notes anywhere while keeping local-first saves intact";
  const emailErrorId = fieldErrorId(errorBaseId, "email");
  const passwordErrorId = fieldErrorId(errorBaseId, "password");
  const confirmErrorId = fieldErrorId(errorBaseId, "confirm");
  const confirmLiveId = fieldErrorId(errorBaseId, "confirm-live");
  const formErrorId = fieldErrorId(errorBaseId, "form");
  const oauthErrorId = fieldErrorId(errorBaseId, "oauth");
  const hasOAuthProviders = config.ui.auth.providers.length > 0;
  const emailError = errors.fields.email;
  const passwordError = errors.fields.password;
  const confirmError = errors.fields.confirmPassword;
  const confirmFeedback = config.ui.auth.showLivePasswordMatch
    ? getPasswordMatchFeedback({
        mode,
        password,
        confirmPassword: confirm,
      })
    : null;
  const formError = errors.form;
  const oauthError = errors.oauth;

  const runOAuth = useCallback(
    async (provider: OAuthProvider) => {
      setLoading(true);
      setAction(provider);
      setErrors(EMPTY_AUTH_ERRORS);
      setNotice("");

      try {
        await config.onOAuth(provider);
        onSuccess();
      } catch (error) {
        setErrors(
          errorForSubmit(
            config.normalizeError(error, {
              provider,
              fallbackTarget: "oauth",
            }),
          ),
        );
      } finally {
        setLoading(false);
        setAction(null);
      }
    },
    [config, onSuccess],
  );

  const submitForm = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      const validation = validateCredentials({
        mode,
        email,
        password,
        confirmPassword: confirm,
      });

      if (hasAuthErrors(validation)) {
        setErrors(validation);
        return;
      }

      setLoading(true);
      setAction("email");
      setErrors(EMPTY_AUTH_ERRORS);
      setNotice("");

      try {
        await config.onCredential({
          mode,
          email: email.trim(),
          password,
          rememberMe,
        });
        onSuccess();
      } catch (error) {
        const backendError = config.normalizeError(error, {
          fallbackTarget: "form",
        });
        setErrors(mergeAuthErrors(validation, errorForSubmit(backendError)));
      } finally {
        setLoading(false);
        setAction(null);
      }
    },
    [confirm, config, email, mode, onSuccess, password, rememberMe],
  );

  const switchMode = useCallback(() => {
    setMode((value) => (value === "login" ? "register" : "login"));
    setErrors(EMPTY_AUTH_ERRORS);
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

  const resetPassword = useCallback(async () => {
    const validation = validateCredentials({
      mode: "login",
      email,
      password: "placeholder-password",
    });

    if (validation.fields.email) {
      setErrors({ fields: { email: validation.fields.email } });
      return;
    }

    setLoading(true);
    setAction("forgotPassword");
    setErrors(EMPTY_AUTH_ERRORS);
    setNotice("");

    try {
      await config.onForgotPassword(email.trim());
      setNotice("If an account exists, password reset instructions were sent.");
    } catch (error) {
      setErrors(
        errorForSubmit(
          config.normalizeError(error, {
            fallbackTarget: "form",
          }),
        ),
      );
    } finally {
      setLoading(false);
      setAction(null);
    }
  }, [config, email]);

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

      {hasOAuthProviders ? (
        <>
          <OauthButtons
            providers={config.ui.auth.providers}
            layout={config.ui.auth.oauthLayout}
            loadingAction={loadingAction}
            isLoading={isLoading}
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
              Or continue with email
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
        <EmailField
          id={`${titleId}-email`}
          value={email}
          onChange={changeEmail}
          onSuggestionAccept={acceptEmail}
          ariaInvalid={!!emailError}
          ariaDescribedBy={emailError ? emailErrorId : undefined}
        />
        <ValidationMessage id={emailErrorId} error={emailError?.message} />

        <div>
          <PasswordField
            id={`${titleId}-password`}
            value={password}
            onChange={changePassword}
            autoComplete={isRegister ? "new-password" : "current-password"}
            ariaInvalid={!!passwordError}
            ariaDescribedBy={passwordError ? passwordErrorId : undefined}
          />
          <ValidationMessage id={passwordErrorId} error={passwordError?.message} />
        </div>

        <AnimatePresence>
          {config.ui.auth.allowRegister && isRegister && (
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

        <div className="mb-4 mt-1 flex items-center justify-between px-0.5">
          {config.ui.auth.showRememberMe ? (
            <RememberMe checked={rememberMe} onChange={setRememberMe} />
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
              {loadingAction === "forgotPassword" ? "Sending..." : "Forgot password?"}
            </button>
          )}
        </div>

        <ValidationMessage id={formErrorId} error={formError?.message} />
        <ValidationMessage id={`${errorBaseId}-notice`} tone="success" error={notice} />
        <ValidationMessage id={oauthErrorId} error={oauthError?.message} />

        <AuthButton
          type="submit"
          variant="primary"
          isLoading={loadingAction === "email"}
          disabled={isLoading}
        >
          {isRegister ? "Create account" : "Sign in"}
        </AuthButton>

        {config.ui.auth.allowRegister && (
          <motion.p
            className="mt-4 flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center text-sm text-overlay-muted"
            variants={SLIDE_VIEW}
          >
            <span>{isRegister ? "Already have an account?" : "Don't have an account?"}</span>
            <button
              type="button"
              onClick={switchMode}
              className="cursor-pointer rounded-sm px-1 text-overlay-text underline underline-offset-4 transition-colors hover:text-overlay-text/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-overlay-border/20"
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </motion.p>
        )}
      </motion.form>

      <motion.p
        className="mx-auto mt-5 max-w-sm text-center text-[0.6875rem] leading-relaxed text-overlay-subtle"
        variants={FADE_VIEW}
      >
        By creating an account or signing in, you agree to our{" "}
        <a href="#" className="underline transition-colors hover:text-overlay-muted">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="underline transition-colors hover:text-overlay-muted">
          Privacy Policy
        </a>
        .
      </motion.p>
    </motion.div>
  );
}

/**
 * Memoized auth form.
 *
 * @returns Complete credential and OAuth form.
 */
export const LoginForm = memo(Form);
