import { NextRequest, NextResponse } from "next/server";
import {
  PANEL_SESSION_COOKIE,
  PANEL_SESSION_MAX_AGE_SECONDS,
  findPanelUser,
  shouldUseSecurePanelCookie,
  signSession,
} from "@/lib/panel-auth";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const credentials = body as Partial<Record<"username" | "password", unknown>>;
  const username = typeof credentials.username === "string" ? credentials.username : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  const user = findPanelUser(username, password);

  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const session = { username: user.username, displayName: user.displayName };
  const token = await signSession(session);
  const response = NextResponse.json({ user: session });

  response.cookies.set(PANEL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecurePanelCookie(request),
    maxAge: PANEL_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
