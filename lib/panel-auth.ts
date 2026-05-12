export const PANEL_SESSION_COOKIE = "vector_panel_session";
export const PANEL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type PanelSession = {
  username: string;
  displayName: string;
};

export type PanelUser = PanelSession & {
  password: string;
};

type CookieSecurityRequest = {
  headers?: Pick<Headers, "get">;
  nextUrl?: {
    protocol?: string;
  };
};

type SignedPanelSession = PanelSession & {
  issuedAt: number;
  expiresAt: number;
};

type HmacCrypto = Pick<SubtleCrypto, "importKey" | "sign">;

function constantTimeEqual(left: string, right: string): boolean {
  const maxLength = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }

  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function encodeBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function getSubtleCrypto(): Promise<HmacCrypto> {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;

  const nodeCrypto = await import("node:crypto");
  return nodeCrypto.webcrypto.subtle as unknown as HmacCrypto;
}

async function hmacSha256(value: string, secret: string): Promise<string> {
  const subtle = await getSubtleCrypto();
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

export function parsePanelCredentials(raw = process.env.PANEL_CREDENTIALS ?? ""): PanelUser[] {
  return raw
    .split(",")
    .map((entry) => {
      const [username, password, ...displayNameParts] = entry.split(":");

      return {
        username: username?.trim() ?? "",
        password: password?.trim() ?? "",
        displayName: displayNameParts.join(":").trim(),
      };
    })
    .filter((user) => user.username && user.password && user.displayName);
}

export function findPanelUser(
  username: string,
  password: string,
  users = parsePanelCredentials()
): PanelUser | null {
  const requestedUsername = username.trim();
  const user = users.find((candidate) => candidate.username === requestedUsername);

  if (!user || !constantTimeEqual(user.password, password)) return null;

  return user;
}

export function shouldUseSecurePanelCookie(request?: CookieSecurityRequest): boolean {
  const forwardedProto = request?.headers
    ?.get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const requestProtocol = request?.nextUrl?.protocol?.replace(/:$/, "").toLowerCase();
  const protocol = forwardedProto || requestProtocol;

  if (protocol === "https") return true;
  if (protocol === "http") return false;

  return process.env.NODE_ENV === "production";
}

export async function signSession(
  session: PanelSession,
  secret = process.env.PANEL_SESSION_SECRET ?? ""
): Promise<string> {
  if (!secret) throw new Error("PANEL_SESSION_SECRET is required");

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = encodeBase64Url(
    JSON.stringify({
      ...session,
      issuedAt,
      expiresAt: issuedAt + PANEL_SESSION_MAX_AGE_SECONDS,
    } satisfies SignedPanelSession)
  );
  const signature = await hmacSha256(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifySession(
  token: string | undefined,
  secret = process.env.PANEL_SESSION_SECRET ?? ""
): Promise<PanelSession | null> {
  if (!token || !secret) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expectedSignature = await hmacSha256(payload, secret);
  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const session = JSON.parse(decodeBase64Url(payload)) as Partial<SignedPanelSession>;

    if (
      typeof session.username !== "string" ||
      typeof session.displayName !== "string" ||
      typeof session.issuedAt !== "number" ||
      typeof session.expiresAt !== "number"
    ) {
      return null;
    }

    if (session.expiresAt <= Math.floor(Date.now() / 1000)) return null;

    return {
      username: session.username,
      displayName: session.displayName,
    };
  } catch {
    return null;
  }
}
