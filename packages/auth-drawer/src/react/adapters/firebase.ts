import {
  createFirebaseAdapter as createCoreFirebaseAdapter,
  type FirebaseAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/firebase";
import { withReactSession } from "../hooks/use-adapter-session";
import type { AuthAdapter } from "../types";

export type { FirebaseAdapterOptions };

export function createFirebaseAdapter(options: FirebaseAdapterOptions): AuthAdapter {
  return withReactSession(createCoreFirebaseAdapter(options));
}
