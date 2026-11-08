import { memo, useId, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EASE_OUT,
  MAX_STAGGER,
  createAuthFormController,
  type AuthSuccessAction,
} from "@remcostoeten/auth-drawer/core";
import type { AuthAdapter, ResolvedAuthConfig } from "../types";
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { useStore } from "../hooks/use-store";
import { AuthButton } from "./auth-button";
import { AuthFooter } from "./auth-footer";
import { ConfirmPasswordField } from "./confirm-password-field";
import { EmailField } from "./email-field";
import { MagicLinkSent } from "./magic-link-sent";
import { OauthButtons } from "./oauth-buttons";
import { PasskeyButton } from "./passkey-button";
import { PasswordField } from "./password-field";
import { RememberMe } from "./remember-me";
import { ValidationMessage } from "./validation-message";

type Props = {
  onSubmitSuccess: (action: AuthSuccessAction) => void;
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

function fieldErrorId(base: string, field: string) {
  return `${base}-${field}-error`;
}

function Form({
  onSubmitSuccess,
  onAdapterSuccess,
  onAdapterError,
  adapter,
  titleId,
  descId,
  config,
}: Props) {
  const [controller] = useState(() =>
    createAuthFormController({
      adapter,
      config,
      onSubmitSuccess,
      onAdapterSuccess,
      onAdapterError,
    }),
  );

  useIsomorphicLayoutEffect(() => {
    controller.updateInputs({
      adapter,
      config,
      onSubmitSuccess,
      onAdapterSuccess,
      onAdapterError,
    });
  });

  useIsomorphicLayoutEffect(() => {
    controller.hydrate();
  }, [controller]);

  const state = useStore(controller);
  const errorBaseId = useId();
  const {
    email,
    name,
    password,
    confirm,
    rememberMe,
    mode,
    errors,
    nameError,
    notice,
    loadingAction,
    magicLinkSentTo,
    resendSeconds,
    oauthSuccessProvider,
    passkeySucceeded,
    lastUsed,
    isRegister,
    isResetPassword,
    isMagicLink,
    isMagicLinkSent,
    requiresName,
    showMagicLinkSwitch,
    passkeyAvailable,
    oauthProviders,
    title,
    subtitle,
    submitLabel,
    confirmFeedback,
    buttonFeedback,
    isLoading,
  } = state;

  const lastUsedLabel = config.ui.copy.lastUsed.label;
  const magicLinkCopy = config.ui.copy.magicLink;
  const formCopy = isResetPassword
    ? config.ui.copy.resetPassword
    : isRegister
      ? config.ui.copy.register
      : config.ui.copy.login;
  const emailErrorId = fieldErrorId(errorBaseId, "email");
  const nameErrorId = fieldErrorId(errorBaseId, "name");
  const passwordErrorId = fieldErrorId(errorBaseId, "password");
  const confirmErrorId = fieldErrorId(errorBaseId, "confirm");
  const confirmLiveId = fieldErrorId(errorBaseId, "confirm-live");
  const oauthErrorId = fieldErrorId(errorBaseId, "oauth");
  const hasOAuthProviders = oauthProviders.length > 0;
  const emailError = errors.fields.email;
  const passwordError = errors.fields.password;
  const confirmError = errors.fields.confirmPassword;
  const formError = errors.form;
  const oauthError = errors.oauth;

  function submitForm(event: FormEvent) {
    event.preventDefault();
    controller.submit();
  }

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

      {hasOAuthProviders && !isResetPassword && !isMagicLinkSent ? (
        <>
          <OauthButtons
            providers={oauthProviders}
            layout={config.ui.auth.oauthLayout}
            visibleCount={config.ui.auth.oauthOverflow.visibleCount}
            showPreviewIcons={config.ui.auth.oauthOverflow.showPreviewIcons}
            loadingAction={loadingAction}
            isLoading={isLoading}
            copy={config.ui.copy.oauth}
            onAction={controller.runOAuth}
            successProvider={oauthSuccessProvider}
            successMessage={config.ui.success.messages.oauth}
            lastUsedProvider={
              lastUsed !== null &&
              lastUsed !== "email" &&
              lastUsed !== "magicLink" &&
              lastUsed !== "passkey"
                ? lastUsed
                : null
            }
            lastUsedLabel={lastUsedLabel}
          />
          <ValidationMessage id={oauthErrorId} error={oauthError?.message} />
        </>
      ) : null}

      {passkeyAvailable && !isResetPassword && !isMagicLinkSent ? (
        <PasskeyButton
          label={config.ui.copy.passkey.continueWith}
          isLoading={loadingAction === "passkey"}
          disabled={isLoading}
          onAction={controller.runPasskey}
          feedback={
            passkeySucceeded
              ? { status: "success", message: config.ui.success.messages.passkey }
              : undefined
          }
          badge={lastUsed === "passkey" ? lastUsedLabel : undefined}
        />
      ) : null}

      {(hasOAuthProviders || passkeyAvailable) && !isResetPassword && !isMagicLinkSent ? (
        <>
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

      {isMagicLinkSent ? (
        <MagicLinkSent
          email={magicLinkSentTo}
          copy={magicLinkCopy}
          cooldownSeconds={resendSeconds}
          isSending={loadingAction === "email"}
          onResend={() => controller.sendMagicLink(magicLinkSentTo)}
          onUseAnotherEmail={controller.useAnotherEmail}
          errorMessage={formError?.message}
        />
      ) : (
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
                        onChange={(event) => controller.setName(event.target.value)}
                        required
                        autoComplete="name"
                        aria-invalid={!!nameError || undefined}
                        aria-describedby={nameError ? nameErrorId : undefined}
                        className="relative z-1 h-11 w-full rounded-none border border-overlay-border/20 bg-transparent px-4 text-sm font-normal tracking-[0.01em] text-overlay-text outline-hidden transition-colors placeholder:text-overlay-subtle focus:border-overlay-focus/40 aria-invalid:border-overlay-error/35 aria-invalid:focus:border-overlay-error/50"
                      />
                    </div>
                    <ValidationMessage id={nameErrorId} error={nameError} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <EmailField
                id={`${titleId}-email`}
                value={email}
                onChange={controller.setEmail}
                onSuggestionAccept={controller.acceptEmailSuggestion}
                copy={config.ui.copy.fields.email}
                ariaInvalid={!!emailError}
                ariaDescribedBy={emailError ? emailErrorId : undefined}
                autocompleteConfig={config.ui.auth.emailAutocomplete}
              />
              <ValidationMessage id={emailErrorId} error={emailError?.message} />
            </>
          )}

          {!isMagicLink && (
            <div>
              <PasswordField
                id={`${titleId}-password`}
                value={password}
                onChange={controller.setPassword}
                autoComplete={isRegister || isResetPassword ? "new-password" : "current-password"}
                copy={config.ui.copy.fields.password}
                passwordToggle={config.ui.copy.passwordToggle}
                ariaInvalid={!!passwordError}
                ariaDescribedBy={passwordError ? passwordErrorId : undefined}
              />
              <ValidationMessage id={passwordErrorId} error={passwordError?.message} />
            </div>
          )}

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
                  onChange={controller.setConfirm}
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

          {!isResetPassword && !isMagicLink && (
            <div className="mb-4 mt-1 flex items-center justify-between px-0.5">
              {config.ui.auth.showRememberMe ? (
                <RememberMe
                  checked={rememberMe}
                  onChange={controller.setRememberMe}
                  label={config.ui.copy.rememberMe.label}
                />
              ) : (
                <span />
              )}

              {!isRegister && config.ui.auth.showForgotPassword && (
                <button
                  type="button"
                  onClick={controller.requestPasswordReset}
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

          {/* Screen reader announcements for form-level feedback */}
          {formError && (
            <span className="sr-only" role="alert" aria-live="assertive">
              {formError.message}
            </span>
          )}
          {notice && !formError && (
            <span className="sr-only" role="status" aria-live="polite">
              {notice}
            </span>
          )}

          <AuthButton
            type="submit"
            variant="primary"
            isLoading={loadingAction === "email"}
            disabled={isLoading}
            feedback={buttonFeedback}
            badge={
              (isMagicLink && lastUsed === "magicLink") ||
              (mode === "login" && lastUsed === "email")
                ? lastUsedLabel
                : undefined
            }
          >
            {submitLabel}
          </AuthButton>

          {showMagicLinkSwitch && (
            <motion.button
              type="button"
              onClick={controller.toggleMagicLink}
              className="mt-3 cursor-pointer self-center rounded-sm px-1 text-sm text-overlay-muted underline underline-offset-4 transition-colors hover:text-overlay-text focus-visible:outline-hidden focus-visible:text-overlay-focus"
              variants={SLIDE_VIEW}
            >
              {isMagicLink ? magicLinkCopy.switchToPassword : magicLinkCopy.switchToLink}
            </motion.button>
          )}

          {(config.ui.auth.allowRegister || isResetPassword) && !isMagicLink && (
            <motion.p
              className="mt-4 flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center text-sm text-overlay-muted"
              variants={SLIDE_VIEW}
            >
              <span>{formCopy.switchPrompt}</span>
              <button
                type="button"
                onClick={isResetPassword ? controller.backToLogin : controller.switchMode}
                className="cursor-pointer rounded-sm px-1 text-overlay-text underline underline-offset-4 transition-colors hover:text-overlay-text/80 focus-visible:outline-hidden focus-visible:text-overlay-focus/70"
              >
                {formCopy.switchAction}
              </button>
            </motion.p>
          )}
        </motion.form>
      )}

      {config.ui.auth.showFooter &&
        (config.ui.footer ?? <AuthFooter segments={config.ui.copy.footer.segments} />)}
    </motion.div>
  );
}

/**
 * Memoized auth form.
 *
 * @returns Complete credential and OAuth form.
 */
export const LoginForm = memo(Form);
