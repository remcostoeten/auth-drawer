import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db/connection";
import { users, type UserRow } from "@/db/schema";
import { verifyAccessToken } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Resolve the authenticated user from the request's HttpOnly session cookie.
 * Returns null when the cookie is absent, invalid, expired, or the user is gone.
 */
export async function getUserFromRequest(request: NextRequest): Promise<UserRow | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifyAccessToken(token);
  if (!claims) return null;

  const [row] = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1);
  return row ?? null;
}
