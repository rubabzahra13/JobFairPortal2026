import { NextRequest, NextResponse } from "next/server";
import { PANEL_SESSION_COOKIE, verifySession } from "@/lib/panel-auth";

export async function GET(request: NextRequest) {
  const session = await verifySession(request.cookies.get(PANEL_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: session });
}
