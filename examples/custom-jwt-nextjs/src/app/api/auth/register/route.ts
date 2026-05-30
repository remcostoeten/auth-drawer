import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { users } from "@/db/schema";
import { signAccessToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/passwords";
import { setSessionCookie } from "@/lib/session-cookie";
import { normalizeEmail, toPublicUser } from "@/lib/users";

export async function POST(request: Request) {
  const { email, password, name } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || !name) {
    return NextResponse.json({ message: "Name, email and password are required." }, { status: 422 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 422 },
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
  }

  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: await hashPassword(password),
    })
    .returning();

  // Register also signs the user in: issue the JWT into the HttpOnly cookie.
  const token = await signAccessToken({ sub: user.id, email: user.email, name: user.name });
  const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  setSessionCookie(response, token);
  return response;
}
