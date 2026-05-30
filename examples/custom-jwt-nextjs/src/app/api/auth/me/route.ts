import { type NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/server-auth";
import { toPublicUser } from "@/lib/users";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    // The adapter treats 401 as "signed out" and renders the unauthenticated UI.
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }
  return NextResponse.json({ user: toPublicUser(user) });
}
