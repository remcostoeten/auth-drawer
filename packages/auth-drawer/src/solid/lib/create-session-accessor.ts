import { createEffect, createSignal, onCleanup, untrack, type Accessor } from "solid-js";
import type { SessionSnapshot, SessionSource } from "@remcostoeten/auth-drawer/core";

/**
 * @name createSessionAccessor
 * @description Mirrors a core `SessionSource` into a Solid accessor. The subscription starts after
 * mount, follows the source when it changes, and is released on cleanup.
 *
 * @example
 * const snapshot = createSessionAccessor(() => adapter.session);
 * return <p>{snapshot().data?.user?.email}</p>;
 */
export function createSessionAccessor(source: Accessor<SessionSource>): Accessor<SessionSnapshot> {
  const [snapshot, setSnapshot] = createSignal(untrack(source).getSnapshot());

  createEffect(() => {
    const current = source();
    const sync = () => setSnapshot(() => current.getSnapshot());
    sync();
    onCleanup(current.subscribe(sync));
  });

  return snapshot;
}
