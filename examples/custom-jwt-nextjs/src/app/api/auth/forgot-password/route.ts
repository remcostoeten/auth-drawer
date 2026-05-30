import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { passwordResetTokens, users } from "@/db/schema";
import { normalizeEmail } from "@/lib/users";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  if (!email) {
    return NextResponse.json({ message: "Email is required." }, { status: 422 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);

  // Only act if the user exists, but always return success to avoid leaking
  // which emails are registered.
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3006";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    if (process.env.NODE_ENV === "development") {
      console.log(`[custom-jwt] Password reset for ${normalizeEmail(email)}:\n${resetUrl}`);
    }
    // Wire up a real mailer here (Resend, Postmark, SES, …).
  }

  return NextResponse.json({ success: true });
}
