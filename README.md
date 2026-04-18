# Armenian Historical Books OCR Frontend

Authenticated frontend for uploading Armenian historical books, tracking ingestion jobs, reading extracted page text, browsing token occurrences, and curating lexeme entries from grouped normalized forms.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Supabase JS client for browser auth/session handling
- TanStack Query for API calls and caching
- Zod for form validation

## What MVP-2 Adds

- `Lexicon Discovery` at `/lexicon` as a reviewer-first workspace for grouped normalized-form review units built from uploaded-book occurrences.
- Candidate, Linked, Suspicious, Ignored, and All views so reviewers can focus on curation instead of manually processing every extracted group.
- Bulk ignore / unignore actions so noisy groups leave the default queue without deleting the underlying evidence.
- Group detail inspection with occurrence evidence, document titles, page numbers, snippets, and linked lexeme status.
- Manual curation flows to:
  - create a new lexeme from one or more grouped normalized forms
  - merge one or more grouped normalized forms into an existing lexeme
- `Lexemes` list and lexeme detail pages for curated entries.
- Editable lexeme metadata: canonical form, notes, and status.
- Recovery improvements for failed ingestion jobs, including user-safe failure messages, next-step guidance, and retry actions when the backend allows a new attempt.

## Core Product Model

- `Occurrences` are raw evidence rows produced by extraction.
- `Grouped normalized forms` are discovery and review units created by grouping occurrences.
- `Lexemes` are curated entities created explicitly by the user.
- `Ignored groups` are hidden from the default Candidates queue, but their raw occurrences are still preserved.
- MVP-2 does **not** add dictionary matching, word meanings, automatic lemma generation, or internet enrichment.

## Reviewer-Centric Lexicon Discovery

- `Candidates` is the default queue. It is meant to foreground reviewer-relevant Armenian word-form groups.
- `Suspicious` isolates noisy, mixed-script, or otherwise suspicious groups so they do not drown out normal curation work.
- `Ignored` keeps triaged noise out of the main queue while preserving the raw evidence behind those groups.
- `Linked` provides a clean view of forms that already belong to curated lexemes.
- Evidence rows use `document title + page number` as the primary reference, with document IDs shown only as secondary metadata.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env.local
```

3. Fill in the values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## How Login Works

- The `/login` page signs the user in with Supabase Auth using email/password.
- The browser session is managed by Supabase JS.
- The app mirrors the session into cookies so Next middleware can protect authenticated routes.
- If a user is unauthenticated, `/dashboard`, `/documents`, `/documents/*`, and `/jobs/*` redirect to `/login`.
- If a user is already authenticated, visiting `/login` redirects to `/dashboard`.

## How Upload Works

- Uploads go to the FastAPI backend endpoint `POST /api/v1/documents/upload`.
- The frontend sends a `FormData` payload with the selected file and optional title.
- Files are not uploaded directly to Supabase Storage in this MVP.
- After a successful upload, the frontend invalidates document queries, shows a success toast, and routes the user to the related job page.

## Failure Recovery

- Failed jobs now show user-safe failure messages instead of raw technical output.
- Job and document detail pages explain what the user can do next with readable next-step guidance.
- If the backend marks a failure as retryable, the UI shows `Retry processing` and starts a new ingestion attempt through `POST /api/v1/jobs/{job_id}/retry`.
- If a failure is not retryable, the UI guides the user to re-upload the document or contact the administrator.
- Failed document rows in the documents list surface a compact `View issue` action so recovery is easier to find.

## Backend Communication

- `NEXT_PUBLIC_API_BASE_URL` defines the backend base URL.
- Every API request reads the current Supabase access token from the browser session and sends:

```http
Authorization: Bearer <supabase_access_token>
```

- If the backend returns `401`, the frontend attempts a session refresh once. If refresh fails, it signs the user out and redirects to `/login`.

## Main Routes

- `/login`: Google sign-in
- `/dashboard`: summary cards, recent documents, upload form
- `/documents`: full document list
- `/documents/[documentId]`: document metadata, pages, extracted text, token occurrences
- `/lexicon`: grouped normalized-form discovery page
- `/lexemes`: curated lexeme list
- `/lexemes/[lexemeId]`: curated lexeme detail and edit page
- `/jobs/[jobId]`: ingestion job status with polling

## Manual Merge Workflow

1. Open `/lexicon`.
2. Start in `Candidates`, then switch to `Suspicious`, `Ignored`, `Linked`, or `All` as needed.
3. Search or filter grouped normalized forms.
4. Ignore noisy groups when they do not belong in the active review queue.
5. Select one or more groups.
6. Choose either:
   - `Create lexeme` to create a brand-new curated entry
   - `Merge into existing lexeme` to attach the selected groups to an existing curated entry
7. Inspect the linked badge on discovery groups to confirm their lexeme association.

## How Ignore / Unignore Works

- `Ignore` moves selected groups out of the default Candidates queue.
- `Unignore` restores selected groups from the Ignored view back into the reviewer workflow.
- Ignoring a group does not delete any raw occurrences or evidence rows.
- The UI still treats grouped forms as review units and lexemes as explicit user-curated entities.

## How To Test MVP-2

1. Sign in and upload at least one book through the existing dashboard/documents flow.
2. Wait until the backend has produced pages and occurrences.
3. Open `/lexicon` and verify it defaults to the `Candidates` view.
4. Confirm suspicious or noisy groups are reachable in `Suspicious`, not mixed into the default queue.
5. Select one or more groups in `Candidates`, `Suspicious`, or `All` and use `Ignore`.
6. Open `Ignored`, verify those groups appear there, then select them and use `Unignore`.
7. Open `View details` on any row and verify document title, page number, and snippet evidence render clearly.
8. Select one or more groups and create a new lexeme.
9. Return to `/lexicon` and confirm the selected groups now show a linked lexeme badge and appear in `Linked`.
10. Repeat the `/lexicon` flow with `Merge into existing lexeme` and verify the target lexeme updates.
11. Open `/lexemes`, search for the created lexeme, and open its detail page.
12. Edit canonical form, notes, or status and confirm the detail page refreshes.
13. Recheck `/dashboard`, `/documents`, `/documents/[documentId]`, and `/jobs/[jobId]` to confirm MVP-1 flows still work.

## How To Test Failure Recovery

1. Upload a document that the backend will fail deliberately or use a backend fixture that returns a failed ingestion job.
2. Open `/jobs/[jobId]` for that failed job and verify the page shows a friendly failure message, `What you can do next`, and retry metadata when available.
3. If `can_retry = true`, click `Retry processing` and confirm the button enters a loading state, a success toast appears, and the UI routes to the new job page.
4. If `can_retry = false`, confirm the job page does not show a retry button and instead advises re-uploading the document or contacting the administrator.
5. Open `/documents/[documentId]` for the same document and verify the failure guidance is visible near the top of the page.
6. Open `/documents` and confirm failed rows show a clear failed badge, helper text, and a `View issue` action.
