import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPushSession } from "@remcostoeten/auth-drawer/core";
import { createBetterAuthAdapter } from "../../../src/react/adapters/better-auth";
import { createClerkAdapter } from "../../../src/react/adapters/clerk";
import { createMockAdapter } from "../../../src/react/adapters/mock";
import { createNextAuthAdapter } from "../../../src/react/adapters/next-auth";
import { createAdapter } from "../../../src/react/create-adapter";
import { useAdapterSession } from "../../../src/react/hooks/use-adapter-session";
import type { AuthAdapter } from "../../../src/react/types";
import { AuthProvider, useAuth } from "../../../src/react/ui/auth-provider";

const SIGNED_IN = {
  data: { user: { id: "1", email: "a@b.co" }, session: { id: "s" } },
  isPending: false,
  error: null,
};

describe("React session bindings", () => {
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

  function readSession(adapter: AuthAdapter) {
    const seen: Array<ReturnType<typeof useAdapterSession>> = [];

    function Probe() {
      seen.push(useAdapterSession(adapter));
      return null;
    }

    act(() => root.render(createElement(Probe)));
    return () => seen[seen.length - 1];
  }

  it("createAdapter gives every adapter a useSession hook backed by its source", () => {
    const pushed = createPushSession({ data: null, isPending: false, error: null });
    const adapter = createAdapter({ id: "custom", session: pushed.source });
    const latest = readSession(adapter);

    expect(typeof adapter.useSession).toBe("function");
    expect(latest().data).toBeNull();

    act(() => pushed.push(SIGNED_IN));

    expect(latest().data?.user?.id).toBe("1");
  });

  it("createAdapter defaults to a static signed-out session", () => {
    const latest = readSession(createAdapter({ id: "custom" }));

    expect(latest()).toEqual({ data: null, isPending: false, error: null });
  });

  it("createAdapter keeps a legacy useSession hook", () => {
    const useSession = vi.fn(() => SIGNED_IN);
    const adapter = createAdapter({ id: "legacy", useSession });
    const latest = readSession(adapter);

    expect(adapter.useSession).toBe(useSession);
    expect(latest().data?.user?.id).toBe("1");
  });

  it("useAdapterSession reads a source-only adapter without useSession", () => {
    const pushed = createPushSession(SIGNED_IN);
    const latest = readSession({ id: "source-only", session: pushed.source });

    expect(latest().data?.user?.id).toBe("1");
  });

  it("useAdapterSession tolerates an adapter written without any session", () => {
    const latest = readSession({ id: "bare" } as AuthAdapter);

    expect(latest()).toEqual({ data: null, isPending: false, error: null });
  });

  it("the mock adapter follows its in-memory sign in", async () => {
    const adapter = createMockAdapter({ latencyMs: 0 });
    const latest = readSession(adapter);
    expect(latest().data).toBeNull();

    await act(async () => {
      await adapter.signIn?.({
        email: "admin@example.com",
        password: "password",
        rememberMe: false,
      });
    });
    expect(latest().data?.user?.email).toBe("admin@example.com");

    await act(async () => {
      await adapter.signOut?.();
    });
    expect(latest().data).toBeNull();
  });

  it("Better Auth keeps using the client hook and never calls getSession", () => {
    const getSession = vi.fn(async () => ({ data: null }));
    const useSession = vi.fn(() => ({
      data: { user: { id: "b1" }, session: { id: "s" } },
      isPending: false,
      error: null,
    }));
    const latest = readSession(createBetterAuthAdapter({ client: { getSession, useSession } }));

    expect(latest().data?.user?.id).toBe("b1");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("Better Auth without a client hook reports a signed-out session", () => {
    const latest = readSession(createBetterAuthAdapter({ client: {} }));

    expect(latest()).toEqual({ data: null, isPending: false, error: null });
  });

  it("Clerk maps the useUser hook", () => {
    const useUser = vi.fn(() => ({
      user: { id: "c1", primaryEmailAddress: { emailAddress: "a@b.co" }, fullName: "Ada" },
      isLoaded: true,
    }));
    const latest = readSession(createClerkAdapter({ client: { useUser } }));

    expect(latest().data?.user).toMatchObject({ id: "c1", email: "a@b.co", name: "Ada" });
    expect(latest().isPending).toBe(false);
  });

  it("Clerk is pending until the hook reports loaded, and not pending without a hook", () => {
    const loading = readSession(
      createClerkAdapter({ client: { useUser: () => ({ isLoaded: false }) } }),
    );
    expect(loading().isPending).toBe(true);

    const noHook = readSession(createClerkAdapter({ client: {} }));
    expect(noHook().isPending).toBe(false);
  });

  it("NextAuth maps the useSession hook status", () => {
    const loading = readSession(
      createNextAuthAdapter({
        client: { signIn: vi.fn(), useSession: () => ({ status: "loading" }) },
      }),
    );
    expect(loading().isPending).toBe(true);

    const signedIn = readSession(
      createNextAuthAdapter({
        client: {
          signIn: vi.fn(),
          useSession: () => ({ data: { user: { email: "a@b.co" } }, status: "authenticated" }),
        },
      }),
    );
    expect(signedIn().data?.user?.email).toBe("a@b.co");
  });

  it("AuthProvider exposes the session of a source-only adapter", () => {
    const pushed = createPushSession({ data: null, isPending: false, error: null });
    const adapter = createAdapter({ id: "custom", session: pushed.source });
    const seen: Array<ReturnType<typeof useAuth>> = [];

    function Probe() {
      seen.push(useAuth());
      return null;
    }

    act(() => root.render(createElement(AuthProvider, { adapter }, createElement(Probe))));
    expect(seen[seen.length - 1].user).toBeNull();

    act(() => pushed.push(SIGNED_IN));
    expect(seen[seen.length - 1].user?.id).toBe("1");
  });

  it("AuthProvider keeps the drawer open flag when the adapter object changes", () => {
    const seen: Array<ReturnType<typeof useAuth>> = [];

    function Probe() {
      seen.push(useAuth());
      return null;
    }

    function render(adapter: AuthAdapter) {
      act(() => root.render(createElement(AuthProvider, { adapter }, createElement(Probe))));
    }

    render(createAdapter({ id: "one" }));
    act(() => seen[seen.length - 1].openDrawer());
    expect(seen[seen.length - 1].isDrawerOpen).toBe(true);

    render(createAdapter({ id: "two" }));
    expect(seen[seen.length - 1].isDrawerOpen).toBe(true);
  });
});
