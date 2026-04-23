# Armenian Historical Books OCR Frontend

Authenticated frontend for uploading Armenian historical books, tracking ingestion jobs, reviewing extracted words with traceable source evidence, curating lexeme entries, and checking candidate forms against imported personal reference sources.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Supabase JS client for browser auth/session handling
- TanStack Query for API calls and caching
- Zod for form validation

## What MVP-3 Adds

- `Reference Sources` at `/references` so reviewers can create personal reference sources and import simple wordlists or reference documents.
- Source detail pages with `.txt`, `.csv`, `.docx`, `.pdf`, and optional `.xlsx` import flows that now start background imports quickly and redirect to tracked progress pages.
- `Reference Matching` at `/reference-matching` so reviewers can start batch matching runs over lexicon groups, lexemes, or both.
- Matching run detail pages with live polling while a run is queued or running.
- Completed matching run detail pages now act as a results workspace with matched/unmatched target rows, filters, pagination, result detail inspection, and direct links back to related lexicon groups or lexemes.
- Backend-driven progress cards for ingestion jobs and reference-matching runs, including current stage labels, user-facing stage messages, progress bars, counters when available, optional event timelines, and completion CTAs when a result resource is available.
- Start-and-track UX for long-running actions:
  - document upload starts quickly, then redirects to `/jobs/[jobId]`
  - ingestion retry starts quickly, then redirects to the new `/jobs/[jobId]`
  - reference import starts quickly, then redirects to `/jobs/[jobId]`
  - reference matching starts quickly, then redirects to `/reference-matching/[runId]`
- Recent background-job visibility on the dashboard and in the sidebar so users can leave and come back later without losing track of queued, running, or failed work.
- A primary `Words` page at `/words` for global word search across the lexicon, imported books, and reference sources.
- Source-first word review on `/documents/[documentId]` and `/references/[sourceId]`, so users can inspect words directly from the source they came from.
- A reusable word detail drawer that keeps source title, page context, lexicon linkage, and reference-match metadata together as a reviewer-facing dossier.
- Reference status filters for both `/lexicon` and `/lexemes`: `All`, `Matched`, and `Unmatched`.
- Reviewer-facing reference summaries on lexicon groups and lexemes, including best-match source, matched form, match type, and match count.
- Per-group and per-lexeme reference-match panels showing exact / normalized / fuzzy evidence, import method quality, and OCR-origin caution without making automatic lexical decisions.

## What MVP-2 Already Added

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
- `Reference sources` are personal imported aids such as wordlists. They help reviewers check whether a discovered form may already be known somewhere else.
- `Reference matches` are informative hints only. They do **not** create lexemes, hide groups, or decide lexical truth automatically.
- `Words` and their source evidence are now the primary reviewer-facing inspection surface.
- `Reference matching runs` remain useful infrastructure and metadata, but they are no longer the main user-facing entry point.
- MVP-3 still does **not** add internet search, word meanings, automatic lemma generation, or automatic lexical decisions.

## Word-First Review

- `/words` is the main cross-source research page. It groups results into:
  - `Lexicon`
  - `Imported Books`
  - `Reference Sources`
- Every word result is meant to stay traceable:
  - source title stays visible
  - page number is shown when the backend provides it
  - context snippets stay attached to the visible result
  - linked lexeme and best reference-match hints stay visible without opening raw IDs
- Opening a word result launches a reusable detail drawer with:
  - source-aware summary metadata
  - context and evidence snippets
  - lexicon presence / linked lexeme information
  - best reference-match metadata
  - direct navigation back to the full source or linked lexeme
- The lightweight `Check in lexicon` summary gives a fast yes/no answer for the current query before deeper review.

## Source-First Review

- Document detail pages now include `Words from this source`, which is meant to be the main review surface for extracted candidate words from a book.
- Reference source detail pages now include `Words from this source`, so reviewers can inspect what was actually imported from that source instead of only seeing import job metadata.
- Source-scoped word tables support reviewer-focused filters such as linked, unlinked, suspicious, ignored, matched, and unmatched where available.
- This keeps the workflow centered on the source and the word evidence rather than on background runs.

## Reviewer-Centric Lexicon Discovery

- `Candidates` is the default queue. It is meant to foreground reviewer-relevant Armenian word-form groups.
- `Suspicious` isolates noisy, mixed-script, or otherwise suspicious groups so they do not drown out normal curation work.
- `Ignored` keeps triaged noise out of the main queue while preserving the raw evidence behind those groups.
- `Linked` provides a clean view of forms that already belong to curated lexemes.
- `Matched / Unmatched` reference filters help reviewers prioritize forms that may need deeper review later.
- Evidence rows use `document title + page number` as the primary reference, with document IDs shown only as secondary metadata.

## Reference Sources And Importing

- Reference sources are user-managed, personal sources. They are not internet lookups and they are not treated as automatic truth.
- Create a source at `/references`, then open its detail page and import either:
  - `.txt`: one entry per line
  - `.csv`: include a `surface_form` or `normalized_form` column
  - `.xlsx`: same column guidance as CSV when the backend supports it
  - `.docx`: the backend extracts text automatically
  - `.pdf`: the backend extracts text automatically, and scanned PDFs may fall back to OCR
- The UI labels imports by method:
  - `TXT`
  - `CSV`
  - `DOCX`
  - `PDF (text extraction)`
  - `PDF (OCR)`
  - `XLSX`
- Import starts return quickly with a background job id instead of keeping the form blocked until parsing finishes.
- After a successful start, the frontend closes the short submit state, shows a success toast, and redirects to the tracked job page.
- The source detail page keeps a `Latest background job` shortcut so users can reopen the tracked import later.
- For best results, use clean TXT or CSV files when possible. DOCX and PDF can still be useful, but scanned PDFs may be noisier.

## How Matching Works

- Matching runs are started manually from `/reference-matching`.
- A run can target:
  - lexicon groups
  - lexemes
  - all supported review entities
- Matching status is shown in prior-run tables and on per-run detail pages.
- Completed run detail pages now expose target-level matched and unmatched results directly.
- The run page can be used as a reviewer workspace with:
  - match-status filters
  - target-type filters
  - target search
  - direct open-target links
  - detailed per-result match inspection
- Starting a run now returns quickly and routes the user straight to the run progress page.
- Lexicon groups and lexemes still surface their own match summaries and deeper inspection views elsewhere in the product.
- Matching runs now act more like supporting infrastructure for word and source review than the main front door of the product.

## Long-Running Progress

- Long-running actions now follow a `start job -> accept quickly -> redirect to tracked progress` model.
- `/jobs/[jobId]` and `/reference-matching/[runId]` show backend-driven progress instead of relying on a generic loading impression.
- The frontend polls active jobs and runs every few seconds while their status is `queued` or `running`.
- Progress copy uses backend-provided stage labels and user-facing stage messages when available.
- If the backend returns counters such as processed pages or compared items, the UI shows them next to the progress bar.
- If the backend exposes event history endpoints, the detail page renders a clean stage timeline with timestamps and any available percentages or counters.
- Queued jobs show intentional queue copy immediately, running jobs show the current stage, completed jobs show `100%` and an `Open result` CTA when the backend returns result-resource metadata, and failed jobs keep the last known progress view visible above the failure guidance.
- Progress pages explicitly tell users they can leave and come back later while processing continues in the background.

## Recent Jobs And Reconnect UX

- The dashboard now includes `Ongoing processing`, `Recently failed jobs`, and `Recent jobs` panels when `GET /api/v1/jobs` is available.
- The sidebar also surfaces compact background-work links for quick reopen access.
- Each recent-job entry shows:
  - job kind
  - stage label
  - status
  - progress percent
  - link to the tracked job page
- This makes it practical to reconnect to slow OCR, import, or matching jobs after navigating away.

## Match Types

- `Exact`: the discovered candidate form matched a reference entry directly.
- `Normalized`: the normalized form matched a normalized reference form.
- `Fuzzy`: the match is approximate and should be treated as a softer reviewer hint than exact or normalized matches.

## OCR-Derived Sources

- Some PDFs are text-based and can be imported with normal text extraction.
- Some PDFs are scanned images and may be imported through OCR instead.
- OCR-derived reference sources can still be useful, but they are noisier than clean TXT / CSV imports.
- The frontend labels OCR-derived sources and OCR-derived matches with caution so reviewers can interpret them appropriately.
- OCR-based reference matches are helpful hints, not guaranteed truth.

## Assistive, Not Automatic

- A reference match does not auto-create a lexeme.
- A reference match does not auto-hide a lexicon group.
- A reference match does not overrule reviewer judgment.
- The reviewer stays in control of curation and merge decisions.

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
- Upload start requests are short-lived. The UI only waits for backend acceptance, not for the full extraction pipeline.
- After a successful upload start, the frontend invalidates document queries, shows a `Document processing started` toast, and routes the user to the related job page.
- The upload flow also seeds the accepted job into the client cache so the job page can render the initial queue/progress state immediately after navigation.

## Failure Recovery

- Failed jobs now show user-safe failure messages instead of raw technical output.
- Job and document detail pages explain what the user can do next with readable next-step guidance.
- If the backend marks a failure as retryable, the UI shows `Retry processing` and starts a new ingestion attempt through `POST /api/v1/jobs/{job_id}/retry`.
- If a failure is not retryable, the UI guides the user to start a new attempt or contact the administrator.
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
- `/documents/[documentId]`: document metadata, pages, extracted text, token occurrences, and source-scoped word review
- `/lexicon`: grouped normalized-form discovery page
- `/lexemes`: curated lexeme list
- `/lexemes/[lexemeId]`: curated lexeme detail and edit page
- `/references`: reference source management
- `/references/[sourceId]`: reference source detail, import page, and source-scoped imported-word review
- `/reference-matching`: start and inspect batch matching runs
- `/reference-matching/[runId]`: matching run detail with polling, stage progress, optional timeline, and matched/unmatched target review workspace
- `/words`: global word search, lexicon check, and drawer-based evidence inspection
- `/jobs/[jobId]`: background job status with polling, stage progress, failure recovery, and result-resource CTA support

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

## How To Test MVP-3

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
13. Open `/references`, create a new source, and verify it appears in the source list.
14. Open the new source detail page and import a supported reference file such as `.txt`, `.csv`, `.docx`, `.pdf`, or `.xlsx`.
15. Verify the import UI shows rows read, imported, skipped, import method, and warning text when present.
16. If you import a scanned PDF fixture, confirm the source detail page shows `PDF (OCR)` metadata plus the calm OCR warning banner.
17. Verify the source detail page refreshes with latest import metadata, including last imported time and import warning when present.
18. Open `/reference-matching`, start a new matching run, and confirm the UI routes to the run detail page.
19. Verify queued / running runs poll until completion or failure and show a current stage label, user-facing stage message, progress bar, and counters when the backend provides them.
20. Return to `/lexicon` and confirm groups can be filtered by `Matched` / `Unmatched`, and that `View matches` opens a reference-match panel for a selected group.
21. If the backend returns OCR-derived match metadata, confirm the match panel shows `OCR source` badges and any source warning text.
22. Open `/lexemes`, confirm lexemes can be filtered by `Matched` / `Unmatched`, and open any lexeme detail page.
23. Verify the lexeme detail page shows a reference summary and that `View reference matches` opens the full match panel.
24. Open `/documents/[documentId]` and confirm the `Words from this source` section shows extracted word candidates with filters, pagination, and a working detail drawer.
25. Open `/references/[sourceId]` and confirm the source page shows imported word entries with detail drawer access and linked-lexeme / match metadata when available.
26. Open `/words`, search for a known word, and confirm results are grouped into `Lexicon`, `Imported Books`, and `Reference Sources`.
27. From `/words`, open `View details` and confirm the drawer shows source title, snippet, lexicon info, and reference-match info without centering the UI on raw IDs.
28. Recheck `/dashboard`, `/documents`, `/documents/[documentId]`, and `/jobs/[jobId]` to confirm MVP-1 and MVP-2 flows still work.

## How To Test Failure Recovery

1. Upload a document that the backend will fail deliberately or use a backend fixture that returns a failed ingestion job.
2. Open `/jobs/[jobId]` for that failed job and verify the page still shows the last known stage, progress bar, and any available timeline entries above the friendly failure message.
3. If `can_retry = true`, click `Retry processing` and confirm the button enters a loading state, a success toast appears, and the UI routes to the new job page.
4. If `can_retry = false`, confirm the job page does not show a retry button and instead advises re-uploading the document or contacting the administrator.
5. Open `/documents/[documentId]` for the same document and verify the failure guidance is visible near the top of the page.
6. Open `/documents` and confirm failed rows show a clear failed badge, helper text, and a `View issue` action.
