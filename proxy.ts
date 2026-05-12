import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PANEL_SESSION_COOKIE, type PanelSession, verifySession } from "./lib/panel-auth";

const DEFAULT_EC2_BACKEND_ORIGIN = "http://32.196.238.144";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/apply",
  "/upload",
  "/api/auth/login",
  "/api/auth/session",
  "/api/apply",
  "/uploads/resumes",
  "/_next",
];

const PUBLIC_ASSET_PATHS = new Set([
  "/favicon.ico",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vector-candidate-apply-qr.png",
  "/vercel.svg",
  "/window.svg",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const session = await getPanelSession(request);
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

export function getBackendOrigin(): string {
  return (
    process.env.BACKEND_ORIGIN ||
    (process.env.VERCEL ? DEFAULT_EC2_BACKEND_ORIGIN : "")
  ).replace(/\/$/, "");
}

export async function verifyBackendSession(
  cookieHeader: string,
  backendOrigin = getBackendOrigin(),
  fetchImpl: typeof fetch = fetch
): Promise<PanelSession | null> {
  if (!cookieHeader || !backendOrigin) return null;

  try {
    const response = await fetchImpl(`${backendOrigin}/api/auth/session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { user?: Partial<PanelSession> };
    if (
      typeof payload.user?.username !== "string" ||
      typeof payload.user?.displayName !== "string"
    ) {
      return null;
    }

    return {
      username: payload.user.username,
      displayName: payload.user.displayName,
    };
  } catch {
    return null;
  }
}

async function getPanelSession(request: NextRequest): Promise<PanelSession | null> {
  const localSession = await verifySession(request.cookies.get(PANEL_SESSION_COOKIE)?.value);
  if (localSession) return localSession;

  return verifyBackendSession(request.headers.get("cookie") ?? "");
}
