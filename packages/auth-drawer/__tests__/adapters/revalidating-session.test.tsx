import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSessionState } from "../../src/types";
import { createRevalidatingSession } from "../../src/adapters/revalidating-session";

const session: AuthSessionState = {
  user: { id: "1", email: "a@b.co", name: "Ada" },
  session: {},
};

async function settle() {
  // Flush the microtasks queued by the hook's session fetch.
  await act(async () => {
    await Promise.resolve();
  });
}

describe("createRevalidatingSession", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.removeChild(container);
  });

  it("refetches the session when notifySession fires (no reload needed)", async () => {
    let authenticated = false;
    const { notifySession, useSession } = createRevalidatingSession(async () => ({
      data: authenticated ? session : null,
      error: null,
    }));

    let snapshot: ReturnType<typeof useSession> | undefined;
    function Probe() {
      snapshot = useSession();
      return null;
    }

    await act(async () => {
      root.render(createElement(Probe));
    });
    await settle();

    // Initial load: signed out.
    expect(snapshot?.data).toBeNull();
    expect(snapshot?.isPending).toBe(false);

    // A successful signIn flips the backend state and notifies subscribers.
    authenticated = true;
    await act(async () => {
      notifySession();
    });
    await settle();

    expect(snapshot?.data?.user?.id).toBe("1");
  });

  it("revalidates when the window regains focus", async () => {
    let authenticated = true;
    const { useSession } = createRevalidatingSession(async () => ({
      data: authenticated ? session : null,
      error: null,
    }));

    let snapshot: ReturnType<typeof useSession> | undefined;
    function Probe() {
      snapshot = useSession();
      return null;
    }

    await act(async () => {
      root.render(createElement(Probe));
    });
    await settle();
    expect(snapshot?.data?.user?.id).toBe("1");

    // Session ended elsewhere (e.g. another tab); refocus should pick it up.
    authenticated = false;
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await settle();

    expect(snapshot?.data).toBeNull();
  });
});
