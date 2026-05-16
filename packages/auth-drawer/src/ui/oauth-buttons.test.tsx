import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OauthButtons } from "./oauth-buttons";

describe("OauthButtons", () => {
  it("renders nothing when no providers are configured", () => {
    const html = renderToStaticMarkup(
      <OauthButtons
        providers={[]}
        layout="column"
        loadingAction={null}
        isLoading={false}
        onAction={() => {}}
      />,
    );

    expect(html).toBe("");
  });
});
