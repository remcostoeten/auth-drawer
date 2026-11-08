import {
  createSupabaseAdapter as createCoreSupabaseAdapter,
  type SupabaseAdapterOptions,
} from "@remcostoeten/auth-drawer/core/adapters/supabase";
import { withReactSession } from "../hooks/use-adapter-session";
import type { AuthAdapter } from "../types";

export type { SupabaseAdapterOptions };

export function createSupabaseAdapter(options: SupabaseAdapterOptions): AuthAdapter {
  return withReactSession(createCoreSupabaseAdapter(options));
}
