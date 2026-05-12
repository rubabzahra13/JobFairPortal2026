import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PANEL_SESSION_COOKIE, verifySession } from "./lib/panel-auth";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/apply",
  "/upload",
  "/api/auth/login",
  "/api/apply",
  "/_next",
];

const PUBLIC_ASSET_PATHS = new Set([
  "/favicon.ico",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const session = await verifySession(request.cookies.get(PANEL_SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) || PUBLIC_ASSET_PATHS.has(pathname)
  );
}
