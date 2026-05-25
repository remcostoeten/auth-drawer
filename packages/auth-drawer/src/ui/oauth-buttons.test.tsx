import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COPY } from "../copy";
import { OauthButtons } from "./oauth-buttons";

describe("OauthButtons", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  function renderButtons(providers: Array<"github" | "google" | "apple" | "discord" | "tiktok">) {
    act(() => {
      root.render(
        <OauthButtons
          providers={providers}
          layout="column"
          loadingAction={null}
          isLoading={false}
          copy={DEFAULT_COPY.oauth}
          onAction={() => {}}
        />,
      );
    });
  }

  it("renders nothing when no providers are configured", () => {
    renderButtons([]);
    expect(container.textContent).toBe("");
  });

  it("renders providers in array order", () => {
    renderButtons(["google", "github"]);
    const text = container.textContent ?? "";
    expect(text.indexOf("Google")).toBeGreaterThan(-1);
    expect(text.indexOf("GitHub")).toBeGreaterThan(-1);
    expect(text.indexOf("Google")).toBeLessThan(text.indexOf("GitHub"));
  });

  it("keeps overflow providers collapsed by default", () => {
    renderButtons(["github", "google", "apple", "discord", "tiktok"]);
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("Google");
    expect(container.textContent).not.toContain("Apple");
    expect(container.textContent).not.toContain("Discord");
    expect(container.textContent).toContain(DEFAULT_COPY.oauth.showAllSocial);
  });

  it("reveals overflow providers when the toggle is clicked", () => {
    renderButtons(["github", "google", "apple"]);
    const toggle = container.querySelector('button[aria-expanded="false"]');
    expect(toggle).toBeTruthy();

    act(() => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Apple");
    expect(container.textContent).toContain(DEFAULT_COPY.oauth.hideAllSocial);
  });

  it("uses a disclosure control instead of a line separator for overflow", () => {
    renderButtons(["github", "google", "apple", "discord"]);
    const separators = container.querySelectorAll('[role="separator"]');
    expect(separators).toHaveLength(0);
    expect(container.querySelector('button[aria-expanded="false"]')).toBeTruthy();
  });

  it("respects a custom visible count before overflow", () => {
    act(() => {
      root.render(
        <OauthButtons
          providers={["github", "google", "apple"]}
          layout="column"
          visibleCount={1}
          loadingAction={null}
          isLoading={false}
          copy={DEFAULT_COPY.oauth}
          onAction={() => {}}
        />,
      );
    });

    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).not.toContain("Google");
    expect(container.textContent).toContain(DEFAULT_COPY.oauth.showAllSocial);
  });

  it("can hide preview icons on the disclosure trigger", () => {
    renderButtons(["github", "google", "apple"]);
    const toggle = container.querySelector('button[aria-expanded="false"]');
    expect(toggle?.querySelector("svg")).toBeTruthy();

    act(() => {
      root.render(
        <OauthButtons
          providers={["github", "google", "apple"]}
          layout="column"
          showPreviewIcons={false}
          loadingAction={null}
          isLoading={false}
          copy={DEFAULT_COPY.oauth}
          onAction={() => {}}
        />,
      );
    });

    const chips = container.querySelectorAll(
      'button[aria-expanded="false"] span[class*="h-8"]',
    );
    expect(chips).toHaveLength(0);
  });
});
