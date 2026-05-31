import { createPassportAdapter } from "@remcostoeten/auth-drawer/adapters/passport";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const authAdapter = createPassportAdapter({
  loginUrl: `${API_URL}/login`,
  registerUrl: `${API_URL}/register`,
  logoutUrl: `${API_URL}/logout`,
  userProfileUrl: `${API_URL}/user`,
  requireName: true,
  fetcher: (url, init) =>
    fetch(url, { ...init, credentials: "include" }),
});
