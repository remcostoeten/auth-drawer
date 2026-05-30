import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { users } from "@/db/schema";
import { signAccessToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/passwords";
import { setSessionCookie } from "@/lib/session-cookie";
import { normalizeEmail, toPublicUser } from "@/lib/users";

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 422 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);

  // Same response for unknown email and bad password — avoids user enumeration.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  // The JWT goes into an HttpOnly cookie, never the response body — so it stays
  // out of reach of client-side JavaScript.
  const token = await signAccessToken({ sub: user.id, email: user.email, name: user.name });
  const response = NextResponse.json({ user: toPublicUser(user) });
  setSessionCookie(response, token);
  return response;
}
