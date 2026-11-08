import { describe, expect, it, vi } from "vitest";
import { STATIC_SESSION, createAdapter, createPushSession } from "../../src/core";
import { SIGNED_IN, ok } from "./helpers";

describe("createAdapter", () => {
  it("defaults the session to a static signed-out source", () => {
    const adapter = createAdapter({ id: "custom" });

    expect(adapter.session).toBe(STATIC_SESSION);
    expect(adapter.session.getSnapshot()).toEqual({ data: null, isPending: false, error: null });
  });

  it("keeps a provided session", () => {
    const { source } = createPushSession(SIGNED_IN);

    expect(createAdapter({ id: "custom", session: source }).session).toBe(source);
  });

  it("keeps the provided methods and fills in signOut", async () => {
    const signIn = vi.fn(async () => ok());
    const adapter = createAdapter({ id: "custom", signIn });
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });

    expect(adapter.signIn).toBe(signIn);
    await expect(adapter.signOut?.()).resolves.toEqual({ success: true });
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
