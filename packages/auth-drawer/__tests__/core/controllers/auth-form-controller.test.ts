import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_COPY,
  LAST_USED_KEY,
  REMEMBER_KEY,
  clearLastUsedMethod,
  createAuthFormController,
  readLastUsedMethod,
  type AuthAdapter,
  type AuthAction,
  type AuthConfig,
  type AuthFormController,
} from "../../../src/core";
import { deferred, fail, makeAdapter, ok, resolveFor } from "../helpers";

type Setup = {
  adapter: AuthAdapter;
  form: AuthFormController;
  onSubmitSuccess: ReturnType<typeof vi.fn>;
  onAdapterSuccess: ReturnType<typeof vi.fn>;
  onAdapterError: ReturnType<typeof vi.fn>;
};

const opened: AuthFormController[] = [];

function setup(overrides: Partial<AuthAdapter> = {}, config?: AuthConfig): Setup {
  const adapter = makeAdapter(overrides);
  const onSubmitSuccess = vi.fn();
  const onAdapterSuccess = vi.fn();
  const onAdapterError = vi.fn();
  const form = createAuthFormController({
    adapter,
    config: resolveFor(adapter, config),
    onSubmitSuccess,
    onAdapterSuccess,
    onAdapterError,
  });
  form.subscribe(() => undefined);
  opened.push(form);

  return { adapter, form, onSubmitSuccess, onAdapterSuccess, onAdapterError };
}

function fillLogin(form: AuthFormController) {
  form.setEmail("ada@example.com");
  form.setPassword("password123");
}

describe("createAuthFormController", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    opened.splice(0).forEach((form) => form.destroy());
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("starts in login mode with empty fields and derived copy", () => {
      const { form } = setup();
      const state = form.getState();

      expect(state.mode).toBe("login");
      expect(state.email).toBe("");
      expect(state.password).toBe("");
      expect(state.isRegister).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.title).toBe("Welcome back");
      expect(state.submitLabel).toBe("Sign in");
      expect(state.oauthProviders).toEqual(["github", "google"]);
      expect(state.buttonFeedback).toBeUndefined();
    });

    it("prefills demo credentials", () => {
      const { form } = setup({
        demoCredentials: { email: "demo@example.com", password: "demo-pass" },
      });

      expect(form.getState().email).toBe("demo@example.com");
      expect(form.getState().password).toBe("demo-pass");
    });

    it("falls back to login when register is requested but not allowed", () => {
      const { form } = setup({ signUp: undefined }, { ui: { auth: { initialMode: "register" } } });

      expect(form.getState().mode).toBe("login");
    });

    it("degrades a non-array provider list to no OAuth", () => {
      const adapter = makeAdapter();
      const config = resolveFor(adapter);
      config.ui.auth.providers = new Proxy({}, {}) as never;
      const form = createAuthFormController({ adapter, config, onSubmitSuccess: vi.fn() });

      expect(form.getState().oauthProviders).toEqual([]);
    });

    it("returns a new state object only when something changed", () => {
      const { form } = setup();
      const first = form.getState();

      expect(form.getState()).toBe(first);
      form.setEmail("a@b.co");
      expect(form.getState()).not.toBe(first);
      expect(first.email).toBe("");
    });
  });

  describe("field actions", () => {
    it("clears field, form and oauth errors when the email changes", async () => {
      const { form } = setup();
      await form.submit();
      expect(form.getState().errors.fields.email).toBeDefined();

      form.setEmail("ada@example.com");

      expect(form.getState().errors.fields.email).toBeUndefined();
      expect(form.getState().errors.fields.password).toBeDefined();
    });

    it("keeps form errors when a suggestion is accepted", async () => {
      const { form } = setup({ signIn: vi.fn(async () => fail("invalid_credentials", "form")) });
      fillLogin(form);
      await form.submit();
      expect(form.getState().errors.form).toBeDefined();

      form.acceptEmailSuggestion("ada@gmail.com");

      expect(form.getState().email).toBe("ada@gmail.com");
      expect(form.getState().errors.form).toBeDefined();
    });

    it("clears the notice when typing", async () => {
      const { form } = setup();
      form.setEmail("ada@example.com");
      await form.requestPasswordReset();
      expect(form.getState().notice).not.toBe("");

      form.setPassword("x");

      expect(form.getState().notice).toBe("");
    });
  });

  describe("validation", () => {
    it("reports required fields without calling the adapter", async () => {
      const { form, adapter } = setup();

      await form.submit();

      const { errors } = form.getState();
      expect(errors.fields.email?.code).toBe("required");
      expect(errors.fields.password?.code).toBe("required");
      expect(adapter.signIn).not.toHaveBeenCalled();
    });

    it("rejects an invalid email", async () => {
      const { form } = setup();
      form.setEmail("nope");
      form.setPassword("password123");

      await form.submit();

      expect(form.getState().errors.fields.email?.code).toBe("invalid_email");
    });

    it("requires a name when the adapter asks for one in register mode", async () => {
      const { form, adapter } = setup({ requiresName: true });
      form.switchMode();
      fillLogin(form);
      form.setConfirm("password123");

      await form.submit();

      expect(form.getState().requiresName).toBe(true);
      expect(form.getState().nameError).toBe("Enter your name.");
      expect(adapter.signUp).not.toHaveBeenCalled();

      form.setName("Ada");
      expect(form.getState().nameError).toBe("");
    });

    it("flags mismatched and weak passwords in register mode", async () => {
      const { form } = setup();
      form.switchMode();
      form.setEmail("ada@example.com");
      form.setPassword("short");
      form.setConfirm("different");

      await form.submit();

      const { errors } = form.getState();
      expect(errors.fields.password?.code).toBe("weak_password");
      expect(errors.fields.confirmPassword?.code).toBe("password_mismatch");
    });

    it("exposes live password match feedback and honors showLivePasswordMatch", () => {
      const { form } = setup();
      form.switchMode();
      form.setPassword("password123");
      form.setConfirm("password12");
      expect(form.getState().confirmFeedback?.tone).toBe("error");

      form.setConfirm("password123");
      expect(form.getState().confirmFeedback?.tone).toBe("success");

      const off = setup({}, { ui: { auth: { showLivePasswordMatch: false } } });
      off.form.switchMode();
      off.form.setPassword("password123");
      off.form.setConfirm("password123");
      expect(off.form.getState().confirmFeedback).toBeNull();
    });
  });

  describe("sign in and sign up", () => {
    it("signs in with trimmed credentials and reports success in order", async () => {
      const calls: string[] = [];
      const { form, adapter, onSubmitSuccess, onAdapterSuccess } = setup({
        signIn: vi.fn(async () => ok()),
        onSuccess: vi.fn(() => calls.push("adapter")),
      });
      onAdapterSuccess.mockImplementation(() => calls.push("prop"));
      onSubmitSuccess.mockImplementation(() => calls.push("submit"));
      form.setEmail("  ada@example.com ");
      form.setPassword("password123");
      form.setRememberMe(true);

      await form.submit();

      expect(adapter.signIn).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "password123",
        rememberMe: true,
      });
      expect(calls).toEqual(["adapter", "prop", "submit"]);
      expect(onSubmitSuccess).toHaveBeenCalledWith("signIn");
      expect(form.getState().submitSuccessAction).toBe("signIn");
      expect(form.getState().buttonFeedback).toEqual({ status: "success", message: "Signed in" });
      expect(form.getState().loadingAction).toBeNull();
      expect(readLastUsedMethod()).toBe("email");
    });

    it("shows loading while the request is in flight", async () => {
      const pending = deferred<ReturnType<typeof ok>>();
      const { form } = setup({ signIn: vi.fn(() => pending.promise) });
      fillLogin(form);

      const run = form.submit();
      expect(form.getState().loadingAction).toBe("email");
      expect(form.getState().isLoading).toBe(true);

      pending.resolve(ok());
      await run;
      expect(form.getState().isLoading).toBe(false);
    });

    it("signs up with the name and reports signUp", async () => {
      const { form, adapter, onSubmitSuccess } = setup({ requiresName: true });
      form.switchMode();
      form.setName(" Ada ");
      fillLogin(form);
      form.setConfirm("password123");

      await form.submit();

      expect(adapter.signUp).toHaveBeenCalledWith({
        email: "ada@example.com",
        password: "password123",
        rememberMe: false,
        name: "Ada",
      });
      expect(onSubmitSuccess).toHaveBeenCalledWith("signUp");
      expect(form.getState().buttonFeedback?.message).toBe("Account created");
    });

    it.each([
      ["email", "invalid_email", "email"],
      ["password", "weak_password", "password"],
    ] as const)("routes a %s-targeted adapter error to the field", async (field, code, target) => {
      const { form, onAdapterError } = setup({ signIn: vi.fn(async () => fail(code, target)) });
      fillLogin(form);

      await form.submit();

      expect(form.getState().errors.fields[field]?.code).toBe(code);
      expect(form.getState().errors.form).toBeUndefined();
      expect(onAdapterError).toHaveBeenCalledWith(expect.objectContaining({ code }), "signIn");
    });

    it("routes a form-targeted error to the form and button feedback", async () => {
      const { form, onSubmitSuccess } = setup({
        signIn: vi.fn(async () => fail("invalid_credentials", "form")),
      });
      fillLogin(form);

      await form.submit();

      expect(form.getState().errors.form?.code).toBe("invalid_credentials");
      expect(form.getState().buttonFeedback).toEqual({
        status: "error",
        message: "invalid_credentials message",
      });
      expect(onSubmitSuccess).not.toHaveBeenCalled();
      expect(readLastUsedMethod()).toBeNull();
    });

    it("notifies the adapter callback before the prop callback on errors", async () => {
      const calls: string[] = [];
      const { form, onAdapterError } = setup({
        signIn: vi.fn(async () => fail("unknown", "form")),
        onError: vi.fn(() => calls.push("adapter")),
      });
      onAdapterError.mockImplementation(() => calls.push("prop"));
      fillLogin(form);

      await form.submit();

      expect(calls).toEqual(["adapter", "prop"]);
    });

    it("uses adapter.normalizeError for thrown errors", async () => {
      const normalizeError = vi.fn(() => fail("rate_limited", "form").error);
      const { form, onAdapterError } = setup({
        signIn: vi.fn(async () => {
          throw new Error("down");
        }),
        normalizeError,
      });
      fillLogin(form);

      await form.submit();

      expect(normalizeError).toHaveBeenCalled();
      expect(form.getState().errors.form?.code).toBe("rate_limited");
      expect(onAdapterError).toHaveBeenCalledWith(expect.anything(), "signIn");
    });

    it("falls back to the configured normalizer for thrown errors", async () => {
      const { form } = setup({
        signIn: vi.fn(async () => {
          throw new TypeError("Failed to fetch");
        }),
      });
      fillLogin(form);

      await form.submit();

      expect(form.getState().errors.form?.code).toBe("network_error");
    });

    it("reports an unavailable action when the adapter returns nothing", async () => {
      const { form } = setup({ signIn: vi.fn(async () => undefined as never) });
      fillLogin(form);

      await form.submit();

      expect(form.getState().errors.form).toBeDefined();
    });
  });

  describe("password reset", () => {
    it("sends the reset email and shows the configured notice", async () => {
      const { form, adapter } = setup();
      form.setEmail(" ada@example.com ");

      await form.requestPasswordReset();

      expect(adapter.requestPasswordReset).toHaveBeenCalledWith("ada@example.com");
      expect(form.getState().notice).toBe(DEFAULT_COPY.forgotPassword.successNotice);
      expect(form.getState().buttonFeedback).toEqual({
        status: "success",
        message: form.getState().notice,
      });
      expect(form.getState().loadingAction).toBeNull();
    });

    it("validates only the email before requesting a reset", async () => {
      const { form, adapter } = setup();

      await form.requestPasswordReset();

      expect(form.getState().errors.fields.email?.code).toBe("required");
      expect(form.getState().errors.fields.password).toBeUndefined();
      expect(adapter.requestPasswordReset).not.toHaveBeenCalled();
    });

    it("tracks the forgot-password loading action", async () => {
      const pending = deferred<ReturnType<typeof ok>>();
      const { form } = setup({ requestPasswordReset: vi.fn(() => pending.promise) });
      form.setEmail("ada@example.com");

      const run = form.requestPasswordReset();
      expect(form.getState().loadingAction).toBe("forgotPassword");

      pending.resolve(ok());
      await run;
    });

    it("routes reset request errors", async () => {
      const { form, onAdapterError } = setup({
        requestPasswordReset: vi.fn(async () => fail("user_not_found", "email")),
      });
      form.setEmail("ada@example.com");

      await form.requestPasswordReset();

      expect(form.getState().errors.fields.email?.code).toBe("user_not_found");
      expect(onAdapterError).toHaveBeenCalledWith(expect.anything(), "signIn");
    });

    it("returns to login with the exact notice after resetting a password", async () => {
      const { form, adapter } = setup({}, { ui: { auth: { initialMode: "resetPassword" } } });
      form.setPassword("new-password-1");
      form.setConfirm("new-password-1");

      expect(form.getState().isResetPassword).toBe(true);
      await form.submit();

      expect(adapter.resetPassword).toHaveBeenCalledWith({ newPassword: "new-password-1" });
      const state = form.getState();
      expect(state.mode).toBe("login");
      expect(state.password).toBe("");
      expect(state.confirm).toBe("");
      expect(state.notice).toBe("Your password has been reset successfully. Please sign in.");
    });

    it("merges validation and adapter errors when the reset fails", async () => {
      const { form } = setup(
        { resetPassword: vi.fn(async () => fail("weak_password", "password")) },
        { ui: { auth: { initialMode: "resetPassword" } } },
      );
      form.setPassword("new-password-1");
      form.setConfirm("new-password-1");

      await form.submit();

      expect(form.getState().mode).toBe("resetPassword");
      expect(form.getState().errors.fields.password?.code).toBe("weak_password");
    });

    it("goes back to login and clears errors", async () => {
      const { form } = setup({}, { ui: { auth: { initialMode: "resetPassword" } } });
      await form.submit();
      expect(form.getState().errors.fields.password).toBeDefined();

      form.backToLogin();

      expect(form.getState().mode).toBe("login");
      expect(form.getState().errors.fields).toEqual({});
    });
  });

  describe("magic link", () => {
    function magicLinkSetup(signIn = vi.fn(async () => ok()), config?: AuthConfig) {
      return {
        signIn,
        ...setup({ features: { magicLink: { signIn } } }, config),
      };
    }

    it("offers the switch only when the adapter supports it and has a password sign in", () => {
      const withLink = magicLinkSetup();
      expect(withLink.form.getState().magicLinkAvailable).toBe(true);
      expect(withLink.form.getState().showMagicLinkSwitch).toBe(true);

      const disabled = magicLinkSetup(undefined, {
        ui: { auth: { magicLink: { enabled: false } } },
      });
      expect(disabled.form.getState().magicLinkAvailable).toBe(false);

      const passwordless = setup({
        signIn: undefined,
        features: { magicLink: { signIn: vi.fn(async () => ok()) } },
      });
      expect(passwordless.form.getState().mode).toBe("magicLink");
      expect(passwordless.form.getState().showMagicLinkSwitch).toBe(false);
    });

    it("toggles into magic link mode and back", () => {
      const { form } = magicLinkSetup();

      form.toggleMagicLink();
      expect(form.getState().isMagicLink).toBe(true);
      expect(form.getState().submitLabel).toBe(DEFAULT_COPY.magicLink.submit);

      form.toggleMagicLink();
      expect(form.getState().mode).toBe("login");
    });

    it("validates only the email, sends the link and starts the resend countdown", async () => {
      const { form, signIn } = magicLinkSetup();
      form.toggleMagicLink();

      await form.submit();
      expect(form.getState().errors.fields.email?.code).toBe("required");
      expect(signIn).not.toHaveBeenCalled();

      form.setEmail(" ada@example.com ");
      await form.submit();

      expect(signIn).toHaveBeenCalledWith("ada@example.com");
      const state = form.getState();
      expect(state.isMagicLinkSent).toBe(true);
      expect(state.magicLinkSentTo).toBe("ada@example.com");
      expect(state.resendSeconds).toBe(30);
      expect(state.title).toBe(DEFAULT_COPY.magicLink.sentTitle);
      expect(state.subtitle).toContain("ada@example.com");
      expect(readLastUsedMethod()).toBe("magicLink");
    });

    it("counts down once per second and stops at zero", async () => {
      const { form } = magicLinkSetup(undefined, {
        ui: { auth: { magicLink: { resendMs: 3000 } } },
      });
      form.toggleMagicLink();
      form.setEmail("ada@example.com");
      await form.submit();
      expect(form.getState().resendSeconds).toBe(3);

      vi.advanceTimersByTime(1000);
      expect(form.getState().resendSeconds).toBe(2);
      vi.advanceTimersByTime(2000);
      expect(form.getState().resendSeconds).toBe(0);
      vi.advanceTimersByTime(5000);
      expect(form.getState().resendSeconds).toBe(0);
    });

    it("does not restart the countdown when unrelated state changes", async () => {
      const { form } = magicLinkSetup(undefined, {
        ui: { auth: { magicLink: { resendMs: 3000 } } },
      });
      form.toggleMagicLink();
      form.setEmail("ada@example.com");
      await form.submit();

      vi.advanceTimersByTime(900);
      form.setEmail("other@example.com");
      vi.advanceTimersByTime(100);

      expect(form.getState().resendSeconds).toBe(2);
    });

    it("pauses the countdown while nobody is subscribed and resumes on subscribe", async () => {
      const signIn = vi.fn(async () => ok());
      const adapter = makeAdapter({ features: { magicLink: { signIn } } });
      const form = createAuthFormController({
        adapter,
        config: resolveFor(adapter, { ui: { auth: { magicLink: { resendMs: 5000 } } } }),
        onSubmitSuccess: vi.fn(),
      });
      opened.push(form);
      const stop = form.subscribe(() => undefined);
      form.toggleMagicLink();
      form.setEmail("ada@example.com");
      await form.submit();
      expect(form.getState().resendSeconds).toBe(5);

      stop();
      vi.advanceTimersByTime(3000);
      expect(form.getState().resendSeconds).toBe(5);

      form.subscribe(() => undefined);
      vi.advanceTimersByTime(1000);
      expect(form.getState().resendSeconds).toBe(4);
    });

    it("resends to the same address", async () => {
      const { form, signIn } = magicLinkSetup();
      form.toggleMagicLink();
      form.setEmail("ada@example.com");
      await form.submit();

      await form.sendMagicLink();

      expect(signIn).toHaveBeenCalledTimes(2);
      expect(signIn).toHaveBeenLastCalledWith("ada@example.com");
    });

    it("lets the user pick another email", async () => {
      const { form } = magicLinkSetup();
      form.toggleMagicLink();
      form.setEmail("ada@example.com");
      await form.submit();

      form.useAnotherEmail();

      expect(form.getState().isMagicLinkSent).toBe(false);
      expect(form.getState().resendSeconds).toBe(0);
      expect(form.getState().mode).toBe("magicLink");
    });

    it("routes a failed send to the form without recording last used", async () => {
      const { form, onAdapterError } = magicLinkSetup(
        vi.fn(async () => fail("rate_limited", "form")),
      );
      form.toggleMagicLink();
      form.setEmail("ada@example.com");

      await form.submit();

      expect(form.getState().errors.form?.code).toBe("rate_limited");
      expect(form.getState().isMagicLinkSent).toBe(false);
      expect(onAdapterError).toHaveBeenCalledWith(expect.anything(), "signIn");
      expect(readLastUsedMethod()).toBeNull();
    });

    it("does not report adapter success for a sent link", async () => {
      const { form, onAdapterSuccess, onSubmitSuccess } = magicLinkSetup();
      form.toggleMagicLink();
      form.setEmail("ada@example.com");

      await form.submit();

      expect(onAdapterSuccess).not.toHaveBeenCalled();
      expect(onSubmitSuccess).not.toHaveBeenCalled();
    });
  });

  describe("oauth", () => {
    it("signs in with a provider and reports oauth", async () => {
      const { form, adapter, onSubmitSuccess, onAdapterSuccess } = setup();

      await form.runOAuth("github");

      expect(adapter.signInWithOAuth).toHaveBeenCalledWith("github");
      expect(onAdapterSuccess).toHaveBeenCalledWith("oauth");
      expect(onSubmitSuccess).toHaveBeenCalledWith("oauth");
      expect(form.getState().oauthSuccessProvider).toBe("github");
      expect(readLastUsedMethod()).toBe("github");
    });

    it("tracks which provider is loading", async () => {
      const pending = deferred<ReturnType<typeof ok>>();
      const { form } = setup({ signInWithOAuth: vi.fn(() => pending.promise) });

      const run = form.runOAuth("google");
      expect(form.getState().loadingAction).toBe("google");

      pending.resolve(ok());
      await run;
      expect(form.getState().loadingAction).toBeNull();
    });

    it("routes an oauth-targeted error to the oauth slot", async () => {
      const { form, onAdapterError } = setup({
        signInWithOAuth: vi.fn(async () => fail("oauth_cancelled", "oauth")),
      });

      await form.runOAuth("github");

      expect(form.getState().errors.oauth?.code).toBe("oauth_cancelled");
      expect(form.getState().oauthSuccessProvider).toBeNull();
      expect(onAdapterError).toHaveBeenCalledWith(expect.anything(), "oauth");
    });

    it("turns a thrown error into an oauth error", async () => {
      const { form } = setup({
        signInWithOAuth: vi.fn(async () => {
          throw new Error("popup blocked");
        }),
      });

      await form.runOAuth("github");

      expect(form.getState().errors.oauth).toBeDefined();
      expect(form.getState().loadingAction).toBeNull();
    });

    it("clears a previous oauth success when a new attempt starts", async () => {
      const { form } = setup();
      await form.runOAuth("github");

      const pending = deferred<ReturnType<typeof ok>>();
      form.updateInputs({
        adapter: makeAdapter({ signInWithOAuth: vi.fn(() => pending.promise) }),
      });
      const run = form.runOAuth("google");
      expect(form.getState().oauthSuccessProvider).toBeNull();
      pending.resolve(ok());
      await run;
    });
  });

  describe("passkey", () => {
    it("is available only when the adapter implements it and it is enabled", () => {
      const signIn = vi.fn(async () => ok());
      expect(setup({ features: { passkey: { signIn } } }).form.getState().passkeyAvailable).toBe(
        true,
      );
      expect(setup().form.getState().passkeyAvailable).toBe(false);
      expect(
        setup(
          { features: { passkey: { signIn } } },
          { ui: { auth: { passkey: { enabled: false } } } },
        ).form.getState().passkeyAvailable,
      ).toBe(false);
    });

    it("signs in, remembers the method and reports passkey", async () => {
      const signIn = vi.fn(async () => ok());
      const { form, onSubmitSuccess, onAdapterSuccess } = setup({
        features: { passkey: { signIn } },
      });

      await form.runPasskey();

      expect(signIn).toHaveBeenCalled();
      expect(form.getState().passkeySucceeded).toBe(true);
      expect(onAdapterSuccess).toHaveBeenCalledWith("passkey");
      expect(onSubmitSuccess).toHaveBeenCalledWith("passkey");
      expect(readLastUsedMethod()).toBe("passkey");
    });

    it("shows the adapter error on the form when the prompt fails", async () => {
      const { form, onAdapterError } = setup({
        features: { passkey: { signIn: vi.fn(async () => fail("unknown", "form")) } },
      });

      await form.runPasskey();

      expect(form.getState().errors.form?.code).toBe("unknown");
      expect(form.getState().passkeySucceeded).toBe(false);
      expect(onAdapterError).toHaveBeenCalledWith(expect.anything(), "passkey");
    });

    it("normalizes a thrown prompt error", async () => {
      const { form } = setup({
        features: {
          passkey: {
            signIn: vi.fn(async () => {
              throw new Error("NotAllowedError");
            }),
          },
        },
      });

      await form.runPasskey();

      expect(form.getState().errors.form).toBeDefined();
      expect(form.getState().loadingAction).toBeNull();
    });
  });

  describe("mode switching", () => {
    it("switches between login and register and resets transient state", async () => {
      const { form } = setup();
      await form.submit();
      expect(form.getState().errors.fields.email).toBeDefined();

      form.switchMode();

      expect(form.getState().mode).toBe("register");
      expect(form.getState().isRegister).toBe(true);
      expect(form.getState().errors.fields).toEqual({});
      expect(form.getState().title).toBe("Create your account");

      form.switchMode();
      expect(form.getState().mode).toBe("login");
    });
  });

  describe("remember me", () => {
    it("starts unchecked and hydrates from storage after mount", () => {
      localStorage.setItem(REMEMBER_KEY, "true");
      const { form } = setup();
      expect(form.getState().rememberMe).toBe(false);

      form.hydrate();

      expect(form.getState().rememberMe).toBe(true);
    });

    it("persists changes to storage", () => {
      const { form } = setup();

      form.setRememberMe(true);
      expect(localStorage.getItem(REMEMBER_KEY)).toBe("true");

      form.setRememberMe(false);
      expect(localStorage.getItem(REMEMBER_KEY)).toBe("false");
      expect(form.getState().rememberMe).toBe(false);
    });
  });

  describe("last used", () => {
    it("reads the stored method and follows later changes", async () => {
      localStorage.setItem(LAST_USED_KEY, "github");
      const { form } = setup();
      expect(form.getState().lastUsed).toBe("github");

      await form.runOAuth("google");
      expect(form.getState().lastUsed).toBe("google");

      clearLastUsedMethod();
      expect(form.getState().lastUsed).toBeNull();
    });

    it("reads storage on hydrate and on first subscribe, not at construction", () => {
      localStorage.setItem(LAST_USED_KEY, "github");
      const adapter = makeAdapter();
      const form = createAuthFormController({
        adapter,
        config: resolveFor(adapter),
        onSubmitSuccess: vi.fn(),
      });
      opened.push(form);
      expect(form.getState().lastUsed).toBeNull();

      form.hydrate();
      expect(form.getState().lastUsed).toBe("github");

      const other = createAuthFormController({
        adapter,
        config: resolveFor(adapter),
        onSubmitSuccess: vi.fn(),
      });
      opened.push(other);
      other.subscribe(() => undefined);
      expect(other.getState().lastUsed).toBe("github");
    });

    it("hides the method when showLastUsed is off", () => {
      localStorage.setItem(LAST_USED_KEY, "github");
      const { form } = setup({}, { ui: { auth: { showLastUsed: false } } });

      expect(form.getState().lastUsed).toBeNull();
    });
  });

  describe("lifecycle", () => {
    it("notifies subscribers and stops after unsubscribe", () => {
      const { form } = setup();
      const listener = vi.fn();
      const stop = form.subscribe(listener);

      form.setEmail("a@b.co");
      expect(listener).toHaveBeenCalledTimes(1);

      stop();
      form.setEmail("c@d.co");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("ignores adapter results and callbacks after destroy", async () => {
      const pending = deferred<ReturnType<typeof ok>>();
      const { form, onSubmitSuccess, onAdapterSuccess } = setup({
        signIn: vi.fn(() => pending.promise),
      });
      fillLogin(form);

      const run = form.submit();
      const before = form.getState();
      form.destroy();
      pending.resolve(ok());
      await run;

      expect(onSubmitSuccess).not.toHaveBeenCalled();
      expect(onAdapterSuccess).not.toHaveBeenCalled();
      expect(form.getState()).toBe(before);
      expect(readLastUsedMethod()).toBeNull();
    });

    it("clears the countdown timer on destroy", async () => {
      const signIn = vi.fn(async () => ok());
      const { form } = setup({ features: { magicLink: { signIn } } });
      form.toggleMagicLink();
      form.setEmail("ada@example.com");
      await form.submit();

      form.destroy();

      expect(vi.getTimerCount()).toBe(0);
    });

    it("applies new adapter and config through updateInputs", () => {
      const { form } = setup();
      const adapter = makeAdapter({ requiresName: true });
      form.switchMode();
      expect(form.getState().requiresName).toBe(false);

      form.updateInputs({
        adapter,
        config: resolveFor(adapter, { ui: { copy: { register: { title: "Join" } } } }),
      });

      expect(form.getState().requiresName).toBe(true);
      expect(form.getState().title).toBe("Join");
    });

    it("uses updated callbacks without republishing", async () => {
      const { form, onSubmitSuccess } = setup();
      const next = vi.fn();
      const listener = vi.fn();
      form.subscribe(listener);

      form.updateInputs({ onSubmitSuccess: next as (action: AuthAction) => void });
      expect(listener).not.toHaveBeenCalled();

      fillLogin(form);
      await form.submit();
      expect(next).toHaveBeenCalledWith("signIn");
      expect(onSubmitSuccess).not.toHaveBeenCalled();
    });
  });
});
