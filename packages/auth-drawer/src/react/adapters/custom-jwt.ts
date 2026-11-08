import {
  createCustomJwtAdapter as createCoreCustomJwtAdapter,
  type CustomJwtAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/custom-jwt";
import { withReactSession } from "../hooks/use-adapter-session";
import type { AuthAdapter } from "../types";

export type { CustomJwtAdapterOptions };

export function createCustomJwtAdapter(options: CustomJwtAdapterOptions = {}): AuthAdapter {
  return withReactSession(createCoreCustomJwtAdapter(options));
}
