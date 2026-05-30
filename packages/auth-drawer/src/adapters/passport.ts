import type { AuthAdapter, AuthResult, AuthSessionState } from "../types";
import { createAdapterError } from "../errors";
import { createRevalidatingSession } from "./revalidating-session";

export interface PassportAdapterOptions {
  loginUrl?: string;
  logoutUrl?: string;
  userProfileUrl?: string;
  registerUrl?: string;
  requireName?: boolean;
  fetcher?: typeof fetch;
}

function mapPassportError(error: unknown, status?: number) {
  const message = String((error as { message?: string })?.message ?? "");
  if (status === 401) return createAdapterError("invalid_credentials", "form", error);
  if (status === 404) return createAdapterError("user_not_found", "email", error);
  if (status === 409) return createAdapterError("email_taken", "email", error);
  if (status === 429) return createAdapterError("rate_limited", "form", error);
  if (status && status >= 500) return createAdapterError("server_error", "form", error);
  if (error instanceof TypeError) return createAdapterError("network_error", "form", error);
  return createAdapterError("unknown", "form", { message: message || "Passport request failed.", cause: error });
}

async function parseResponse(response: Response): Promise<AuthResult> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { success: false, error: mapPassportError(data, response.status) };
  return { success: true, data };
}

function mapUser(data: any): AuthSessionState | null {
  if (!data) return null;
  return {
    user: {
      id: String(data.id ?? data._id ?? data.email ?? data.username),
      email: data.email ?? data.username ?? "",
      name: data.name ?? data.displayName,
      image: data.avatar ?? data.imageUrl,
    },
    session: data,
  };
}

export function createPassportAdapter(options: PassportAdapterOptions = {}): AuthAdapter {
  const {
    loginUrl = "/login",
    logoutUrl = "/logout",
    userProfileUrl = "/user",
    registerUrl = "/register",
    fetcher = fetch,
  } = options;

  const { notifySession, useSession } = createRevalidatingSession(async () => {
    try {
      const response = await fetcher(userProfileUrl, { credentials: "include" });
      if (response.status === 401) return { data: null, error: null };
      if (!response.ok) throw new Error("Profile request failed");
      const user = await response.json();
      return { data: mapUser(user), error: null };
    } catch (error) {
      return { data: null, error };
    }
  });

  return {
    id: "passport",
    requiresName: options.requireName,
    async signIn({ email, password }) {
      try {
        const result = await parseResponse(
          await fetcher(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username: email, password }),
          }),
        );
        if (result.success) notifySession();
        return result;
      } catch (error) {
        return { success: false, error: mapPassportError(error) };
      }
    },
    async signUp({ email, password, name }) {
      try {
        const result = await parseResponse(
          await fetcher(registerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username: email, password, name }),
          }),
        );
        if (result.success) notifySession();
        return result;
      } catch (error) {
        return { success: false, error: mapPassportError(error) };
      }
    },
    async signOut() {
      await fetcher(logoutUrl, { method: "POST", credentials: "include" });
      notifySession();
      return { success: true };
    },
    useSession,
    normalizeError: mapPassportError,
  };
}
