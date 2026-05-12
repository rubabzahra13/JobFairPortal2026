import { describe, expect, it } from "vitest";
import { isPublicPath } from "./proxy";

describe("proxy public path classification", () => {
  it("keeps known public routes and assets public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/apply")).toBe(true);
    expect(isPublicPath("/upload")).toBe(true);
    expect(isPublicPath("/api/auth/login")).toBe(true);
    expect(isPublicPath("/api/apply")).toBe(true);
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
