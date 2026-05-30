import type { NextResponse } from "next/server";

/** Name of the HttpOnly cookie that carries the signed JWT. */
export const SESSION_COOKIE = "session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days — keep in sync with the JWT TTL.

const baseCookieOptions = {
  httpOnly: true, // not readable from JavaScript → safe from XSS token theft
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Attach the session JWT as an HttpOnly cookie on the response. */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Expire the session cookie (sign-out). */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
}
