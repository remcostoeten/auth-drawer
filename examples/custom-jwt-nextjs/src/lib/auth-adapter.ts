import { createCustomJwtAdapter } from "@remcostoeten/auth-drawer/adapters/custom-jwt";
import { oauthProviders } from "@/lib/oauth-providers";

/**
 * Bridges the drawer UI to this app's REST auth API. The session JWT lives in an
 * HttpOnly cookie (the industry-standard, XSS-safe choice), so — unlike the
 * adapter's default localStorage + Bearer flow — there is no token for
 * JavaScript to read or attach. The browser replays the cookie automatically;
 * the only job here is to make every request send credentials.
 *
 *   - login / register set the cookie server-side (Set-Cookie)
 *   - the session is read by GETting `${baseUrl}/me`, which reads the cookie
 *   - logout expires the cookie server-side
 *
 * Implementing signUp/requestPasswordReset here is what reveals the Register
 * tab and the forgot-password link in the drawer (feature detection).
 */
export const authAdapter = createCustomJwtAdapter({
  baseUrl: "/api/auth",
  requireName: true,
  providers: oauthProviders,
  fetcher: (input, init) => fetch(input, { ...init, credentials: "include" }),
  // To enable OAuth, list providers above and return the backend's redirect URL:
  // oauthUrl: (provider) => `/api/auth/oauth/${provider}`,
});
