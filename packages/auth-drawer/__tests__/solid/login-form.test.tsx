import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { REMEMBER_KEY } from "@remcostoeten/auth-drawer/core";
import { AuthDrawer, createAuthError, type AuthAdapter, type AuthConfig } from "../../src/solid";
import {
  click,
  createTestAdapter,
  credentials,
  field,
  findButton,
  flush,
  submitButton,
  type as typeInto,
} from "./helpers";

function renderForm(adapter: AuthAdapter = createTestAdapter(), config?: AuthConfig) {
  return render(() => <AuthDrawer adapter={adapter} hideTrigger defaultOpen config={config} />);
}

function registerAdapter(overrides: Partial<AuthAdapter> = {}) {
  return createTestAdapter({
    signUp: vi.fn(async () => ({ success: true })),
    requestPasswordReset: vi.fn(async () => ({ success: true })),
    ...overrides,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("validation", () => {
  it("shows field errors on an empty submit and does not call the adapter", async () => {
    const adapter = createTestAdapter();
    renderForm(adapter);

    click(submitButton());
    await flush();

    const messages = Array.from(document.body.querySelectorAll('[role="alert"]')).map((node) => node.textContent);
    expect(messages).toContain("Enter your email address.");
    expect(messages).toContain("Enter your password.");
    expect(adapter.signIn).not.toHaveBeenCalled();
    expect(field('input[type="email"]').getAttribute("aria-invalid")).toBe("true");
    expect(field('input[type="email"]').getAttribute("aria-describedby")).toBe(
      document.body.querySelector('[role="alert"]')?.id,
    );
  });

  it("clears the email error when the user types", async () => {
    renderForm();
    click(submitButton());
    await flush();

    typeInto('input[type="email"]', "a");

    expect(field('input[type="email"]').getAttribute("aria-invalid")).toBeNull();
  });

  it("shows a failed sign in on the submit button and as an alert for screen readers", async () => {
    const adapter = createTestAdapter({
      signIn: vi.fn(async () => ({ success: false, error: createAuthError("invalid_credentials", "form") })),
    });
    renderForm(adapter);

    typeInto('input[type="email"]', credentials.email);
    typeInto('input[type="password"]', credentials.password);
    click(submitButton());
    await flush();

    expect(submitButton().dataset.feedbackStatus).toBe("error");
    expect(document.body.querySelector('.sr-only[role="alert"]')).toBeTruthy();
  });

  it("routes a field-targeted adapter error to that field", async () => {
    const adapter = createTestAdapter({
      signIn: vi.fn(async () => ({
        success: false,
        error: createAuthError("email_taken", "email", { message: "That email is taken." }),
      })),
    });
    renderForm(adapter);

    typeInto('input[type="email"]', credentials.email);
    typeInto('input[type="password"]', credentials.password);
    click(submitButton());
    await flush();

    expect(field('input[type="email"]').getAttribute("aria-invalid")).toBe("true");
    expect(document.body.textContent).toContain("That email is taken.");
  });
});

describe("register mode", () => {
  it("switches to register and shows the confirm password field", () => {
    renderForm(registerAdapter());

    expect(document.body.querySelectorAll('input[type="password"]')).toHaveLength(1);

    click(findButton("Register"));

    expect(document.body.querySelector("h2")?.textContent).toBe("Create your account");
    expect(document.body.querySelectorAll('input[type="password"]')).toHaveLength(2);
    expect(submitButton().textContent).toContain("Create account");
  });

  it("collapses the confirm password field when switching back", async () => {
    vi.useFakeTimers();
    renderForm(registerAdapter());

    click(findButton("Register"));
    click(findButton("Sign in"));
    expect(document.body.querySelector("[data-state='closing']")).toBeTruthy();

    await vi.advanceTimersByTimeAsync(250);

    expect(document.body.querySelectorAll('input[type="password"]')).toHaveLength(1);
  });

  it("shows the name field only for adapters that require a name", () => {
    const first = renderForm(registerAdapter());
    click(findButton("Register"));
    expect(document.body.querySelector('input[autocomplete="name"]')).toBeNull();
    first.unmount();

    renderForm(registerAdapter({ requiresName: true }));
    expect(document.body.querySelector('input[autocomplete="name"]')).toBeNull();
    click(findButton("Register"));
    expect(document.body.querySelector('input[autocomplete="name"]')).toBeTruthy();
  });

  it("asks for a name before signing up and passes it to the adapter", async () => {
    const signUp = vi.fn(async () => ({ success: true }));
    renderForm(registerAdapter({ requiresName: true, signUp }));
    click(findButton("Register"));

    typeInto('input[type="email"]', "ada@example.com");
    const [password, confirm] = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="password"]'));
    fireEvent.input(password, { target: { value: "password123" } });
    fireEvent.input(confirm, { target: { value: "password123" } });

    click(submitButton());
    await flush();
    expect(document.body.textContent).toContain("Enter your name.");
    expect(signUp).not.toHaveBeenCalled();

    typeInto('input[autocomplete="name"]', "Ada");
    click(submitButton());
    await flush();

    expect(signUp).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "password123",
      rememberMe: false,
      name: "Ada",
    });
  });

  it("shows a live password match chip while typing the confirmation", () => {
    renderForm(registerAdapter());
    click(findButton("Register"));
    const [password, confirm] = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="password"]'));

    fireEvent.input(password, { target: { value: "password123" } });
    fireEvent.input(confirm, { target: { value: "password12" } });
    expect(document.body.textContent).toContain("Passwords do not match.");
    expect(confirm.getAttribute("aria-invalid")).toBe("true");

    fireEvent.input(confirm, { target: { value: "password123" } });
    const chip = Array.from(document.body.querySelectorAll("p")).find((node) => node.textContent === "Passwords match.");
    expect(chip?.className).toContain("rounded-full");
    expect(chip?.getAttribute("role")).toBe("status");
    expect(chip?.getAttribute("aria-live")).toBe("polite");
  });

  it("hides the live match chip when showLivePasswordMatch is off", () => {
    renderForm(registerAdapter(), { ui: { auth: { showLivePasswordMatch: false } } });
    click(findButton("Register"));
    const [password, confirm] = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="password"]'));

    fireEvent.input(password, { target: { value: "password123" } });
    fireEvent.input(confirm, { target: { value: "different" } });

    expect(document.body.textContent).not.toContain("Passwords do not match.");
  });

  it("signs up and reports the signUp action", async () => {
    const onSuccess = vi.fn();
    const signUp = vi.fn(async () => ({ success: true }));
    render(() => (
      <AuthDrawer adapter={registerAdapter({ signUp })} hideTrigger defaultOpen onSuccess={onSuccess} />
    ));
    click(findButton("Register"));
    const [password, confirm] = Array.from(document.body.querySelectorAll<HTMLInputElement>('input[type="password"]'));

    typeInto('input[type="email"]', "ada@example.com");
    fireEvent.input(password, { target: { value: "password123" } });
    fireEvent.input(confirm, { target: { value: "password123" } });
    click(submitButton());
    await flush();

    expect(signUp).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("signUp");
    expect(submitButton().textContent).toContain("Account created");
  });
});

describe("forgot password", () => {
  it("requests a reset for the typed email and announces the notice", async () => {
    const requestPasswordReset = vi.fn(async () => ({ success: true }));
    renderForm(registerAdapter({ requestPasswordReset }));

    typeInto('input[type="email"]', "ada@example.com");
    click(findButton("Forgot password?"));
    await flush();

    expect(requestPasswordReset).toHaveBeenCalledWith("ada@example.com");
    expect(document.body.querySelector('.sr-only[role="status"]')?.textContent).toBe(
      "If an account exists, password reset instructions were sent.",
    );
    expect(submitButton().dataset.feedbackStatus).toBe("success");
  });

  it("asks for the email first when the field is empty", async () => {
    const requestPasswordReset = vi.fn(async () => ({ success: true }));
    renderForm(registerAdapter({ requestPasswordReset }));

    click(findButton("Forgot password?"));
    await flush();

    expect(requestPasswordReset).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("Enter your email address.");
  });

  it("hides the link when the adapter cannot reset passwords or config turns it off", () => {
    const first = renderForm(createTestAdapter());
    expect(findButton("Forgot password?")).toBeUndefined();
    first.unmount();

    renderForm(registerAdapter(), { ui: { auth: { showForgotPassword: false } } });
    expect(findButton("Forgot password?")).toBeUndefined();
  });
});

describe("fields", () => {
  it("toggles password visibility and labels the button for the next action", () => {
    renderForm();
    const input = field('input[type="password"]');
    const toggle = findButton("Show password") as HTMLButtonElement;

    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    click(toggle);

    expect(input.type).toBe("text");
    expect(toggle.getAttribute("aria-label")).toBe("Hide password");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    click(toggle);
    expect(input.type).toBe("password");
  });

  it("completes the email domain inline and accepts it with Tab", () => {
    renderForm();
    const email = field('input[type="email"]');

    typeInto('input[type="email"]', "ada@gm");
    const ghost = document.body.querySelector(".pointer-events-none.absolute.inset-0");
    expect(ghost?.textContent).toContain("ada@gm");
    expect(ghost?.textContent).toContain("ail.com");
    expect(document.body.querySelector("kbd")?.textContent).toBe("Tab");

    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    email.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(true);
    expect(email.value).toBe("ada@gmail.com");
    expect(document.body.querySelector("kbd")).toBeNull();
  });

  it("does not suggest a domain when autocomplete is disabled", () => {
    renderForm(createTestAdapter(), { ui: { auth: { emailAutocomplete: { enabled: false } } } });

    typeInto('input[type="email"]', "ada@gm");

    expect(document.body.querySelector("kbd")).toBeNull();
  });

  it("uses custom autocomplete domains", () => {
    renderForm(createTestAdapter(), { ui: { auth: { emailAutocomplete: { domains: ["acme.dev"] } } } });

    typeInto('input[type="email"]', "ada@ac");

    expect(document.body.textContent).toContain("me.dev");
  });

  it("persists remember me and restores it after mount", () => {
    const first = renderForm();
    const checkbox = field('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(localStorage.getItem(REMEMBER_KEY)).toBe("true");
    expect(field('input[type="checkbox"]').checked).toBe(true);
    first.unmount();

    renderForm();
    expect(field('input[type="checkbox"]').checked).toBe(true);
  });

  it("hides remember me when showRememberMe is false", () => {
    renderForm(createTestAdapter(), { ui: { auth: { showRememberMe: false } } });
    expect(document.body.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it("prefills the demo credentials", () => {
    renderForm(createTestAdapter({ demoCredentials: { email: "demo@example.com", password: "demo" } }));
    expect(field('input[type="email"]').value).toBe("demo@example.com");
  });
});

describe("footer", () => {
  it("renders the default legal segments with links", () => {
    renderForm();
    const links = Array.from(document.body.querySelectorAll("a")).map((link) => link.textContent);

    expect(links).toEqual(["Terms", "Privacy Policy"]);
  });

  it("renders custom segments and opens external links safely", () => {
    renderForm(createTestAdapter(), {
      ui: {
        copy: {
          footer: {
            segments: [
              { type: "text", value: "Read the " },
              { type: "link", label: "docs", href: "https://example.com", target: "_blank" },
            ],
          },
        },
      },
    });
    const link = document.body.querySelector<HTMLAnchorElement>("a[href='https://example.com']");

    expect(link?.rel).toBe("noreferrer noopener");
    expect(link?.target).toBe("_blank");
  });

  it("renders a custom footer node and hides the footer with showFooter false", () => {
    const custom = renderForm(createTestAdapter(), { ui: { footer: <p data-testid="custom-footer">Custom</p> } });
    expect(document.body.querySelector("[data-testid='custom-footer']")).toBeTruthy();
    expect(document.body.querySelector("a")).toBeNull();
    custom.unmount();

    renderForm(createTestAdapter(), { ui: { auth: { showFooter: false } } });
    expect(document.body.querySelector("a")).toBeNull();
  });
});

describe("heading", () => {
  it("splits short titles into per-character spans with staggered delays", () => {
    renderForm();
    const chars = document.body.querySelectorAll<HTMLElement>("h2 .auth-title-char");

    expect(Array.from(chars).map((node) => node.textContent).join("")).toBe("Welcome back");
    expect(chars[3]?.style.getPropertyValue("--auth-char")).toBe("3");
  });

  it("fades long titles as a single node", () => {
    renderForm(createTestAdapter(), { ui: { copy: { login: { title: "T".repeat(80) } } } });

    expect(document.body.querySelectorAll("h2 .auth-title-char")).toHaveLength(0);
    expect(document.body.querySelector("h2")?.textContent).toBe("T".repeat(80));
  });

  it("retriggers the reveal when the mode changes the title", () => {
    renderForm(registerAdapter());
    click(findButton("Register"));

    expect(document.body.querySelector("h2")?.textContent).toBe("Create your account");
  });
});
