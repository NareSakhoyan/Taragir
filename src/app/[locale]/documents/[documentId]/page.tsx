"use client";

import Link from "next/link";
import { FileStack } from "lucide-react";
import { useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { OccurrencesTable } from "@/components/documents/occurrences-table";
import { PageList } from "@/components/documents/page-list";
import { PageTextViewer } from "@/components/documents/page-text-viewer";
import { JobErrorCard } from "@/components/jobs/job-error-card";
import { JobProgressCard } from "@/components/jobs/job-progress-card";
import { AppShell } from "@/components/layout/app-shell";
import { HeaderActionLink, HeaderActions } from "@/components/layout/header-actions";
import { MorphologyRunAction } from "@/components/morphology/morphology-run-action";
import { MorphologySettingsCard } from "@/components/morphology/morphology-settings-card";
import { MorphologySummaryCard } from "@/components/morphology/morphology-summary-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocument } from "@/lib/hooks/use-document";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { useDocumentDiscoverySummary } from "@/lib/hooks/use-document-discovery";
import { useDocumentOccurrences } from "@/lib/hooks/use-document-occurrences";
import { useDocumentMorphologySummary } from "@/lib/hooks/use-morphology";
import { useDocumentPages } from "@/lib/hooks/use-document-pages";
import { useJobProgress, useResumeJobStart, useRetryJobStart } from "@/lib/hooks/use-job";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import {
  useDocumentTrustedExternalLookupSummary,
  useStartDocumentTrustedExternalLookupRun,
} from "@/lib/hooks/use-document-trusted-external";
import { useDocumentWordCandidates } from "@/lib/hooks/use-words";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getRememberedDocumentJobLink } from "@/lib/supabase/session";
import type { WordCandidateFilter, WordEvidenceSummary } from "@/lib/types/api";
import { JOB_ACTIVE_STATUSES, OCCURRENCES_PAGE_SIZE, ROUTES, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { formatBytes, formatDate, formatNumber, titleFromDocument } from "@/lib/utils/format";
import { isMorphologyJobKind, isTrustedExternalLookupJobKind } from "@/lib/utils/jobs";
import { hasMorphologySupport } from "@/lib/utils/morphology";
import { SourceWordCandidatesTable } from "@/components/words/source-word-candidates-table";
import { WordDetailDrawer } from "@/components/words/word-detail-drawer";
import { Input } from "@/components/ui/input";
import {
  buildPathWithDocumentPage,
  parseDocumentEvidencePage,
} from "@/lib/utils/evidence-links";

export default function DocumentDetailPage() {
  const params = useParams<{ locale: string; documentId: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { handleAcceptedStart, handleStartError } = useStartAndRedirect();
  const { href, locale, messages } = useI18n();
  const { isAdmin } = useAuthSession();
  const documentId = params.documentId;
  const requestedPageNumber = parseDocumentEvidencePage(searchParams.get("page"));
  const documentQuery = useDocument(documentId);
  const retryMutation = useRetryJobStart();
  const resumeMutation = useResumeJobStart();
  const [adminTab, setAdminTab] = useState<"word-check" | "occurrences">("word-check");
  const occurrencesEnabled = isAdmin && adminTab === "occurrences";
  const legacyWordCheckEnabled = isAdmin && adminTab === "word-check";
  const [morphologyDetailsEnabled, setMorphologyDetailsEnabled] = useState(false);
  const morphologySummaryEnabled = isAdmin && morphologyDetailsEnabled;
  const jobProgressEnabled = true;
  const trustedExternalSummaryEnabled = legacyWordCheckEnabled;
  const pagesQuery = useDocumentPages(documentId, { limit: 20, offset: 0 }, documentQuery.isSuccess);
  const discoverySummaryQuery = useDocumentDiscoverySummary(documentId, documentQuery.isSuccess && !isAdmin);

  const [occurrenceFilters, setOccurrenceFilters] = useState({
    pageNumber: "",
    normalizedToken: "",
  });
  const [occurrenceOffset, setOccurrenceOffset] = useState(0);
  const [wordFilter, setWordFilter] = useState<WordCandidateFilter>("all");
  const [wordDraftSearch, setWordDraftSearch] = useState("");
  const [wordSearch, setWordSearch] = useState("");
  const [wordPage, setWordPage] = useState(1);
  const [wordPageSize, setWordPageSize] = useState<number>(TABLE_PAGE_SIZE_OPTIONS[1] ?? 20);
  const [selectedWord, setSelectedWord] = useState<WordEvidenceSummary | null>(null);

  const occurrencesQuery = useDocumentOccurrences(documentId, {
    page_number: occurrenceFilters.pageNumber ? Number(occurrenceFilters.pageNumber) : undefined,
    normalized_token: occurrenceFilters.normalizedToken || undefined,
    limit: OCCURRENCES_PAGE_SIZE,
    offset: occurrenceOffset,
  }, documentQuery.isSuccess && occurrencesEnabled);
  const trustedExternalSummaryQuery = useDocumentTrustedExternalLookupSummary(
    documentId,
    documentQuery.isSuccess && trustedExternalSummaryEnabled,
  );
  const startTrustedExternalLookupMutation = useStartDocumentTrustedExternalLookupRun(documentId);
  const wordCandidatesQuery = useDocumentWordCandidates(
    documentId,
    {
      filter: wordFilter,
      search: wordSearch || undefined,
      limit: wordPageSize,
      offset: (wordPage - 1) * wordPageSize,
    },
    documentQuery.isSuccess && legacyWordCheckEnabled,
  );
  const documentMorphologyQuery = useDocumentMorphologySummary(
    documentId,
    documentQuery.isSuccess && morphologySummaryEnabled,
  );
  const isOccurrencesTransitioning = occurrencesQuery.isFetching && occurrencesQuery.isPlaceholderData;
  const isWordCandidatesTransitioning =
    wordCandidatesQuery.isFetching && wordCandidatesQuery.isPlaceholderData;
  const morphologySummary =
    documentMorphologyQuery.data ?? documentQuery.data?.morphology_summary ?? null;
  const documentMorphologySettings = documentQuery.data?.morphology_settings ?? null;
  const canRunMorphology =
    isAdmin &&
    (hasMorphologySupport(morphologySummary) ||
      documentMorphologySettings?.language_stage === "classical" ||
      documentMorphologySettings?.morphology_profile === "xcl_pie");

  const pages = pagesQuery.data?.items ?? [];
  const selectedPage =
    (requestedPageNumber != null
      ? pages.find((page) => page.page_number === requestedPageNumber) ?? null
      : null) ?? pages[0] ?? null;
  const explicitJobId = searchParams.get("jobId");
  const rememberedJobId = getRememberedDocumentJobLink(documentId);
  const documentHasActiveStatus = Boolean(
    documentQuery.data?.status && ["queued", "processing"].includes(documentQuery.data.status),
  );
  const knownJobId = explicitJobId ?? (documentHasActiveStatus ? rememberedJobId : null);
  const jobProgress = useJobProgress(knownJobId ?? "", Boolean(knownJobId) && jobProgressEnabled);
  const relatedJobQuery = jobProgress.jobQuery;
  const jobEventsQuery = jobProgress.eventsQuery;
  const showMorphologyJobProgress =
    Boolean(knownJobId) && isMorphologyJobKind(relatedJobQuery.data?.job_kind);
  const showTrustedExternalJobProgress =
    Boolean(knownJobId) && isTrustedExternalLookupJobKind(relatedJobQuery.data?.job_kind);
  const showJobProgressCard = Boolean(
    knownJobId &&
      relatedJobQuery.data &&
      (showMorphologyJobProgress || showTrustedExternalJobProgress || JOB_ACTIVE_STATUSES.has(relatedJobQuery.data.status)),
  );
  const trustedExternalSummary = trustedExternalSummaryQuery.data;
  const isTrustedExternalLookupRunning =
    startTrustedExternalLookupMutation.isPending ||
    Boolean(
      showTrustedExternalJobProgress &&
        relatedJobQuery.data?.status &&
        JOB_ACTIVE_STATUSES.has(relatedJobQuery.data.status),
    );
  const trustedExternalJob = showTrustedExternalJobProgress ? relatedJobQuery.data : null;
  const trustedExternalProcessed = trustedExternalJob?.items_processed ?? null;
  const trustedExternalTotal = trustedExternalJob?.items_total ?? trustedExternalSummary?.total_forms ?? null;
  const trustedExternalProgressPercent = trustedExternalJob?.progress_percent ?? null;
  const trustedExternalProgressDetail =
    isTrustedExternalLookupRunning &&
    trustedExternalProcessed != null &&
    trustedExternalTotal != null &&
    trustedExternalTotal > 0
      ? messages.words.nayiri.runningProgress
          .replace("{processed}", formatNumber(trustedExternalProcessed, locale))
          .replace("{total}", formatNumber(trustedExternalTotal, locale))
          .replace(
            "{percent}",
            formatNumber(
              trustedExternalProgressPercent ??
                Math.round((trustedExternalProcessed / trustedExternalTotal) * 100),
              locale,
            ),
          )
      : null;
  const trustedExternalButtonText = trustedExternalProgressDetail
    ? messages.words.nayiri.runningShort
    : isTrustedExternalLookupRunning
      ? messages.words.nayiri.running
      : messages.words.nayiri.runCheck;
  const discoverySummary = discoverySummaryQuery.data;
  const discoveryResolution = discoverySummary?.by_resolution_status ?? {};
  const reviewQueueCount = discoverySummary?.visible_candidates ?? 0;
  const possibleOcrNoiseCount = discoveryResolution.possible_ocr_noise ?? 0;
  const conflictingSourcesCount = discoveryResolution.conflicting_sources ?? 0;
  const resolvedKnownCount =
    (discoveryResolution.resolved_known ?? 0) +
    (discoveryResolution.resolved_by_dictionary ?? 0) +
    (discoveryResolution.resolved_by_lemma ?? 0);

  const failureJob =
    (relatedJobQuery.data?.status === "failed" && !isMorphologyJobKind(relatedJobQuery.data?.job_kind)) ||
    documentQuery.data?.status === "failed"
      ? relatedJobQuery.data ?? null
      : null;
  const recoverableJob =
    failureJob ?? (relatedJobQuery.data?.can_resume ? relatedJobQuery.data : null);

  async function handleRetry() {
    if (!failureJob) {
      return;
    }

    try {
      const result = await retryMutation.mutateAsync(failureJob.id);
      handleAcceptedStart({
        title: messages.job.retryStartedTitle,
        description: result.message || messages.job.retryStartedDescription,
        path: `${ROUTES.jobs}/${result.job.id}`,
      });
    } catch (error) {
      handleStartError(messages.job.retryFailedTitle, error);
    }
  }

  async function handleResume() {
    if (!recoverableJob) {
      return;
    }

    try {
      const result = await resumeMutation.mutateAsync(recoverableJob.id);
      handleAcceptedStart({
        title: messages.job.resumeStartedTitle,
        description: result.message || messages.job.resumeStartedDescription,
        path: `${ROUTES.jobs}/${result.job.id}`,
      });
    } catch (error) {
      handleStartError(messages.job.resumeFailedTitle, error);
    }
  }

  function handleSelectPage(pageNumber: number) {
    window.history.replaceState(
      null,
      "",
      buildPathWithDocumentPage(pathname, searchParams, pageNumber),
    );
  }

  return (
    <AppShell
      title={documentQuery.data ? titleFromDocument(documentQuery.data) : messages.documentDetail.fallbackTitle}
      description={messages.documentDetail.description}
      actions={
        <HeaderActions>
          <HeaderActionLink href={href(`${ROUTES.documents}/${documentId}/discovery`)}>
            {messages.documentDiscovery.title}
          </HeaderActionLink>
          {canRunMorphology ? (
            <MorphologyRunAction
              enabled={canRunMorphology}
              sourceId={documentId}
              sourceType="document"
              summary={morphologySummary}
            />
          ) : null}
          {knownJobId ? (
            <HeaderActionLink direction="forward" href={href(`${ROUTES.jobs}/${knownJobId}`)}>
              {messages.documentDetail.relatedJob}
            </HeaderActionLink>
          ) : null}
        </HeaderActions>
      }
    >
        <div className="flex flex-col gap-0">
          {documentQuery.isLoading ? (
            <Skeleton className="h-56" />
          ) : documentQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm text-destructive shadow-sm">
              {documentQuery.error.message}
            </div>
          ) : documentQuery.data ? (
            <section className="border-b border-border/80 pb-10">
              <h2 className="font-serif text-2xl font-semibold">{titleFromDocument(documentQuery.data)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{documentQuery.data.original_filename}</p>
              <div className="mt-8 grid gap-8 border-t border-border/70 pt-8 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.documentDetail.metadata.status}</p>
                  <div className="mt-2">
                    <DocumentStatusBadge status={documentQuery.data.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{messages.documentDetail.metadata.pageCount}</p>
                  <p className="mt-2 font-semibold">{formatNumber(documentQuery.data.page_count ?? 0, locale)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{messages.documentDetail.metadata.fileSize}</p>
                  <p className="mt-2 font-semibold">{formatBytes(documentQuery.data.file_size_bytes, locale)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{messages.documentDetail.metadata.created}</p>
                  <p className="mt-2 font-semibold">{formatDate(documentQuery.data.created_at, locale)}</p>
                </div>
              </div>

              {documentQuery.data.status === "failed" || failureJob ? (
                <div className="mt-8">
                  <JobErrorCard
                    canResume={failureJob?.can_resume}
                    canRetry={failureJob?.can_retry}
                    errorMessageUser={failureJob?.error_message_user}
                    isResuming={resumeMutation.isPending}
                    isRetrying={retryMutation.isPending}
                    lastRetriedAt={failureJob?.last_retried_at}
                    nextSteps={failureJob?.next_steps}
                    onResume={recoverableJob?.can_resume ? handleResume : undefined}
                    onRetry={failureJob?.can_retry ? handleRetry : undefined}
                    resumeFromPage={failureJob?.resume_from_page}
                    retryCount={failureJob?.retry_count}
                  />
                </div>
              ) : null}

            </section>
          ) : null}

          <section className="border-b border-border/80 py-10">
            <div className="space-y-6">
              {isAdmin ? (
                <>
                  <MorphologySettingsCard
                    key={`${documentId}:${documentMorphologySettings?.language_stage ?? ""}:${documentMorphologySettings?.morphology_profile ?? ""}`}
                    settings={documentMorphologySettings}
                    sourceId={documentId}
                    sourceType="document"
                    summary={morphologySummary}
                  />
                  {morphologySummary ? (
                    <MorphologySummaryCard
                      description={messages.documentDetail.morphologyDescription}
                      summary={morphologySummary}
                      title={messages.documentDetail.morphologyTitle}
                    />
                  ) : (
                    <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-5 text-sm text-muted-foreground shadow-sm">
                      <p>Morphology evidence is loaded on demand to keep the document page fast.</p>
                      <Button
                        className="mt-3"
                        disabled={documentMorphologyQuery.isFetching}
                        onClick={() => setMorphologyDetailsEnabled(true)}
                        type="button"
                        variant="outline"
                      >
                        {documentMorphologyQuery.isFetching ? "Loading morphology summary..." : "Load morphology summary"}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <section className="rounded-md border border-border/80 bg-muted/10 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">Discovery workspace</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review research candidates, source contexts, and decisions for this document.
                      </p>
                    </div>
                    <Link href={href(`${ROUTES.documents}/${documentId}/discovery`)}>
                      <Button>{messages.documentDiscovery.title}</Button>
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-5">
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">In review queue</p>
                      <p className="mt-1 text-2xl font-semibold">{formatNumber(reviewQueueCount, locale)}</p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Possible OCR noise</p>
                      <p className="mt-1 text-2xl font-semibold">{formatNumber(possibleOcrNoiseCount, locale)}</p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Conflicting evidence</p>
                      <p className="mt-1 text-2xl font-semibold">{formatNumber(conflictingSourcesCount, locale)}</p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Reviewed</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {formatNumber(discoverySummary?.reviewed_candidates ?? 0, locale)}
                      </p>
                    </div>
                    <div className="rounded-md border bg-background p-3">
                      <p className="text-xs text-muted-foreground">Resolved / known</p>
                      <p className="mt-1 text-2xl font-semibold">{formatNumber(resolvedKnownCount, locale)}</p>
                    </div>
                  </div>
                </section>
              )}
              {showJobProgressCard && relatedJobQuery.data ? (
                <JobProgressCard
                  events={jobEventsQuery.data ?? []}
                  isResuming={resumeMutation.isPending}
                  isRetrying={retryMutation.isPending}
                  job={relatedJobQuery.data}
                  onResume={recoverableJob?.can_resume ? handleResume : undefined}
                  onRetry={failureJob?.can_retry ? handleRetry : undefined}
                  showCompletedResult={false}
                />
              ) : null}
            </div>
          </section>

          <section className="border-b border-border/80 py-10">
            <div className="grid gap-0 py-2 xl:grid-cols-[22rem_minmax(0,1fr)] xl:divide-x xl:divide-border/70">
              <div className="min-w-0 pb-10 xl:pb-0 xl:pr-10">
                <header className="mb-6 border-b border-border/70 pb-6">
                  <h3 className="text-lg font-semibold tracking-tight">{messages.documentDetail.pagesTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{messages.documentDetail.pagesDescription}</p>
                </header>
                {pagesQuery.isLoading ? (
                  <Skeleton className="h-[24rem]" />
                ) : (
                  <PageList
                    pages={pages}
                    selectedPageId={selectedPage?.id ?? null}
                    onSelectPage={(page) => handleSelectPage(page.page_number)}
                  />
                )}
              </div>

              <div className="min-w-0 border-t border-border/70 pt-10 xl:border-t-0 xl:pl-10 xl:pt-0">
                <PageTextViewer page={selectedPage} />
              </div>
            </div>
            {!pagesQuery.isLoading && !pages.length ? (
              <div className="mt-10 flex items-start gap-3 rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-5 text-sm text-muted-foreground shadow-sm">
                <FileStack className="mt-0.5 h-4 w-4 shrink-0" />
                {messages.documentDetail.pagesPending}
              </div>
            ) : null}
          </section>

          {isAdmin ? (
            <section className="border-b border-border/80 py-10">
              <Tabs
                onValueChange={(value) => setAdminTab(value as "word-check" | "occurrences")}
                value={adminTab}
              >
                <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/60 p-2">
                  <TabsTrigger value="word-check">{messages.documentDetail.tabs.wordCheck}</TabsTrigger>
                  <TabsTrigger value="occurrences">{messages.documentDetail.tabs.occurrences}</TabsTrigger>
                </TabsList>

                <TabsContent value="word-check">
                <div className="space-y-1 border-b border-border/70 pb-5">
                  <h3 className="text-lg font-semibold tracking-tight">{messages.documentDetail.wordsTitle}</h3>
                  <p className="text-sm text-muted-foreground">{messages.documentDetail.wordsDescription}</p>
                </div>

                <div className="mt-6 rounded-md border border-border/80 bg-muted/10 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold tracking-tight">{messages.words.nayiri.title}</h4>
                  <p className="text-sm text-muted-foreground">{messages.words.nayiri.description}</p>
                </div>
                <Button
                  disabled={
                    isTrustedExternalLookupRunning ||
                    trustedExternalSummary?.unavailable_count === trustedExternalSummary?.total_forms
                  }
                  onClick={() => startTrustedExternalLookupMutation.mutate()}
                  type="button"
                  variant="default"
                >
                  {trustedExternalButtonText}
                </Button>
              </div>

              {isTrustedExternalLookupRunning ? (
                <div className="mt-4 rounded-md border border-sky-200/80 bg-sky-50/70 px-4 py-3 text-sm text-sky-950">
                  <p className="font-medium">
                    {trustedExternalProgressDetail ?? messages.words.nayiri.runningDescription}
                  </p>
                  <p className="mt-1 text-sky-900/80">
                    {trustedExternalJob?.current_stage_label
                      ? messages.words.nayiri.runningStage.replace("{stage}", trustedExternalJob.current_stage_label)
                      : messages.words.nayiri.runningSlowHint}
                  </p>
                  {trustedExternalJob?.stage_message_user ? (
                    <p className="mt-1 text-sky-900/80">{trustedExternalJob.stage_message_user}</p>
                  ) : null}
                </div>
              ) : null}

              {trustedExternalSummaryQuery.isLoading ? <Skeleton className="mt-4 h-16" /> : null}

              {trustedExternalSummary ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border border-sky-200/80 bg-sky-50/70 px-4 py-3">
                    <p className="text-sm text-muted-foreground">{messages.words.nayiri.foundInNayiri}</p>
                    <p className="mt-1 text-2xl font-semibold text-sky-900">
                      {formatNumber(trustedExternalSummary.found_count, locale)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border/80 bg-background px-4 py-3">
                    <p className="text-sm text-muted-foreground">{messages.words.nayiri.notFound}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatNumber(trustedExternalSummary.not_found_count, locale)}
                    </p>
                  </div>
                  <div className="rounded-md border border-dashed border-border/80 bg-background px-4 py-3">
                    <p className="text-sm text-muted-foreground">{messages.words.nayiri.unchecked}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatNumber(trustedExternalSummary.unchecked_count, locale)}
                    </p>
                  </div>
                  <div className="rounded-md border border-amber-200/80 bg-amber-50/60 px-4 py-3">
                    <p className="text-sm text-muted-foreground">{messages.words.nayiri.unavailable}</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-900">
                      {formatNumber(trustedExternalSummary.unavailable_count, locale)}
                    </p>
                  </div>
                </div>
              ) : null}

              {trustedExternalSummary && trustedExternalSummary.found_count > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => setWordFilter("matched")} type="button" variant="outline">
                    {messages.words.filters.matched}
                  </Button>
                </div>
              ) : null}

              {trustedExternalSummary && trustedExternalSummary.unchecked_count > 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {messages.words.nayiri.calloutUnchecked.replace(
                    "{count}",
                    formatNumber(trustedExternalSummary.unchecked_count, locale),
                  )}
                </p>
              ) : null}

              {trustedExternalSummary &&
              trustedExternalSummary.unavailable_count > 0 &&
              trustedExternalSummary.found_count === 0 ? (
                <p className="mt-2 text-sm text-amber-800">{messages.words.nayiri.calloutUnavailable}</p>
              ) : null}
            </div>

                <div className="mt-8 grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)_auto]">
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  setWordFilter(event.target.value as WordCandidateFilter);
                  setWordPage(1);
                }}
                value={wordFilter}
              >
                <option value="all">{messages.words.filters.all}</option>
                <option value="unlinked">{messages.words.filters.unlinked}</option>
                <option value="linked">{messages.words.filters.linked}</option>
                <option value="suspicious">{messages.words.filters.suspicious}</option>
                <option value="ignored">{messages.words.filters.ignored}</option>
                <option value="matched">{messages.words.filters.matched}</option>
                <option value="unmatched">{messages.words.filters.unmatched}</option>
              </select>

              <form
                className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  setWordPage(1);
                  setWordSearch(wordDraftSearch.trim());
                }}
              >
                <Input
                  onChange={(event) => setWordDraftSearch(event.target.value)}
                  placeholder={messages.documentDetail.wordsSearchPlaceholder}
                  value={wordDraftSearch}
                />
                <Button type="submit" variant="outline">
                  {messages.common.search}
                </Button>
              </form>
            </div>

                <div className="mt-6">
              <SourceWordCandidatesTable
                currentPage={wordPage}
                data={wordCandidatesQuery.data}
                emptyDescription={messages.documentDetail.wordsEmptyDescription}
                emptyTitle={messages.documentDetail.wordsEmptyTitle}
                errorMessage={wordCandidatesQuery.error?.message}
                isFetching={isWordCandidatesTransitioning}
                isLoading={wordCandidatesQuery.isLoading || isWordCandidatesTransitioning}
                onPageChange={setWordPage}
                onPageSizeChange={(nextPageSize) => {
                  setWordPageSize(nextPageSize);
                  setWordPage(1);
                }}
                onViewDetails={setSelectedWord}
                pageSize={wordPageSize}
                variant="document"
              />
            </div>
              </TabsContent>

              <TabsContent value="occurrences">
                <OccurrencesTable
                  data={occurrencesQuery.data}
                  errorMessage={occurrencesQuery.error?.message}
                  filters={occurrenceFilters}
                  isFetching={isOccurrencesTransitioning}
                  isLoading={occurrencesQuery.isLoading || isOccurrencesTransitioning}
                  onApplyFilters={(filters) => {
                    setOccurrenceFilters(filters);
                    setOccurrenceOffset(0);
                  }}
                  onPageChange={setOccurrenceOffset}
                  onResetFilters={() => {
                    setOccurrenceFilters({ pageNumber: "", normalizedToken: "" });
                    setOccurrenceOffset(0);
                  }}
                />
              </TabsContent>
              </Tabs>
            </section>
          ) : null}

          <WordDetailDrawer
            onOpenChange={(open) => {
              if (!open) {
                setSelectedWord(null);
              }
            }}
            open={Boolean(selectedWord)}
            word={selectedWord}
          />
        </div>
    </AppShell>
  );
}
