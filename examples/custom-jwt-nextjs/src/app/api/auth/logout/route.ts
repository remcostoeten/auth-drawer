import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session-cookie";

// Stateless JWTs carry no server state, so signing out is just expiring the
// cookie. (This is where you'd also add token revocation / a denylist.)
export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
