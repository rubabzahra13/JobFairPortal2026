import { describe, expect, it, vi } from "vitest";
import {
  findPanelUser,
  parsePanelCredentials,
  shouldUseSecurePanelCookie,
  signSession,
  verifySession,
} from "./panel-auth";

describe("panel auth", () => {
  it("parses configured panel users", () => {
    const users = parsePanelCredentials("ibrahim:pass:Ibrahim Basit,saleh:pass2:Saleh");

    expect(users).toEqual([
      { username: "ibrahim", password: "pass", displayName: "Ibrahim Basit" },
      { username: "saleh", password: "pass2", displayName: "Saleh" },
    ]);
  });

  it("finds a panel user only when username and password match", () => {
    const users = parsePanelCredentials("ibrahim:pass:Ibrahim Basit");

    expect(findPanelUser("ibrahim", "pass", users)).toMatchObject({
      username: "ibrahim",
      displayName: "Ibrahim Basit",
    });
    expect(findPanelUser("ibrahim", "wrong", users)).toBeNull();
    expect(findPanelUser("saleh", "pass", users)).toBeNull();
  });

  it("signs and verifies panel session tokens", async () => {
    const token = await signSession(
      { username: "ibrahim", displayName: "Ibrahim Basit" },
      "secret-secret-secret-secret"
    );

    expect(await verifySession(token, "secret-secret-secret-secret")).toEqual({
      username: "ibrahim",
      displayName: "Ibrahim Basit",
    });
  });

  it("rejects tampered signed sessions", async () => {
    const token = await signSession(
      { username: "ibrahim", displayName: "Ibrahim Basit" },
      "secret-secret-secret-secret"
    );

    expect(await verifySession(`${token}x`, "secret-secret-secret-secret")).toBeNull();
  });

  it("rejects expired signed sessions", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));

      const token = await signSession(
        { username: "ibrahim", displayName: "Ibrahim Basit" },
        "secret-secret-secret-secret"
      );

      vi.setSystemTime(new Date("2026-05-12T12:00:00.000Z"));
      expect(await verifySession(token, "secret-secret-secret-secret")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not mark cookies secure for direct HTTP EC2 requests", () => {
    expect(
      shouldUseSecurePanelCookie({
        headers: new Headers(),
        nextUrl: { protocol: "http:" },
      })
    ).toBe(false);
  });

  it("marks cookies secure when the request or proxy protocol is HTTPS", () => {
    expect(
      shouldUseSecurePanelCookie({
        headers: new Headers(),
        nextUrl: { protocol: "https:" },
      })
    ).toBe(true);
    expect(
      shouldUseSecurePanelCookie({
        headers: new Headers({ "x-forwarded-proto": "https" }),
        nextUrl: { protocol: "http:" },
      })
    ).toBe(true);
  });
});
