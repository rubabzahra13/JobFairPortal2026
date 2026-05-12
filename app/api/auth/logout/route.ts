import { NextRequest, NextResponse } from "next/server";
import { PANEL_SESSION_COOKIE, shouldUseSecurePanelCookie } from "@/lib/panel-auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  response.cookies.set(PANEL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecurePanelCookie(request),
    maxAge: 0,
    path: "/",
  });

  return response;
}
