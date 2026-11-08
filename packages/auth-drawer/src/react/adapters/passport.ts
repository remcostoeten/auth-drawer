import {
  createPassportAdapter as createCorePassportAdapter,
  type PassportAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/passport";
import { withReactSession } from "../hooks/use-adapter-session";
import type { AuthAdapter } from "../types";

export type { PassportAdapterOptions };

export function createPassportAdapter(options: PassportAdapterOptions = {}): AuthAdapter {
  return withReactSession(createCorePassportAdapter(options));
}
