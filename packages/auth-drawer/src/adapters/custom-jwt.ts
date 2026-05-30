import { useEffect, useState } from "react";
import type { AuthAdapter, AuthResult, AuthSessionState, OAuthProvider } from "../types";
import { createAdapterError } from "../errors";

export interface CustomJwtAdapterOptions {
  baseUrl?: string;
  loginUrl?: string;
  registerUrl?: string;
  logoutUrl?: string;
  profileUrl?: string;
  forgotPasswordUrl?: string;
  resetPasswordUrl?: string;
  tokenStorageKey?: string;
  providers?: OAuthProvider[];
  requireName?: boolean;
  oauthUrl?: (provider: string) => string;
  fetcher?: typeof fetch;
}

type ApiResult = {
  token?: string;
  user?: any;
  session?: any;
  message?: string;
};

function mapCustomJwtError(error: unknown, status?: number) {
  const message = String((error as { message?: string })?.message ?? "");
  const haystack = message.toLowerCase();
  if (status === 401 || haystack.includes("credential")) {
    return createAdapterError("invalid_credentials", "form", error);
  }
  if (status === 404) return createAdapterError("user_not_found", "email", error);
  if (status === 409 || haystack.includes("exists")) {
    return createAdapterError("email_taken", "email", error);
  }
  if (status === 422 && haystack.includes("password")) {
    return createAdapterError("weak_password", "password", error);
  }
  if (status === 422 && haystack.includes("email")) {
    return createAdapterError("invalid_email", "email", error);
  }
  if (status === 429) return createAdapterError("rate_limited", "form", error);
  if (status && status >= 500) return createAdapterError("server_error", "form", error);
  if (error instanceof TypeError) return createAdapterError("network_error", "form", error);
  return createAdapterError("unknown", "form", error);
}

function joinUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function parseResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok) {
    return { success: false, error: mapCustomJwtError(data, response.status) } satisfies AuthResult;
  }
  return { success: true, data } satisfies AuthResult<ApiResult>;
}

function mapProfile(data: ApiResult | null): AuthSessionState | null {
  const user = data?.user ?? data;
  if (!user || !("id" in user)) return null;
  return {
    user: {
      id: String(user.id),
      email: user.email ?? "",
      name: user.name,
      image: user.image ?? user.avatar,
    },
    session: data?.session ?? data,
  };
}

export function createCustomJwtAdapter(options: CustomJwtAdapterOptions = {}): AuthAdapter {
  const {
    baseUrl = "",
    loginUrl = "/login",
    registerUrl = "/register",
    logoutUrl = "/logout",
    profileUrl = "/me",
    forgotPasswordUrl = "/forgot-password",
    resetPasswordUrl = "/reset-password",
    tokenStorageKey = "auth_token",
    fetcher = fetch,
  } = options;

  const authFetch = (url: string, init: RequestInit = {}) => {
    const token = typeof window !== "undefined" ? localStorage.getItem(tokenStorageKey) : null;
    return fetcher(joinUrl(baseUrl, url), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  };

  return {
    id: "custom-jwt",
    providers: options.providers ?? [],
    requiresName: options.requireName,
    async signIn(input) {
      try {
        const result = await parseResponse(
          await authFetch(loginUrl, {
            method: "POST",
            body: JSON.stringify({ email: input.email, password: input.password }),
          }),
        );
        if (result.success && result.data?.token && typeof window !== "undefined") {
          localStorage.setItem(tokenStorageKey, result.data.token);
        }
        return result;
      } catch (error) {
        return { success: false, error: mapCustomJwtError(error) };
      }
    },
    async signUp(input) {
      try {
        const result = await parseResponse(
          await authFetch(registerUrl, {
            method: "POST",
            body: JSON.stringify({ email: input.email, password: input.password, name: input.name }),
          }),
        );
        if (result.success && result.data?.token && typeof window !== "undefined") {
          localStorage.setItem(tokenStorageKey, result.data.token);
        }
        return result;
      } catch (error) {
        return { success: false, error: mapCustomJwtError(error) };
      }
    },
    async signOut() {
      try {
        await authFetch(logoutUrl, { method: "POST" });
      } finally {
        if (typeof window !== "undefined") localStorage.removeItem(tokenStorageKey);
      }
      return { success: true };
    },
    async requestPasswordReset(email) {
      try {
        return await parseResponse(
          await authFetch(forgotPasswordUrl, {
            method: "POST",
            body: JSON.stringify({ email }),
          }),
        );
      } catch (error) {
        return { success: false, error: mapCustomJwtError(error) };
      }
    },
    async resetPassword({ newPassword }) {
      try {
        return await parseResponse(
          await authFetch(resetPasswordUrl, {
            method: "POST",
            body: JSON.stringify({ newPassword }),
          }),
        );
      } catch (error) {
        return { success: false, error: mapCustomJwtError(error) };
      }
    },
    signInWithOAuth: options.oauthUrl
      ? async (provider) => {
          if (typeof window !== "undefined") {
            window.location.href = options.oauthUrl?.(provider) ?? "";
            return new Promise(() => undefined);
          }
          return { success: true };
        }
      : undefined,
    useSession() {
      const [data, setData] = useState<AuthSessionState | null>(null);
      const [isPending, setIsPending] = useState(true);
      const [error, setError] = useState<unknown>(null);

      useEffect(() => {
        authFetch(profileUrl)
          .then(async (response) => {
            if (response.status === 401) return null;
            if (!response.ok) throw await response.json().catch(() => response);
            return (await response.json()) as ApiResult;
          })
          .then((profile) => setData(mapProfile(profile)))
          .catch(setError)
          .finally(() => setIsPending(false));
      }, []);

      return { data, isPending, error };
    },
    normalizeError: mapCustomJwtError,
  };
}
