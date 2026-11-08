import { createComputed, createRoot, getOwner, untrack, type Accessor } from "solid-js";
import {
  createPushSession,
  type AuthAdapter,
  type SessionSnapshot,
} from "@remcostoeten/auth-drawer/core";

function bind<Adapter extends AuthAdapter>(
  adapter: Adapter,
  read: Accessor<SessionSnapshot>,
): Adapter {
  const { source, push } = createPushSession(untrack(read));
  createComputed(() => push(read()));
  return { ...adapter, session: source };
}

/**
 * @name bindSolidSession
 * @description Returns a copy of `adapter` whose `session` source follows a Solid accessor. Use it
 * for clients that only expose their session through a reactive hook or accessor, such as the Better
 * Auth Solid client's `useSession` or Clerk. The accessor is read inside a computation, so call
 * this in a component or inside `createRoot`; outside any owner it creates its own root that lives
 * for the page.
 *
 * @example
 * const session = authClient.useSession();
 * const adapter = bindSolidSession(createBetterAuthAdapter({ client: authClient }), () => ({
 *   data: mapBetterAuthSession(session().data),
 *   isPending: session().isPending,
 *   error: session().error,
 * }));
 */
export function bindSolidSession<Adapter extends AuthAdapter>(
  adapter: Adapter,
  read: Accessor<SessionSnapshot>,
): Adapter {
  if (getOwner()) return bind(adapter, read);
  return createRoot(() => bind(adapter, read));
}
