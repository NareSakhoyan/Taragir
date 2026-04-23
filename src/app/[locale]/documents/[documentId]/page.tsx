"use client";

import Link from "next/link";
import { ArrowRight, FileStack } from "lucide-react";
import { useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { OccurrencesTable } from "@/components/documents/occurrences-table";
import { PageList } from "@/components/documents/page-list";
import { PageTextViewer } from "@/components/documents/page-text-viewer";
import { JobErrorCard } from "@/components/jobs/job-error-card";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocument } from "@/lib/hooks/use-document";
import { useDocumentOccurrences } from "@/lib/hooks/use-document-occurrences";
import { useDocumentPages } from "@/lib/hooks/use-document-pages";
import { useJob, useRetryJobStart } from "@/lib/hooks/use-job";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useDocumentWordCandidates } from "@/lib/hooks/use-words";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getRememberedDocumentJobLink } from "@/lib/supabase/session";
import type { WordCandidateFilter, WordEvidenceSummary } from "@/lib/types/api";
import { OCCURRENCES_PAGE_SIZE, ROUTES, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { formatBytes, formatDate, formatNumber, titleFromDocument } from "@/lib/utils/format";
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
  const documentId = params.documentId;
  const documentQuery = useDocument(documentId);
  const pagesQuery = useDocumentPages(documentId);
  const retryMutation = useRetryJobStart();

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
  });
  const wordCandidatesQuery = useDocumentWordCandidates(
    documentId,
    {
      filter: wordFilter,
      search: wordSearch || undefined,
      limit: wordPageSize,
      offset: (wordPage - 1) * wordPageSize,
    },
    documentQuery.isSuccess,
  );
  const isOccurrencesTransitioning = occurrencesQuery.isFetching && occurrencesQuery.isPlaceholderData;
  const isWordCandidatesTransitioning =
    wordCandidatesQuery.isFetching && wordCandidatesQuery.isPlaceholderData;

  const pages = pagesQuery.data ?? [];
  const requestedPageNumber = parseDocumentEvidencePage(searchParams.get("page"));
  const selectedPage =
    (requestedPageNumber != null
      ? pages.find((page) => page.page_number === requestedPageNumber) ?? null
      : null) ?? pages[0] ?? null;
  const knownJobId = searchParams.get("jobId") ?? getRememberedDocumentJobLink(documentId);
  const relatedJobQuery = useJob(knownJobId ?? "");

  const failureJob =
    relatedJobQuery.data?.status === "failed" || documentQuery.data?.status === "failed"
      ? relatedJobQuery.data ?? null
      : null;

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

  function handleSelectPage(pageNumber: number) {
    window.history.replaceState(
      null,
      "",
      buildPathWithDocumentPage(pathname, searchParams, pageNumber),
    );
  }

  return (
    <AuthGuard>
      <AppShell
        title={documentQuery.data ? titleFromDocument(documentQuery.data) : messages.documentDetail.fallbackTitle}
        description={messages.documentDetail.description}
        actions={
          knownJobId ? (
            <Link href={href(`${ROUTES.jobs}/${knownJobId}`)}>
              <Button variant="outline">
                {messages.documentDetail.relatedJob}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : null
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
                    canRetry={failureJob?.can_retry}
                    errorMessageUser={failureJob?.error_message_user}
                    isRetrying={retryMutation.isPending}
                    lastRetriedAt={failureJob?.last_retried_at}
                    nextSteps={failureJob?.next_steps}
                    onRetry={failureJob?.can_retry ? handleRetry : undefined}
                    retryCount={failureJob?.retry_count}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-0 border-b border-border/80 py-10 xl:grid-cols-[22rem_minmax(0,1fr)] xl:divide-x xl:divide-border/70">
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
          </section>

          <section className="border-b border-border/80 py-10">
            <div className="space-y-1 border-b border-border/70 pb-5">
              <h3 className="text-lg font-semibold tracking-tight">{messages.documentDetail.wordsTitle}</h3>
              <p className="text-sm text-muted-foreground">{messages.documentDetail.wordsDescription}</p>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)_auto]">
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
          </section>

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

          {!pagesQuery.isLoading && !(pagesQuery.data?.length ?? 0) ? (
            <div className="mt-10 flex items-start gap-3 rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-5 text-sm text-muted-foreground shadow-sm">
              <FileStack className="mt-0.5 h-4 w-4 shrink-0" />
              {messages.documentDetail.pagesPending}
            </div>
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
    </AuthGuard>
  );
}
