import { createRoot } from "solid-js";
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { LAST_USED_KEY } from "@remcostoeten/auth-drawer/core";
import {
  AuthDrawer,
  AuthProvider,
  clearLastUsedMethod,
  readLastUsedMethod,
  recordLastUsedMethod,
  useLastUsedMethod,
  type AuthAdapter,
  type AuthConfig,
} from "../../src/solid";
import { badges, click, createTestAdapter, credentials, field, findButton, flush, type as typeInto } from "./helpers";

function adapterWithOAuth(overrides: Partial<AuthAdapter> = {}) {
  return createTestAdapter({
    providers: ["github", "google"],
    signInWithOAuth: vi.fn(async () => ({ success: true })),
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

describe("last used storage", () => {
  it("reads, records and clears the method in versioned storage", () => {
    expect(readLastUsedMethod()).toBeNull();

    recordLastUsedMethod("google");
    expect(localStorage.getItem(LAST_USED_KEY)).toBe("google");
    expect(readLastUsedMethod()).toBe("google");

    localStorage.setItem(LAST_USED_KEY, "not-a-method");
    expect(readLastUsedMethod()).toBeNull();

    recordLastUsedMethod("email");
    clearLastUsedMethod();
    expect(readLastUsedMethod()).toBeNull();
  });
});

describe("useLastUsedMethod", () => {
  it("reads the stored method after mount and follows later changes", () => {
    recordLastUsedMethod("github");
    let method: ReturnType<typeof useLastUsedMethod> = () => null;

    function Probe() {
      method = useLastUsedMethod();
      return null;
    }

    render(() => <Probe />);
    expect(method()).toBe("github");

    recordLastUsedMethod("passkey");
    expect(method()).toBe("passkey");

    clearLastUsedMethod();
    expect(method()).toBeNull();
  });

  it("stops listening when its owner is disposed", () => {
    let method: ReturnType<typeof useLastUsedMethod> = () => null;
    const dispose = createRoot((disposeRoot) => {
      method = useLastUsedMethod();
      return disposeRoot;
    });

    dispose();
    recordLastUsedMethod("google");

    expect(method()).toBeNull();
  });
});

describe("last used chip", () => {
  it("shows no chip until a method has been used", () => {
    renderDrawer(adapterWithOAuth());
    expect(badges()).toEqual([]);
  });

  it("marks the provider used last, in the first render", () => {
    recordLastUsedMethod("google");
    renderDrawer(adapterWithOAuth());

    expect(badges()).toEqual(["Continue with Google"]);
    expect(document.body.querySelector("[data-auth-badge]")?.textContent).toBe("Last used");
  });

  it("records an OAuth sign in and moves the chip to that provider on the next mount", async () => {
    recordLastUsedMethod("google");
    const first = renderDrawer(adapterWithOAuth());

    click(findButton("Continue with GitHub"));
    await flush();
    expect(readLastUsedMethod()).toBe("github");

    first.unmount();
    renderDrawer(adapterWithOAuth());
    expect(badges()).toEqual(["Continue with GitHub"]);
  });

  it("marks the password form after a password sign in", async () => {
    renderDrawer(adapterWithOAuth());

    typeInto('input[type="email"]', credentials.email);
    typeInto('input[type="password"]', "correct-horse-battery");
    field("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flush();

    expect(readLastUsedMethod()).toBe("email");
  });

  it("marks the submit button when the password form was used last", () => {
    recordLastUsedMethod("email");
    renderDrawer(adapterWithOAuth());

    expect(badges()).toEqual(["Sign in"]);
  });

  it("honours ui.auth.showLastUsed and copy.lastUsed.label", () => {
    recordLastUsedMethod("github");
    const hidden = renderDrawer(adapterWithOAuth(), { ui: { auth: { showLastUsed: false } } });
    expect(badges()).toEqual([]);
    hidden.unmount();

    renderDrawer(adapterWithOAuth(), { ui: { copy: { lastUsed: { label: "Recent" } } } });
    expect(document.body.querySelector("[data-auth-badge]")?.textContent).toBe("Recent");
  });

  it("hides the chip while the button shows loading or feedback", async () => {
    recordLastUsedMethod("github");
    renderDrawer(adapterWithOAuth({ signInWithOAuth: vi.fn(async () => ({ success: true })) }));
    expect(badges()).toEqual(["Continue with GitHub"]);

    click(findButton("Continue with GitHub"));

    expect(badges()).toEqual([]);
    await flush();
  });
});
