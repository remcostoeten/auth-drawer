import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AppleIcon } from "../../src/solid/icons/apple-icon";
import { GoogleIcon } from "../../src/solid/icons/google-icon";
import { GithubIcon } from "../../src/solid/icons/github-icon";
import { MicrosoftIcon } from "../../src/solid/icons/microsoft-icon";
import { NotionIcon } from "../../src/solid/icons/notion-icon";
import { RedditIcon } from "../../src/solid/icons/reddit-icon";
import { SlackIcon } from "../../src/solid/icons/slack-icon";
import { SpotifyIcon } from "../../src/solid/icons/spotify-icon";
import { TikTokIcon } from "../../src/solid/icons/tiktok-icon";
import { TwitchIcon } from "../../src/solid/icons/twitch-icon";
import { XIcon } from "../../src/solid/icons/x-icon";
import { DiscordIcon } from "../../src/solid/icons/discord-icon";
import { FacebookIcon } from "../../src/solid/icons/facebook-icon";
import { FigmaIcon } from "../../src/solid/icons/figma-icon";
import { GitlabIcon } from "../../src/solid/icons/gitlab-icon";
import { LinkedinIcon } from "../../src/solid/icons/linkedin-icon";
import { OAUTH_PROVIDER_REGISTRY, resolveOAuthProviders } from "../../src/solid";
import { ProviderLogo, hasOAuthLogo } from "../../src/solid/ui/provider-logo";

const ICONS = {
  AppleIcon,
  DiscordIcon,
  FacebookIcon,
  FigmaIcon,
  GithubIcon,
  GitlabIcon,
  GoogleIcon,
  LinkedinIcon,
  MicrosoftIcon,
  NotionIcon,
  RedditIcon,
  SlackIcon,
  SpotifyIcon,
  TikTokIcon,
  TwitchIcon,
  XIcon,
};

describe("provider icons", () => {
  it("ships sixteen marks that render a decorative svg with a path", () => {
    expect(Object.keys(ICONS)).toHaveLength(16);

    for (const [name, Icon] of Object.entries(ICONS)) {
      const { container, unmount } = render(() => <Icon class="mark" />);
      const svg = container.querySelector("svg");

      expect(svg, name).toBeTruthy();
      expect(svg?.getAttribute("aria-hidden"), name).toBe("true");
      expect(svg?.getAttribute("viewBox"), name).toBe("0 0 24 24");
      expect(svg?.getAttribute("class"), name).toBe("mark");
      expect(container.querySelectorAll("path").length, name).toBeGreaterThan(0);
      unmount();
    }
  });

  it("keeps brand colours on multi-colour marks and currentColor on mono marks", () => {
    const google = render(() => <GoogleIcon />);
    expect(Array.from(google.container.querySelectorAll("path")).map((path) => path.getAttribute("fill"))).toEqual([
      "#4285F4",
      "#34A853",
      "#FBBC05",
      "#EA4335",
    ]);

    const x = render(() => <XIcon />);
    expect(x.container.querySelector("svg")?.getAttribute("fill")).toBe("currentColor");
  });

  it("registers the six built-in providers with an icon and label", () => {
    expect(Array.from(OAUTH_PROVIDER_REGISTRY.keys())).toEqual([
      "github",
      "google",
      "apple",
      "discord",
      "tiktok",
      "x",
    ]);
    expect(resolveOAuthProviders(["x", "unknown" as never]).map((item) => item.label)).toEqual(["X"]);
  });
});

describe("ProviderLogo", () => {
  it("renders a single source without wrappers", () => {
    const { container } = render(() => <ProviderLogo base={GithubIcon} />);

    expect(container.querySelector(".auth-oauth-logo-light")).toBeNull();
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("renders image urls as decorative images", () => {
    const { container } = render(() => <ProviderLogo base="https://example.com/logo.svg" />);
    const image = container.querySelector("img");

    expect(image?.getAttribute("src")).toBe("https://example.com/logo.svg");
    expect(image?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders elements as given", () => {
    const { container } = render(() => <ProviderLogo base={<b data-testid="custom">B</b>} />);
    expect(container.querySelector("[data-testid='custom']")).toBeTruthy();
  });

  it("renders both light and dark variants, falling back to the base", () => {
    const { container } = render(() => <ProviderLogo base={AppleIcon} dark={GithubIcon} />);

    expect(container.querySelector(".auth-oauth-logo-light svg")).toBeTruthy();
    expect(container.querySelector(".auth-oauth-logo-dark svg")).toBeTruthy();
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("renders nothing without a source", () => {
    const { container } = render(() => <ProviderLogo />);
    expect(container.innerHTML).toBe("");
  });

  it("detects whether any source is present", () => {
    expect(hasOAuthLogo({})).toBe(false);
    expect(hasOAuthLogo({ dark: "x.svg" })).toBe(true);
  });
});
