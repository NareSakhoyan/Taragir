"use client";

import Link from "next/link";
import { ArrowRight, FileStack } from "lucide-react";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
import { useJob, useRetryJob } from "@/lib/hooks/use-job";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getRememberedDocumentJobLink } from "@/lib/supabase/session";
import { OCCURRENCES_PAGE_SIZE, ROUTES } from "@/lib/utils/constants";
import { formatBytes, formatDate, formatNumber, titleFromDocument } from "@/lib/utils/format";

export default function DocumentDetailPage() {
  const params = useParams<{ locale: string; documentId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { href, locale, messages } = useI18n();
  const documentId = params.documentId;
  const documentQuery = useDocument(documentId);
  const pagesQuery = useDocumentPages(documentId);
  const retryMutation = useRetryJob();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [occurrenceFilters, setOccurrenceFilters] = useState({
    pageNumber: "",
    normalizedToken: "",
  });
  const [occurrenceOffset, setOccurrenceOffset] = useState(0);

  const occurrencesQuery = useDocumentOccurrences(documentId, {
    page_number: occurrenceFilters.pageNumber ? Number(occurrenceFilters.pageNumber) : undefined,
    normalized_token: occurrenceFilters.normalizedToken || undefined,
    limit: OCCURRENCES_PAGE_SIZE,
    offset: occurrenceOffset,
  });

  const pages = pagesQuery.data ?? [];
  const effectiveSelectedPageId =
    selectedPageId && pages.some((page) => page.id === selectedPageId) ? selectedPageId : pages[0]?.id ?? null;
  const selectedPage = pages.find((page) => page.id === effectiveSelectedPageId) ?? null;
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
      toast.success(messages.job.retryStartedTitle, {
        description: result.message || messages.job.retryStartedDescription,
      });

      if (result.job.id) {
        router.push(href(`${ROUTES.jobs}/${result.job.id}`));
      }
    } catch (error) {
      toast.error(messages.job.retryFailedTitle, {
        description: error instanceof Error ? error.message : undefined,
      });
    }
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
                <PageList pages={pages} selectedPageId={effectiveSelectedPageId} onSelectPage={(page) => setSelectedPageId(page.id)} />
              )}
            </div>

            <div className="min-w-0 border-t border-border/70 pt-10 xl:border-t-0 xl:pl-10 xl:pt-0">
              <PageTextViewer page={selectedPage} />
            </div>
          </section>

          <OccurrencesTable
            data={occurrencesQuery.data}
            errorMessage={occurrencesQuery.error?.message}
            filters={occurrenceFilters}
            isFetching={occurrencesQuery.isFetching}
            isLoading={occurrencesQuery.isLoading}
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
        </div>
      </AppShell>
    </AuthGuard>
  );
}
