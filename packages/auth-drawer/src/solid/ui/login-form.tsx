import {
  Index,
  Show,
  createEffect,
  createUniqueId,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import {
  MAX_STAGGER,
  createAuthFormController,
  type AuthSuccessAction,
  type LastUsedMethod,
  type OAuthProvider,
} from "@remcostoeten/auth-drawer/core";
import { createControllerState } from "../lib/create-controller-state";
import { cn } from "../lib/cn";
import type { AuthAdapter, ResolvedAuthConfig } from "../types";
import { AuthButton } from "./auth-button";
import { AuthFooter } from "./auth-footer";
import { Collapse } from "./collapse";
import { ConfirmPasswordField } from "./confirm-password-field";
import { EmailField } from "./email-field";
import { INPUT_CLASS } from "./input-styles";
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

function fieldErrorId(base: string, field: string) {
  return `${base}-${field}-error`;
}

function StaggeredTitle(props: { text: string }) {
  return (
    <Show when={props.text} keyed>
      {(text) => (
        <Show
          when={text.length > MAX_STAGGER}
          fallback={
            <Index each={text.split("")}>
              {(char, index) => (
                <span class="auth-title-char" style={{ "--auth-char": index }}>
                  {char()}
                </span>
              )}
            </Index>
          }
        >
          <span class="auth-fade">{text}</span>
        </Show>
      )}
    </Show>
  );
}

function StaggeredSubtitle(props: { text: string }) {
  return (
    <Show when={props.text} keyed>
      {(text) => (
        <Show when={text.length > MAX_STAGGER} fallback={<SubtitleWords text={text} />}>
          <span class="auth-fade">{text}</span>
        </Show>
      )}
    </Show>
  );
}

function SubtitleWords(props: { text: string }) {
  return (
    <Index each={props.text.split(" ")}>
      {(word, wordIndex) => (
        <span class="inline-block whitespace-pre">
          <Index each={word().split("")}>
            {(char, charIndex) => (
              <span
                class="auth-subtitle-char"
                style={{ "--auth-word": wordIndex, "--auth-char": charIndex }}
              >
                {char()}
              </span>
            )}
          </Index>
          <span> </span>
        </span>
      )}
    </Index>
  );
}

function NameField(props: {
  id: string;
  errorId: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <div class="relative">
        <label for={props.id} class="sr-only">
          Name
        </label>
        <input
          id={props.id}
          type="text"
          placeholder="Name"
          value={props.value}
          onInput={(event) => props.onChange(event.currentTarget.value)}
          required
          autocomplete="name"
          aria-invalid={!!props.error || undefined}
          aria-describedby={props.error ? props.errorId : undefined}
          class={cn(INPUT_CLASS, "relative z-1")}
        />
      </div>
      <ValidationMessage id={props.errorId} error={props.error} />
    </>
  );
}

function isOAuthMethod(method: LastUsedMethod | null): method is OAuthProvider {
  return method !== null && method !== "email" && method !== "magicLink" && method !== "passkey";
}

export function LoginForm(props: Props) {
  const controller = createAuthFormController({
    adapter: props.adapter,
    config: props.config,
    onSubmitSuccess: (action) => props.onSubmitSuccess(action),
    onAdapterSuccess: (action) => props.onAdapterSuccess?.(action),
    onAdapterError: (error, action) => props.onAdapterError?.(error, action),
  });
  const state = createControllerState(controller);
  const errorBaseId = createUniqueId();

  createEffect(
    on(
      [() => props.adapter, () => props.config],
      ([adapter, config]) => controller.updateInputs({ adapter, config }),
      { defer: true },
    ),
  );

  onMount(() => controller.hydrate());
  onCleanup(() => controller.destroy());

  const copy = () => props.config.ui.copy;
  const auth = () => props.config.ui.auth;
  const formCopy = () =>
    state().isResetPassword ? copy().resetPassword : state().isRegister ? copy().register : copy().login;
  const separated = () =>
    (state().oauthProviders.length > 0 || state().passkeyAvailable) &&
    !state().isResetPassword &&
    !state().isMagicLinkSent;
  const emailErrorId = fieldErrorId(errorBaseId, "email");
  const nameErrorId = fieldErrorId(errorBaseId, "name");
  const passwordErrorId = fieldErrorId(errorBaseId, "password");
  const confirmErrorId = fieldErrorId(errorBaseId, "confirm");
  const confirmLiveId = fieldErrorId(errorBaseId, "confirm-live");
  const oauthErrorId = fieldErrorId(errorBaseId, "oauth");
  const confirmOpen = () => (auth().allowRegister && state().isRegister) || state().isResetPassword;
  const lastUsedProvider = () => {
    const { lastUsed } = state();
    return isOAuthMethod(lastUsed) ? lastUsed : null;
  };

  function submitForm(event: SubmitEvent) {
    event.preventDefault();
    controller.submit();
  }

  return (
    <div
      class="auth-rise w-full max-w-md"
      style={{ "--auth-rise-y": "10px", "animation-delay": "0s" }}
    >
      <header class="auth-fade mb-6 text-center" style={{ "--auth-i": 0 }}>
        <h2
          id={props.titleId}
          class="mb-2 font-display text-2xl font-medium tracking-tight text-overlay-text"
        >
          <StaggeredTitle text={state().title} />
        </h2>
        <p id={props.descId} class="text-sm text-overlay-muted">
          <StaggeredSubtitle text={state().subtitle} />
        </p>
      </header>

      <Show
        when={
          state().oauthProviders.length > 0 && !state().isResetPassword && !state().isMagicLinkSent
        }
      >
        <OauthButtons
          providers={state().oauthProviders}
          layout={auth().oauthLayout}
          visibleCount={auth().oauthOverflow.visibleCount}
          showPreviewIcons={auth().oauthOverflow.showPreviewIcons}
          loadingAction={state().loadingAction}
          isLoading={state().isLoading}
          copy={copy().oauth}
          onAction={controller.runOAuth}
          successProvider={state().oauthSuccessProvider}
          successMessage={props.config.ui.success.messages.oauth}
          lastUsedProvider={lastUsedProvider()}
          lastUsedLabel={copy().lastUsed.label}
        />
        <ValidationMessage id={oauthErrorId} error={state().errors.oauth?.message} />
      </Show>

      <Show when={state().passkeyAvailable && !state().isResetPassword && !state().isMagicLinkSent}>
        <PasskeyButton
          label={copy().passkey.continueWith}
          isLoading={state().loadingAction === "passkey"}
          disabled={state().isLoading}
          onAction={controller.runPasskey}
          feedback={
            state().passkeySucceeded
              ? { status: "success", message: props.config.ui.success.messages.passkey }
              : undefined
          }
          badge={state().lastUsed === "passkey" ? copy().lastUsed.label : undefined}
        />
      </Show>

      <Show when={separated()}>
        <div
          class="auth-fade mb-6 flex items-center gap-3"
          style={{ "--auth-i": 3 }}
          role="separator"
          aria-orientation="horizontal"
        >
          <div class="h-px flex-1 bg-overlay-border/20" aria-hidden="true" />
          <span class="shrink-0 text-xs uppercase tracking-wide text-overlay-muted">
            {copy().oauth.divider}
          </span>
          <div class="h-px flex-1 bg-overlay-border/20" aria-hidden="true" />
        </div>
      </Show>

      <Show
        when={!state().isMagicLinkSent}
        fallback={
          <MagicLinkSent
            email={state().magicLinkSentTo ?? ""}
            copy={copy().magicLink}
            cooldownSeconds={state().resendSeconds}
            isSending={state().loadingAction === "email"}
            onResend={() => controller.sendMagicLink(state().magicLinkSentTo ?? undefined)}
            onUseAnotherEmail={controller.useAnotherEmail}
            errorMessage={state().errors.form?.message}
          />
        }
      >
        <form
          onSubmit={submitForm}
          class="auth-rise flex flex-col gap-3"
          style={{ "--auth-i": 4 }}
          noValidate
        >
          <Show when={!state().isResetPassword}>
            <Collapse open={state().requiresName}>
              <NameField
                id={`${props.titleId}-name`}
                errorId={nameErrorId}
                value={state().name}
                error={state().nameError}
                onChange={controller.setName}
              />
            </Collapse>
            <EmailField
              id={`${props.titleId}-email`}
              value={state().email}
              onChange={controller.setEmail}
              onSuggestionAccept={controller.acceptEmailSuggestion}
              copy={copy().fields.email}
              ariaInvalid={!!state().errors.fields.email}
              ariaDescribedBy={state().errors.fields.email ? emailErrorId : undefined}
              autocompleteConfig={auth().emailAutocomplete}
            />
            <ValidationMessage id={emailErrorId} error={state().errors.fields.email?.message} />
          </Show>

          <Show when={!state().isMagicLink}>
            <div>
              <PasswordField
                id={`${props.titleId}-password`}
                value={state().password}
                onChange={controller.setPassword}
                autoComplete={
                  state().isRegister || state().isResetPassword ? "new-password" : "current-password"
                }
                copy={copy().fields.password}
                passwordToggle={copy().passwordToggle}
                ariaInvalid={!!state().errors.fields.password}
                ariaDescribedBy={state().errors.fields.password ? passwordErrorId : undefined}
              />
              <ValidationMessage
                id={passwordErrorId}
                error={state().errors.fields.password?.message}
              />
            </div>
          </Show>

          <Collapse open={confirmOpen()}>
            <ConfirmPasswordField
              id={`${props.titleId}-confirm`}
              value={state().confirm}
              onChange={controller.setConfirm}
              copy={copy().fields.confirmPassword}
              passwordToggle={copy().passwordToggle}
              ariaInvalid={
                !!state().errors.fields.confirmPassword || state().confirmFeedback?.tone === "error"
              }
              ariaDescribedBy={
                state().errors.fields.confirmPassword
                  ? confirmErrorId
                  : state().confirmFeedback
                    ? confirmLiveId
                    : undefined
              }
            />
            <ValidationMessage
              id={state().errors.fields.confirmPassword ? confirmErrorId : confirmLiveId}
              error={state().errors.fields.confirmPassword?.message ?? state().confirmFeedback?.message}
              tone={
                state().errors.fields.confirmPassword?.message
                  ? "error"
                  : (state().confirmFeedback?.tone ?? "success")
              }
              live={!state().errors.fields.confirmPassword && !!state().confirmFeedback}
              variant={state().errors.fields.confirmPassword ? "default" : "chip"}
            />
          </Collapse>

          <Show when={!state().isResetPassword && !state().isMagicLink}>
            <div class="mb-4 mt-1 flex items-center justify-between px-0.5">
              <Show when={auth().showRememberMe} fallback={<span />}>
                <RememberMe
                  checked={state().rememberMe}
                  onChange={controller.setRememberMe}
                  label={copy().rememberMe.label}
                />
              </Show>

              <Show when={!state().isRegister && auth().showForgotPassword}>
                <button
                  type="button"
                  onClick={() => controller.requestPasswordReset()}
                  disabled={state().isLoading}
                  class="text-[0.8125rem] font-medium text-overlay-muted transition-colors hover:text-overlay-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state().loadingAction === "forgotPassword"
                    ? copy().forgotPassword.loading
                    : copy().forgotPassword.label}
                </button>
              </Show>
            </div>
          </Show>

          <Show when={state().errors.form}>
            {(formError) => (
              <span class="sr-only" role="alert" aria-live="assertive">
                {formError().message}
              </span>
            )}
          </Show>
          <Show when={state().notice && !state().errors.form}>
            <span class="sr-only" role="status" aria-live="polite">
              {state().notice}
            </span>
          </Show>

          <AuthButton
            type="submit"
            variant="primary"
            isLoading={state().loadingAction === "email"}
            disabled={state().isLoading}
            feedback={state().buttonFeedback}
            badge={
              (state().isMagicLink && state().lastUsed === "magicLink") ||
              (state().mode === "login" && state().lastUsed === "email")
                ? copy().lastUsed.label
                : undefined
            }
          >
            {state().submitLabel}
          </AuthButton>

          <Show when={state().showMagicLinkSwitch}>
            <button
              type="button"
              onClick={() => controller.toggleMagicLink()}
              class="auth-rise mt-3 cursor-pointer self-center rounded-sm px-1 text-sm text-overlay-muted underline underline-offset-4 transition-colors hover:text-overlay-text focus-visible:outline-hidden focus-visible:text-overlay-focus"
              style={{ "--auth-i": 0 }}
            >
              {state().isMagicLink ? copy().magicLink.switchToPassword : copy().magicLink.switchToLink}
            </button>
          </Show>

          <Show when={(auth().allowRegister || state().isResetPassword) && !state().isMagicLink}>
            <p
              class="mt-4 flex w-full flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center text-sm text-overlay-muted"
            >
              <span>{formCopy().switchPrompt}</span>
              <button
                type="button"
                onClick={() =>
                  state().isResetPassword ? controller.backToLogin() : controller.switchMode()
                }
                class="cursor-pointer rounded-sm px-1 text-overlay-text underline underline-offset-4 transition-colors hover:text-overlay-text/80 focus-visible:outline-hidden focus-visible:text-overlay-focus/70"
              >
                {formCopy().switchAction}
              </button>
            </p>
          </Show>
        </form>
      </Show>

      <Show when={auth().showFooter}>
        {props.config.ui.footer ?? <AuthFooter segments={copy().footer.segments} />}
      </Show>
    </div>
  );
}
