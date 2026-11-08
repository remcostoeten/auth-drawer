import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_COPY, type OAuthProvider } from "@remcostoeten/auth-drawer/core";
import { AuthDrawer } from "../../src/solid";
import { OauthButtons } from "../../src/solid/ui/oauth-buttons";
import { click, createTestAdapter, flush } from "./helpers";

function renderButtons(providers: OAuthProvider[], extra: Partial<Parameters<typeof OauthButtons>[0]> = {}) {
  return render(() => (
    <OauthButtons
      providers={providers}
      layout="column"
      loadingAction={null}
      isLoading={false}
      copy={DEFAULT_COPY.oauth}
      onAction={() => {}}
      {...extra}
    />
  ));
}

describe("OauthButtons", () => {
  it("renders nothing when no providers are configured", () => {
    const { container } = renderButtons([]);
    expect(container.textContent).toBe("");
  });

  it("renders providers in array order", () => {
    const { container } = renderButtons(["google", "github"]);
    const text = container.textContent ?? "";

    expect(text.indexOf("Google")).toBeGreaterThan(-1);
    expect(text.indexOf("Google")).toBeLessThan(text.indexOf("GitHub"));
  });

  it("keeps overflow providers collapsed by default", () => {
    const { container } = renderButtons(["github", "google", "apple", "discord", "tiktok"]);

    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("Google");
    expect(container.textContent).not.toContain("Apple");
    expect(container.textContent).not.toContain("Discord");
    expect(container.textContent).toContain(DEFAULT_COPY.oauth.showAllSocial);
  });

  it("reveals overflow providers and flips the toggle label when expanded", () => {
    const { container } = renderButtons(["github", "google", "apple"]);
    const toggle = container.querySelector('button[aria-expanded="false"]');

    click(toggle);

    expect(container.textContent).toContain("Apple");
    expect(container.textContent).toContain(DEFAULT_COPY.oauth.hideAllSocial);
    expect(container.querySelector('button[aria-expanded="true"]')).toBeTruthy();
  });

  it("hides the overflow again after a second toggle, once the collapse finished", async () => {
    vi.useFakeTimers();
    const { container } = renderButtons(["github", "google", "apple"]);
    const toggle = container.querySelector('button[aria-expanded="false"]');

    click(toggle);
    click(toggle);
    expect(container.querySelector("[data-state='closing']")).toBeTruthy();

    await vi.advanceTimersByTimeAsync(250);

    expect(container.textContent).not.toContain("Apple");
    vi.useRealTimers();
  });

  it("renders X with its label once the overflow is opened", () => {
    const { container } = renderButtons(["github", "google", "x"]);

    expect(container.textContent).not.toContain("Continue with X");
    click(container.querySelector('button[aria-expanded="false"]'));

    expect(container.querySelector('button[aria-label="Continue with X"]')).toBeTruthy();
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(3);
  });

  it("uses a disclosure control instead of a line separator for overflow", () => {
    const { container } = renderButtons(["github", "google", "apple", "discord"]);

    expect(container.querySelectorAll('[role="separator"]')).toHaveLength(0);
    expect(container.querySelector('button[aria-expanded="false"]')).toBeTruthy();
  });

  it("respects a custom visible count before overflow", () => {
    const { container } = renderButtons(["github", "google", "apple"], { visibleCount: 1 });

    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).not.toContain("Google");
    expect(container.textContent).toContain(DEFAULT_COPY.oauth.showAllSocial);
  });

  it("shows preview icons on the disclosure trigger and can hide them", () => {
    const shown = renderButtons(["github", "google", "apple"]);
    expect(shown.container.querySelectorAll('button[aria-expanded="false"] svg').length).toBeGreaterThan(1);
    shown.unmount();

    const hidden = renderButtons(["github", "google", "apple"], { showPreviewIcons: false });
    const toggle = hidden.container.querySelector('button[aria-expanded="false"]');
    expect(toggle?.querySelectorAll("svg")).toHaveLength(1);
  });

  it("uses short labels in the row layout and full labels in the column layout", () => {
    const row = renderButtons(["github", "google"], { layout: "row" });
    const labels = Array.from(row.container.querySelectorAll("button")).map((button) => button.textContent);
    expect(labels).toEqual(["GitHub", "Google"]);
    row.unmount();

    const column = renderButtons(["github", "google"]);
    expect(column.container.textContent).toContain("Continue with GitHub");
  });

  it("marks the primary provider and disables every button while loading", () => {
    const { container } = renderButtons(["google", "github"], { isLoading: true, loadingAction: "google" });
    const buttons = Array.from(container.querySelectorAll("button"));

    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(buttons[0]?.dataset.feedbackStatus).toBe("loading");
    expect(buttons[0]?.getAttribute("aria-busy")).toBe("true");
  });

  it("shows the success message on the provider that signed in", () => {
    const { container } = renderButtons(["github", "google"], {
      successProvider: "google",
      successMessage: "Welcome",
    });
    const google = container.querySelector('button[aria-label="Continue with Google"]');

    expect(google?.getAttribute("data-feedback-status")).toBe("success");
    expect(google?.textContent).toContain("Welcome");
  });

  it("calls onAction with the provider id", () => {
    const onAction = vi.fn();
    const { container } = renderButtons(["github", "google"], { onAction });

    click(container.querySelector('button[aria-label="Continue with Google"]'));

    expect(onAction).toHaveBeenCalledWith("google");
  });
});

describe("OAuth buttons in the drawer", () => {
  it("follows ui.auth.providers order and respects the adapter's providers", () => {
    const adapter = createTestAdapter({
      providers: ["github", "google", "apple"],
      signInWithOAuth: vi.fn(async () => ({ success: true })),
    });
    render(() => (
      <AuthDrawer
        adapter={adapter}
        hideTrigger
        defaultOpen
        config={{ ui: { auth: { providers: ["google", "github", "discord"] } } }}
      />
    ));
    const text = document.body.textContent ?? "";

    expect(text.indexOf("Continue with Google")).toBeLessThan(text.indexOf("Continue with GitHub"));
    expect(text).not.toContain("Discord");
  });

  it("hides OAuth entirely when the adapter has no signInWithOAuth", () => {
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter({ providers: ["github"] })}
        hideTrigger
        defaultOpen
      />
    ));

    expect(document.body.textContent).not.toContain("GitHub");
    expect(document.body.querySelector('[role="separator"]')).toBeNull();
  });

  it("signs in through OAuth, shows the success state on the provider and reports onSuccess", async () => {
    const signInWithOAuth = vi.fn(async () => ({ success: true }));
    const onSuccess = vi.fn();
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter({ providers: ["github", "google"], signInWithOAuth })}
        hideTrigger
        defaultOpen
        onSuccess={onSuccess}
      />
    ));

    click(document.body.querySelector('button[aria-label="Continue with GitHub"]'));
    await flush();

    expect(signInWithOAuth).toHaveBeenCalledWith("github");
    expect(onSuccess).toHaveBeenCalledWith("oauth");
    expect(
      document.body.querySelector('button[aria-label="Continue with GitHub"]')?.getAttribute("data-feedback-status"),
    ).toBe("success");
  });

  it("shows an OAuth failure under the buttons", async () => {
    const signInWithOAuth = vi.fn(async () => ({
      success: false,
      error: { code: "oauth_cancelled" as const, target: "oauth" as const, message: "Popup closed." },
    }));
    render(() => (
      <AuthDrawer
        adapter={createTestAdapter({ providers: ["github"], signInWithOAuth })}
        hideTrigger
        defaultOpen
      />
    ));

    click(document.body.querySelector('button[aria-label="Continue with GitHub"]'));
    await flush();

    expect(document.body.querySelector('[role="alert"]')?.textContent).toBe("Popup closed.");
  });
});
