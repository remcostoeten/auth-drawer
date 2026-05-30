import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/connection";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPassword } from "@/lib/passwords";

export async function POST(request: Request) {
  const { token, newPassword } = (await request.json().catch(() => ({}))) as {
    token?: string;
    newPassword?: string;
  };

  if (!token) {
    return NextResponse.json({ message: "Missing reset token." }, { status: 422 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 422 },
    );
  }

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, new Date())),
    )
    .limit(1);

  if (!resetToken) {
    return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, resetToken.userId));

  // Single-use: drop every reset token for this user once one succeeds.
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

  return NextResponse.json({ success: true });
}
