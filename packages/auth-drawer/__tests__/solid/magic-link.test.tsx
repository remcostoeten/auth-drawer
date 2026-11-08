import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthDrawer,
  AuthProvider,
  createAuthError,
  readLastUsedMethod,
  type AuthAdapter,
  type AuthConfig,
} from "../../src/solid";
import { click, createTestAdapter, dialog, findButton, submitButton, type as typeInto } from "./helpers";

function magicLinkAdapter(overrides: Partial<AuthAdapter> = {}) {
  return createTestAdapter({
    signIn: undefined,
    features: { magicLink: { signIn: vi.fn(async () => ({ success: true })) } },
    ...overrides,
  });
}

function renderDrawer(adapter: AuthAdapter, config?: AuthConfig) {
  return render(() => (
    <AuthProvider adapter={adapter}>
      <AuthDrawer adapter={adapter} hideTrigger open config={config} />
    </AuthProvider>
  ));
}

async function sendLink(email: string) {
  typeInto('input[type="email"]', email);
  click(submitButton());
  await vi.advanceTimersByTimeAsync(0);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("magic link flow", () => {
  it("drops the password field when the adapter has no password sign in", () => {
    renderDrawer(magicLinkAdapter());

    expect(document.body.querySelector('input[type="email"]')).toBeTruthy();
    expect(document.body.querySelector('input[type="password"]')).toBeNull();
    expect(submitButton().textContent).toContain("Email me a sign-in link");
  });

  it("sends the trimmed address, shows the sent view and keeps the drawer open", async () => {
    vi.useFakeTimers();
    const signIn = vi.fn(async () => ({ success: true }));
    renderDrawer(magicLinkAdapter({ features: { magicLink: { signIn } } }));

    await sendLink(" user@example.com ");

    expect(signIn).toHaveBeenCalledWith("user@example.com");
    expect(dialog()).toBeTruthy();
    expect(document.body.textContent).toContain("Check your inbox");
    expect(document.body.textContent).toContain("user@example.com");
    expect(document.body.querySelector("form")).toBeNull();
    expect(readLastUsedMethod()).toBe("magicLink");
  });

  it("keeps resend disabled until the cooldown elapses, counting down per second", async () => {
    vi.useFakeTimers();
    renderDrawer(magicLinkAdapter(), { ui: { auth: { magicLink: { resendMs: 2000 } } } });

    await sendLink("user@example.com");

    const waiting = findButton("You can send another link in 2s") as HTMLButtonElement;
    expect(waiting.disabled).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect((findButton("You can send another link in 1s") as HTMLButtonElement).disabled).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    const ready = findButton("Send the link again") as HTMLButtonElement;
    expect(ready.disabled).toBe(false);
  });

  it("resends the link to the same address and restarts the countdown", async () => {
    vi.useFakeTimers();
    const signIn = vi.fn(async () => ({ success: true }));
    renderDrawer(magicLinkAdapter({ features: { magicLink: { signIn } } }), {
      ui: { auth: { magicLink: { resendMs: 1000 } } },
    });

    await sendLink("user@example.com");
    await vi.advanceTimersByTimeAsync(1000);

    click(findButton("Send the link again"));
    await vi.advanceTimersByTimeAsync(0);

    expect(signIn).toHaveBeenCalledTimes(2);
    expect(signIn).toHaveBeenLastCalledWith("user@example.com");
    expect(findButton("You can send another link in 1s")).toBeTruthy();
  });

  it("returns to the email field with Use another email", async () => {
    vi.useFakeTimers();
    renderDrawer(magicLinkAdapter());

    await sendLink("user@example.com");
    click(findButton("Use a different email"));

    expect(document.body.querySelector('input[type="email"]')).toBeTruthy();
    expect(document.body.textContent).not.toContain("Check your inbox");
  });

  it("surfaces adapter errors and stays on the form", async () => {
    vi.useFakeTimers();
    const signIn = vi.fn(async () => ({
      success: false,
      error: createAuthError("rate_limited", "form", { message: "Too many attempts." }),
    }));
    renderDrawer(magicLinkAdapter({ features: { magicLink: { signIn } } }));

    await sendLink("user@example.com");

    expect(document.body.textContent).toContain("Too many attempts.");
    expect(document.body.textContent).not.toContain("Check your inbox");
    expect(readLastUsedMethod()).toBeNull();
  });

  it("validates the email before sending", async () => {
    vi.useFakeTimers();
    const signIn = vi.fn(async () => ({ success: true }));
    renderDrawer(magicLinkAdapter({ features: { magicLink: { signIn } } }));

    await sendLink("not-an-email");

    expect(signIn).not.toHaveBeenCalled();
    expect(document.body.querySelector('[role="alert"]')).toBeTruthy();
  });

  it("switches between the password form and the link form when both exist", () => {
    renderDrawer(magicLinkAdapter({ signIn: vi.fn(async () => ({ success: true })) }));

    expect(document.body.querySelector('input[type="password"]')).toBeTruthy();

    click(findButton("Email me a sign-in link instead"));
    expect(document.body.querySelector('input[type="password"]')).toBeNull();

    click(findButton("Sign in with a password"));
    expect(document.body.querySelector('input[type="password"]')).toBeTruthy();
  });

  it("ignores the flow when it is disabled by config", () => {
    renderDrawer(magicLinkAdapter({ signIn: vi.fn(async () => ({ success: true })) }), {
      ui: { auth: { magicLink: { enabled: false } } },
    });

    expect(findButton("Email me a sign-in link instead")).toBeUndefined();
  });
});
