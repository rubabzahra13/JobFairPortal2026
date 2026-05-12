import { NextResponse } from "next/server";
import { PANEL_SESSION_COOKIE } from "@/lib/panel-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(PANEL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return response;
}
