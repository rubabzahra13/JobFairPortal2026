# VECTOR Job Fair Portal

Next.js portal for FAST Islamabad job fair candidate intake and hiring panel evaluation.

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Next. Candidate intake is at `/apply`; the panel is at `/login`.

## Environment

Copy `.env.example` to `.env.local` and fill:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: `client_email` from the Google service account JSON key.
- `GOOGLE_PRIVATE_KEY`: `private_key` from the same JSON key. Keep newline escapes as `\n`.
- `GOOGLE_SHEET_ID`: ID from the Google Sheet URL.
- `GOOGLE_DRIVE_FOLDER_ID`: ID from the Drive folder URL.
- `BACKEND_ORIGIN`: set on Vercel to the EC2 backend origin, for example `http://32.196.238.144`.
- `BACKEND_PUBLIC_URL`: set on EC2 to the public backend origin for local resume fallback links.
- `PANEL_CREDENTIALS`: comma-separated `username:password:Display Name` entries.
- `PANEL_SESSION_SECRET`: generate with `openssl rand -base64 32`.
- `GEMINI_API_KEY`: key from Google AI Studio.
- `GEMINI_MODEL`: defaults to `gemini-2.5-flash`.
- `NEXT_PUBLIC_APP_URL`: local or deployed base URL.

## Google Setup

1. Create or select a Google Cloud project.
2. Enable Google Sheets API and Google Drive API.
3. Create a service account and JSON key.
4. Create the Sheet and share it with the service account email as Editor.
5. Use the Sheet ID in `GOOGLE_SHEET_ID`.
6. For Google Drive resume upload, use a Google Shared Drive folder and share it with the service account as Content manager or Editor. Normal My Drive folders can reject service account uploads because service accounts have no storage quota.
7. Use the folder ID in `GOOGLE_DRIVE_FOLDER_ID`.

The app creates the `Candidates` Sheet tab and headers automatically.
If Drive upload fails, the EC2 backend saves the resume under `/uploads/resumes/` and writes that public backend URL to the Sheet.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Deploy

Deploy this repo to Vercel and add the same environment variables in Project Settings. The Next route handlers under `/app/api/*` are the backend.
