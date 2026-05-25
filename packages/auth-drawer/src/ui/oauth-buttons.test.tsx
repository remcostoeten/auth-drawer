import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEFAULT_COPY } from "../copy";
import { OauthButtons } from "./oauth-buttons";

describe("OauthButtons", () => {
  it("renders nothing when no providers are configured", () => {
    const html = renderToStaticMarkup(
      <OauthButtons
        providers={[]}
        layout="column"
        loadingAction={null}
        isLoading={false}
        copy={DEFAULT_COPY.oauth}
        onAction={() => {}}
      />,
    );

    expect(html).toBe("");
  });
});
