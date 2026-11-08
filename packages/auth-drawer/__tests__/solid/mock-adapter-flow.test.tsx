import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { AuthDrawer, AuthProvider, OAUTH_PROVIDER_IDS, useAuth } from "../../src/solid";
import { createMockAdapter } from "../../src/solid/adapters/mock";
import { click, dialog, findButton, submitButton, type as typeInto } from "./helpers";

describe("mock adapter end to end", () => {
  it("signs in with the demo credentials, updates the provider and closes the drawer", async () => {
    vi.useFakeTimers();
    const adapter = createMockAdapter({ latencyMs: 10 });
    let email = () => "";
    let openDrawer = () => {};

    function Status() {
      const auth = useAuth();
      email = () => auth.user()?.email ?? "";
      openDrawer = auth.openDrawer;
      return null;
    }

    render(() => (
      <AuthProvider adapter={adapter}>
        <Status />
        <AuthDrawer
          adapter={adapter}
          hideTrigger
          config={{ ui: { auth: { providers: [...OAUTH_PROVIDER_IDS] } } }}
        />
      </AuthProvider>
    ));
    await vi.advanceTimersByTimeAsync(0);

    expect(email()).toBe("");
    openDrawer();
    expect(findButton("Continue with X")).toBeUndefined();
    typeInto('input[type="email"]', "admin@example.com");
    typeInto('input[type="password"]', "password");
    click(submitButton());
    await vi.advanceTimersByTimeAsync(20);

    expect(email()).toBe("admin@example.com");
    expect(submitButton().dataset.feedbackStatus).toBe("success");

    await vi.advanceTimersByTimeAsync(1500);
    expect(dialog()).toBeNull();

    const signedOut = adapter.signOut?.();
    await vi.advanceTimersByTimeAsync(20);
    await signedOut;
    expect(email()).toBe("");
    vi.useRealTimers();
  });
});
