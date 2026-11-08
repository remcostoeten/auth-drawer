import {
  createMockAdapter as createCoreMockAdapter,
  type MockAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/mock";
import { withReactSession } from "../hooks/use-adapter-session";
import type { AuthAdapter } from "../types";

export type { MockAdapterOptions };

export function createMockAdapter(options: MockAdapterOptions = {}): AuthAdapter {
  return withReactSession(createCoreMockAdapter(options));
}
