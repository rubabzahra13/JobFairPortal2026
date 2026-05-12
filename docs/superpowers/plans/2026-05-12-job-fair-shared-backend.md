# Job Fair Shared Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the localStorage-only Vector job fair portal into a shared, deployable Next app with QR candidate intake, panel login, Google Sheets/Drive persistence, and Gemini candidate insights.

**Architecture:** Host the frontend and backend together as one Next 16 app on Vercel. Use Next route handlers in `app/api/*` as the backend, Google Sheets as the shared candidate/evaluation store, Google Drive for resume files, signed HTTP-only cookies for the panel session, and Gemini as an optional insight generator. Keep the existing dashboard and candidate evaluation UI, but replace localStorage access with API-backed records.

**Tech Stack:** Next 16 App Router, React 19, TypeScript, Google Sheets API, Google Drive API, Gemini REST API, Vercel environment variables, Vitest for focused unit tests.

---

## Hosting Decision

Deploy this repo to Vercel. The backend will be the same deployment as the portal:

- Public candidate QR page: `https://<deployment-domain>/apply`
- Protected panel: `https://<deployment-domain>/`
- Backend route handlers: `https://<deployment-domain>/api/*`

No separate EC2, Azure App Service, or database is required for the first job fair version. Google Sheets and Drive are the external shared storage.

## Environment Variables

Add these to `.env.local` for development and to Vercel Project Settings -> Environment Variables for production:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL="vector-job-fair-writer@<project-id>.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="<spreadsheet-id-from-url>"
GOOGLE_DRIVE_FOLDER_ID="<drive-folder-id-from-url>"
PANEL_CREDENTIALS="ibrahim:change-this-password:Ibrahim Basit,saleh:change-this-password:Saleh,rubab:change-this-password:Rubab,sabah:change-this-password:Sabah Nawab,maaz:change-this-password:Maaz Ali Nadeem,tauseef:change-this-password:Tauseef Razzaq"
PANEL_SESSION_SECRET="<32+ random characters>"
GEMINI_API_KEY="<optional-gemini-api-key>"
NEXT_PUBLIC_APP_URL="https://<deployment-domain>"
```

## File Structure

- Create `lib/candidate-record.ts`: shared persisted candidate record type, score defaults, row conversion helpers.
- Create `lib/panel-auth.ts`: credential parsing, password checking, session signing, session verification.
- Create `lib/google-client.ts`: service account auth for Sheets and Drive.
- Create `lib/google-sheets.ts`: append/update/list candidate rows.
- Create `lib/google-drive.ts`: upload resume files and return Drive links.
- Create `lib/gemini-insights.ts`: generate deterministic JSON insights from candidate fields and resume text.
- Create `app/login/page.tsx`: panel login screen.
- Create `app/api/auth/login/route.ts`: login route that sets signed cookie.
- Create `app/api/auth/logout/route.ts`: logout route that clears cookie.
- Create `proxy.ts`: protect panel routes and panel APIs while leaving `/apply`, `/upload`, `/api/apply`, `/api/parse-cv`, and static assets public.
- Create `app/apply/page.tsx`: QR candidate form.
- Create `app/api/apply/route.ts`: candidate submission endpoint that parses the resume, uploads to Drive, writes to Sheets, and returns the created candidate.
- Create `app/api/candidates/route.ts`: list/create records for panel UI.
- Create `app/api/candidates/[id]/route.ts`: read/update one record from panel UI.
- Create `app/api/insights/[id]/route.ts`: regenerate Gemini insight for one candidate.
- Modify `lib/types.ts`: add intake fields and insight fields to `Candidate`.
- Modify `lib/store.ts`: convert existing client storage API to async API-backed calls.
- Modify `hooks/use-candidates.ts`: load candidates from `/api/candidates`.
- Modify `components/candidates/candidate-form.tsx`: save through API and include graduation location question.
- Modify `components/dashboard/candidates-table.tsx`: display intake source, current city/hometown, graduation plan, and insight availability.
- Modify `components/layout/top-nav.tsx`: add logout action and apply link.
- Modify `app/upload/page.tsx`: either redirect to `/apply` or reuse the new intake endpoint.
- Modify `next.config.ts`: add server external packages if `googleapis` needs bundling support.
- Modify `package.json`: add `googleapis` and `vitest`.

---

### Task 1: Add Dependencies And Baseline Checks

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependencies**

```bash
npm install googleapis
npm install -D vitest
```

- [ ] **Step 2: Verify package scripts include test command**

Add this to `package.json` scripts:

```json
"test": "vitest run"
```

- [ ] **Step 3: Run baseline checks**

```bash
npm run lint
npm run build
```

Expected: existing project either passes, or any pre-existing failures are recorded before feature work begins.

### Task 2: Define Shared Candidate Record Schema

**Files:**
- Create: `lib/candidate-record.ts`
- Create: `lib/candidate-record.test.ts`
- Modify: `lib/types.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { candidateToSheetRow, sheetRowToCandidate } from "./candidate-record";

describe("candidate sheet mapping", () => {
  it("round trips core intake, scores, and insight fields", () => {
    const candidate = {
      id: "cand_1",
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "03001234567",
      hometown: "Rawalpindi",
      currentCity: "Islamabad",
      graduationLocationPlan: "Islamabad after graduation",
      degree: "BS Computer Science",
      batch: "2026",
      yearsOfExperience: "Internship",
      scores: { technicalDepth: 6, personality: 9, communication: 8, khandaniPan: 8 },
      archetype: "pilot" as const,
      evaluators: "Ibrahim",
      notes: "Strong communicator",
      status: "screening" as const,
      source: "qr" as const,
      resumeFileName: "ayesha.pdf",
      resumeUrl: "https://drive.google.com/file/d/abc/view",
      resumeText: "React internship",
      geminiInsight: "High ownership signal.",
      geminiUpdatedAt: "2026-05-12T14:00:00.000Z",
      createdAt: "2026-05-12T14:00:00.000Z",
      updatedAt: "2026-05-12T14:00:00.000Z",
    };

    expect(sheetRowToCandidate(candidateToSheetRow(candidate))).toEqual(candidate);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/candidate-record.test.ts
```

Expected: FAIL because `lib/candidate-record.ts` does not exist.

- [ ] **Step 3: Implement schema and row mapping**

Create `lib/candidate-record.ts` with:

```ts
import type { Candidate } from "@/lib/types";

export const CANDIDATE_SHEET_HEADERS = [
  "id",
  "name",
  "email",
  "phone",
  "hometown",
  "currentCity",
  "graduationLocationPlan",
  "degree",
  "batch",
  "yearsOfExperience",
  "technicalDepth",
  "personality",
  "communication",
  "khandaniPan",
  "archetype",
  "evaluators",
  "notes",
  "status",
  "source",
  "resumeFileName",
  "resumeUrl",
  "resumeText",
  "geminiInsight",
  "geminiUpdatedAt",
  "createdAt",
  "updatedAt",
] as const;

export function candidateToSheetRow(candidate: Candidate): string[] {
  return [
    candidate.id,
    candidate.name,
    candidate.email ?? "",
    candidate.phone ?? "",
    candidate.hometown,
    candidate.currentCity ?? "",
    candidate.graduationLocationPlan ?? "",
    candidate.degree,
    candidate.batch,
    candidate.yearsOfExperience,
    String(candidate.scores.technicalDepth),
    String(candidate.scores.personality),
    String(candidate.scores.communication),
    String(candidate.scores.khandaniPan),
    candidate.archetype,
    candidate.evaluators,
    candidate.notes,
    candidate.status ?? "screening",
    candidate.source ?? "panel",
    candidate.resumeFileName ?? "",
    candidate.resumeUrl ?? "",
    candidate.resumeText ?? "",
    candidate.geminiInsight ?? "",
    candidate.geminiUpdatedAt ?? "",
    candidate.createdAt,
    candidate.updatedAt,
  ];
}

export function sheetRowToCandidate(row: string[]): Candidate {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    email: row[2] ?? "",
    phone: row[3] ?? "",
    hometown: row[4] ?? "",
    currentCity: row[5] ?? "",
    graduationLocationPlan: row[6] ?? "",
    degree: row[7] ?? "",
    batch: row[8] ?? "",
    yearsOfExperience: row[9] ?? "",
    scores: {
      technicalDepth: Number(row[10] || 0),
      personality: Number(row[11] || 0),
      communication: Number(row[12] || 0),
      khandaniPan: Number(row[13] || 0),
    },
    archetype: (row[14] || "pilot") as Candidate["archetype"],
    evaluators: row[15] ?? "",
    notes: row[16] ?? "",
    status: (row[17] || "screening") as Candidate["status"],
    source: (row[18] || "panel") as Candidate["source"],
    resumeFileName: row[19] ?? "",
    resumeUrl: row[20] ?? "",
    resumeText: row[21] ?? "",
    geminiInsight: row[22] ?? "",
    geminiUpdatedAt: row[23] ?? "",
    createdAt: row[24] ?? new Date().toISOString(),
    updatedAt: row[25] ?? new Date().toISOString(),
  };
}
```

Update `Candidate` in `lib/types.ts` with:

```ts
email?: string;
phone?: string;
currentCity?: string;
graduationLocationPlan?: string;
status?: "screening" | "shortlisted" | "rejected" | "hired";
source?: "qr" | "panel" | "import";
resumeFileName?: string;
resumeUrl?: string;
resumeText?: string;
geminiInsight?: string;
geminiUpdatedAt?: string;
```

- [ ] **Step 4: Verify test passes**

```bash
npm test -- lib/candidate-record.test.ts
```

Expected: PASS.

### Task 3: Add Panel Authentication

**Files:**
- Create: `lib/panel-auth.ts`
- Create: `lib/panel-auth.test.ts`
- Create: `app/login/page.tsx`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `proxy.ts`

- [ ] **Step 1: Write failing auth tests**

```ts
import { describe, expect, it } from "vitest";
import { parsePanelCredentials, signSession, verifySession } from "./panel-auth";

describe("panel auth", () => {
  it("parses configured panel users", () => {
    const users = parsePanelCredentials("ibrahim:pass:Ibrahim Basit,saleh:pass2:Saleh");
    expect(users.map((user) => user.displayName)).toEqual(["Ibrahim Basit", "Saleh"]);
  });

  it("rejects tampered signed sessions", async () => {
    const token = await signSession({ username: "ibrahim", displayName: "Ibrahim Basit" }, "secret-secret-secret-secret");
    expect(await verifySession(token, "secret-secret-secret-secret")).toMatchObject({ username: "ibrahim" });
    expect(await verifySession(`${token}x`, "secret-secret-secret-secret")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/panel-auth.test.ts
```

Expected: FAIL because `lib/panel-auth.ts` does not exist.

- [ ] **Step 3: Implement signed cookie auth**

Create `lib/panel-auth.ts` using `crypto.subtle` HMAC SHA-256. Export:

```ts
export const PANEL_SESSION_COOKIE = "vector_panel_session";
export type PanelSession = { username: string; displayName: string };
export type PanelUser = PanelSession & { password: string };
export function parsePanelCredentials(raw = process.env.PANEL_CREDENTIALS ?? ""): PanelUser[];
export function findPanelUser(username: string, password: string): PanelUser | null;
export async function signSession(session: PanelSession, secret = process.env.PANEL_SESSION_SECRET ?? ""): Promise<string>;
export async function verifySession(token: string | undefined, secret = process.env.PANEL_SESSION_SECRET ?? ""): Promise<PanelSession | null>;
```

Use `timingSafeEqual` where available for password and signature comparison.

- [ ] **Step 4: Add login API**

Create `app/api/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { PANEL_SESSION_COOKIE, findPanelUser, signSession } from "@/lib/panel-auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const user = findPanelUser(String(username ?? ""), String(password ?? ""));

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession({ username: user.username, displayName: user.displayName });
  const response = NextResponse.json({ ok: true, user: { username: user.username, displayName: user.displayName } });
  response.cookies.set(PANEL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
```

- [ ] **Step 5: Add logout API**

Create `app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { PANEL_SESSION_COOKIE } from "@/lib/panel-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PANEL_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
```

- [ ] **Step 6: Add login page**

Create `app/login/page.tsx` as a client form with username, password, submit button, and error state. On success, navigate to `/`.

- [ ] **Step 7: Protect panel routes with Proxy**

Create `proxy.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { PANEL_SESSION_COOKIE, verifySession } from "@/lib/panel-auth";

const PUBLIC_PREFIXES = ["/login", "/apply", "/upload", "/api/auth/login", "/api/apply", "/api/parse-cv", "/_next", "/favicon.ico"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return NextResponse.next();

  const session = await verifySession(req.cookies.get(PANEL_SESSION_COOKIE)?.value);
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
```

- [ ] **Step 8: Verify auth tests pass**

```bash
npm test -- lib/panel-auth.test.ts
```

Expected: PASS.

### Task 4: Add Google Sheets And Drive Integration

**Files:**
- Create: `lib/google-client.ts`
- Create: `lib/google-sheets.ts`
- Create: `lib/google-drive.ts`

- [ ] **Step 1: Implement Google client**

Create `lib/google-client.ts`:

```ts
import { google } from "googleapis";

export function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account env vars are missing");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}
```

- [ ] **Step 2: Implement Sheets repository**

Create `lib/google-sheets.ts` with:

```ts
export async function ensureCandidateSheet(): Promise<void>;
export async function listCandidatesFromSheet(): Promise<Candidate[]>;
export async function upsertCandidateToSheet(candidate: Candidate): Promise<Candidate>;
export async function getCandidateFromSheet(id: string): Promise<Candidate | null>;
```

Use range `Candidates!A:Z`, `CANDIDATE_SHEET_HEADERS`, `candidateToSheetRow`, and `sheetRowToCandidate`.

- [ ] **Step 3: Implement Drive upload**

Create `lib/google-drive.ts` with:

```ts
export async function uploadResumeToDrive(file: File, candidateId: string): Promise<{ fileName: string; url: string }>;
```

Upload to `process.env.GOOGLE_DRIVE_FOLDER_ID`, set a readable link if the folder is shared internally, and return `https://drive.google.com/file/d/<id>/view`.

- [ ] **Step 4: Verify typecheck**

```bash
npm run build
```

Expected: compile errors only where route handlers have not been added yet; fix import/type errors before proceeding.

### Task 5: Add Candidate API Routes

**Files:**
- Create: `app/api/candidates/route.ts`
- Create: `app/api/candidates/[id]/route.ts`

- [ ] **Step 1: Create list/create route**

`GET /api/candidates` returns `{ candidates }` from Sheets.

`POST /api/candidates` accepts a partial candidate, applies defaults, writes to Sheets, and returns `{ candidate }`.

- [ ] **Step 2: Create read/update route**

`GET /api/candidates/[id]` returns one candidate or 404.

`PATCH /api/candidates/[id]` merges candidate updates, refreshes `updatedAt`, writes to Sheets, and returns `{ candidate }`.

- [ ] **Step 3: Verify route handler compilation**

```bash
npm run build
```

Expected: candidate API routes typecheck.

### Task 6: Add QR Candidate Intake

**Files:**
- Create: `app/apply/page.tsx`
- Create: `app/api/apply/route.ts`
- Modify: `app/upload/page.tsx`

- [ ] **Step 1: Build `/apply` form**

Fields:

```txt
Full name
Email
Phone
Degree / major
Batch / graduation year
Hometown
Current city
Where do you plan to be after graduating?
Resume PDF
```

Make hometown and graduation plan required.

- [ ] **Step 2: Build `POST /api/apply`**

Flow:

```txt
read multipart form
validate required fields
parse resume text with existing PDF parser logic
upload PDF to Drive
create Candidate with source="qr" and status="screening"
generate Gemini insight when GEMINI_API_KEY is present
upsert candidate to Sheets
return { candidate }
```

- [ ] **Step 3: Reuse or redirect old upload page**

Change `app/upload/page.tsx` to direct public candidates to `/apply` so there is only one intake flow.

- [ ] **Step 4: Manual API verification**

```bash
npm run dev
```

Submit `/apply` with a test PDF. Expected: a new row appears in Google Sheets and the resume appears in the configured Drive folder.

### Task 7: Add Gemini Insights

**Files:**
- Create: `lib/gemini-insights.ts`
- Create: `app/api/insights/[id]/route.ts`
- Modify: `app/api/apply/route.ts`
- Modify: `app/candidates/[id]/page.tsx`

- [ ] **Step 1: Implement insight generator**

Use Gemini REST API with `GEMINI_API_KEY`. The system instruction:

```txt
You support VECTOR Inc hiring panel at the FAST Islamabad job fair. Produce concise candidate insights from the resume and form fields. Weight personality, communication, ownership, clarity, coachability, location availability, and work style more heavily than raw technical depth. Do not invent facts. Do not make a final hiring decision. Return practical interview prompts and risks.
```

Return a compact JSON object:

```ts
type GeminiInsight = {
  summary: string;
  strengths: string[];
  concerns: string[];
  interviewPrompts: string[];
  locationFit: string;
};
```

- [ ] **Step 2: Add regenerate route**

`POST /api/insights/[id]` loads the candidate from Sheets, regenerates the insight, writes it back to Sheets, and returns `{ candidate }`.

- [ ] **Step 3: Display insight on candidate page**

Show insight summary, concerns, prompts, and location fit. If missing, show a “Generate insight” button.

- [ ] **Step 4: Verify with and without key**

Without `GEMINI_API_KEY`: app still works and shows no insight.

With `GEMINI_API_KEY`: submitting `/apply` populates insight in Sheets.

### Task 8: Convert Panel UI To API-Backed Data

**Files:**
- Modify: `lib/store.ts`
- Modify: `hooks/use-candidates.ts`
- Modify: `components/candidates/candidate-form.tsx`
- Modify: `components/dashboard/candidates-table.tsx`
- Modify: `app/candidates/[id]/page.tsx`
- Modify: `app/candidates/[id]/edit/page.tsx`
- Modify: `app/candidates/new/page.tsx`
- Modify: `components/layout/top-nav.tsx`

- [ ] **Step 1: Replace localStorage reads**

Update `lib/store.ts` to export async API functions:

```ts
export async function getCandidates(): Promise<Candidate[]>;
export async function getCandidate(id: string): Promise<Candidate | null>;
export async function saveCandidate(candidate: Candidate): Promise<Candidate>;
```

- [ ] **Step 2: Update dashboard hook**

`useCandidates()` should fetch `/api/candidates`, expose loading/error/refresh, and keep existing table behavior.

- [ ] **Step 3: Update candidate form save**

`CandidateForm` should call `await saveCandidate(candidate)` and navigate to the returned candidate detail page.

- [ ] **Step 4: Add graduation plan field**

Add a required textarea or input labeled `Plan after graduation` in `CandidateForm`, saved to `graduationLocationPlan`.

- [ ] **Step 5: Update table and detail views**

Show current city, hometown, graduation plan, source, and insight status.

- [ ] **Step 6: Add logout**

Top nav should call `POST /api/auth/logout` and navigate to `/login`.

### Task 9: Add Setup Documentation

**Files:**
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Add `.env.example`**

Include all required env vars with safe placeholders.

- [ ] **Step 2: Add README deployment section**

Document:

```txt
1. Create Google Cloud service account
2. Enable Google Sheets API and Drive API
3. Create Google Sheet with Candidates tab
4. Share Sheet and Drive folder with service account email
5. Add env vars locally and in Vercel
6. Deploy to Vercel
7. Print QR for /apply
```

### Task 10: Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run automated checks**

```bash
npm test
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 2: Run local smoke test**

```bash
npm run dev
```

Verify in browser:

```txt
/login rejects bad credentials
/login accepts one configured credential
/apply submits a candidate and resume
/ shows the submitted candidate after login
/candidates/<id> shows insight and resume link
editing a candidate updates the Google Sheet row
```

- [ ] **Step 3: Production smoke test**

Deploy to Vercel and verify:

```txt
candidate QR URL opens on phone
candidate submission creates Sheet row
panel login works on a second device
panel edit updates the same Sheet row
resume Drive link opens for panel users
```
