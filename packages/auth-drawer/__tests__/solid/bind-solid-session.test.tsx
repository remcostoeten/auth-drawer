import { createRoot, createSignal } from "solid-js";
import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  AuthProvider,
  bindSolidSession,
  createAdapter,
  useAuth,
  type SessionSnapshot,
} from "../../src/solid";
import { SIGNED_IN, SIGNED_OUT, createTestAdapter } from "./helpers";

describe("bindSolidSession", () => {
  it("starts from the accessor value and follows it", () => {
    const [snapshot, setSnapshot] = createSignal<SessionSnapshot>(SIGNED_OUT);
    const adapter = createRoot(() => bindSolidSession(createTestAdapter(), snapshot));

    expect(adapter.session.getSnapshot()).toBe(SIGNED_OUT);

    setSnapshot(SIGNED_IN);
    expect(adapter.session.getSnapshot()).toBe(SIGNED_IN);
  });

  it("notifies session subscribers when the accessor changes", () => {
    const [snapshot, setSnapshot] = createSignal<SessionSnapshot>(SIGNED_OUT);
    const adapter = createRoot(() => bindSolidSession(createTestAdapter(), snapshot));
    const listener = vi.fn();
    const stop = adapter.session.subscribe(listener);

    setSnapshot(SIGNED_IN);
    expect(listener).toHaveBeenCalledTimes(1);

    stop();
    setSnapshot(SIGNED_OUT);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps every other adapter member and does not mutate the original", () => {
    const original = createTestAdapter({ id: "keep-me" });
    const adapter = createRoot(() => bindSolidSession(original, () => SIGNED_OUT));

    expect(adapter.id).toBe("keep-me");
    expect(adapter.signIn).toBe(original.signIn);
    expect(adapter.session).not.toBe(original.session);
  });

  it("works outside any owner by creating its own root", () => {
    const [snapshot, setSnapshot] = createSignal<SessionSnapshot>(SIGNED_OUT);
    const adapter = bindSolidSession(createTestAdapter(), snapshot);

    setSnapshot(SIGNED_IN);

    expect(adapter.session.getSnapshot()).toBe(SIGNED_IN);
  });

  it("feeds AuthProvider the value of a framework hook", () => {
    const [hook, setHook] = createSignal<SessionSnapshot>({ data: null, isPending: true, error: null });
    let email = () => "";

    function Probe() {
      const auth = useAuth();
      email = () => auth.user()?.email ?? "none";
      return <p data-testid="pending">{String(auth.isPending())}</p>;
    }

    function App() {
      const adapter = bindSolidSession(createAdapter({ id: "hooked" }), hook);
      return (
        <AuthProvider adapter={adapter}>
          <Probe />
        </AuthProvider>
      );
    }

    const { getByTestId } = render(() => <App />);
    expect(getByTestId("pending").textContent).toBe("true");
    expect(email()).toBe("none");

    setHook(SIGNED_IN);

    expect(getByTestId("pending").textContent).toBe("false");
    expect(email()).toBe("test@example.com");
  });
});
