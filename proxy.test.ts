import { afterEach, describe, expect, it, vi } from "vitest";
import { getBackendOrigin, isPublicPath, verifyBackendSession } from "./proxy";

describe("proxy public path classification", () => {
  it("keeps known public routes and assets public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/apply")).toBe(true);
    expect(isPublicPath("/upload")).toBe(true);
    expect(isPublicPath("/api/auth/login")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
    expect(isPublicPath("/api/apply")).toBe(true);
    expect(isPublicPath("/uploads/resumes/cand_1.pdf")).toBe(true);
    expect(isPublicPath("/_next/static/chunk.js")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
    expect(isPublicPath("/file.svg")).toBe(true);
    expect(isPublicPath("/globe.svg")).toBe(true);
    expect(isPublicPath("/next.svg")).toBe(true);
    expect(isPublicPath("/vercel.svg")).toBe(true);
    expect(isPublicPath("/window.svg")).toBe(true);
  });

  it("does not make protected dynamic API or app routes public because they contain dots", () => {
    expect(isPublicPath("/api/candidates/foo.bar")).toBe(false);
    expect(isPublicPath("/api/parse-cv")).toBe(false);
    expect(isPublicPath("/candidates/foo.bar")).toBe(false);
    expect(isPublicPath("/submissions/export.csv")).toBe(false);
  });
});

describe("proxy backend session fallback", () => {
  const originalBackendOrigin = process.env.BACKEND_ORIGIN;
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    if (originalBackendOrigin === undefined) delete process.env.BACKEND_ORIGIN;
    else process.env.BACKEND_ORIGIN = originalBackendOrigin;

    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("defaults Vercel runtime auth checks to the EC2 backend", () => {
    delete process.env.BACKEND_ORIGIN;
    process.env.VERCEL = "1";

    expect(getBackendOrigin()).toBe("http://32.196.238.144");
  });

  it("prefers an explicit backend origin and strips a trailing slash", () => {
    process.env.BACKEND_ORIGIN = "https://api.example.test/";
    process.env.VERCEL = "1";

    expect(getBackendOrigin()).toBe("https://api.example.test");
  });

  it("accepts a session validated by the backend", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: { username: "ibrahim", displayName: "Ibrahim Basit" } }),
    })) as unknown as typeof fetch;

    await expect(
      verifyBackendSession("vector_panel_session=signed", "http://backend.test", fetchImpl)
    ).resolves.toEqual({ username: "ibrahim", displayName: "Ibrahim Basit" });
    expect(fetchImpl).toHaveBeenCalledWith("http://backend.test/api/auth/session", {
      headers: { cookie: "vector_panel_session=signed" },
      cache: "no-store",
    });
  });

  it("rejects missing or invalid backend sessions", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    })) as unknown as typeof fetch;

    await expect(
      verifyBackendSession("vector_panel_session=signed", "http://backend.test", fetchImpl)
    ).resolves.toBeNull();
    await expect(verifyBackendSession("", "http://backend.test", fetchImpl)).resolves.toBeNull();
  });
});
