import { describe, expect, it, vi } from "vitest";
import { localResumeFileName, publicResumeUrl } from "./local-resume-storage";

describe("local resume storage helpers", () => {
  it("builds safe local resume file names", () => {
    expect(localResumeFileName("cand_abc.123", "Resume PDF.PDF")).toBe("cand_abc-123.pdf");
  });

  it("builds public URLs from backend public URL", () => {
    vi.stubEnv("BACKEND_PUBLIC_URL", "http://32.196.238.144/");
    expect(publicResumeUrl("cand_1.pdf")).toBe("http://32.196.238.144/uploads/resumes/cand_1.pdf");
    vi.unstubAllEnvs();
  });
});
