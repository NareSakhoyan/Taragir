"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { JobStageTimeline } from "@/components/jobs/job-stage-timeline";
import { RunResultsTable } from "@/components/reference-matching/run-results-table";
import { RunSummaryCard } from "@/components/reference-matching/run-summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useReferenceMatchingRun,
  useReferenceMatchingRunEvents,
  useReferenceMatchingRunResults,
} from "@/lib/hooks/use-reference-matching";
import { useReferenceSource } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";
import type {
  ReferenceMatchingResultStatusFilter,
  ReferenceMatchingRunResultsScopeFilter,
  ReferenceMatchingRunResultSummary,
} from "@/lib/types/api";
import { TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { ROUTES } from "@/lib/utils/constants";
import { WordDetailDrawer } from "@/components/words/word-detail-drawer";
import { isOcrReferenceImportMethod } from "@/lib/utils/format";
import { toReferenceMatchingWordSummary } from "@/lib/utils/reference-matching";
import { deriveReferenceSourceDetailView } from "@/lib/utils/reference-sources";

export default function ReferenceMatchingRunDetailPage() {
  const params = useParams<{ runId: string }>();
  const searchParams = useSearchParams();
  const { href, messages } = useI18n();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [matchStatus, setMatchStatus] = useState<ReferenceMatchingResultStatusFilter>("all");
  const [targetScope, setTargetScope] = useState<ReferenceMatchingRunResultsScopeFilter>("any");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZE_OPTIONS[1] ?? 20);
  const [selectedResult, setSelectedResult] = useState<ReferenceMatchingRunResultSummary | null>(null);
  const offset = (currentPage - 1) * pageSize;
  const runQuery = useReferenceMatchingRun(params.runId);
  const eventsQuery = useReferenceMatchingRunEvents(params.runId, runQuery.data?.status);
  const resultsQuery = useReferenceMatchingRunResults(
    params.runId,
    {
      match_status: matchStatus,
      target_scope: targetScope,
      search: search || undefined,
      limit: pageSize,
      offset,
    },
    runQuery.data?.status,
    runQuery.isSuccess,
  );
  const isResultsTableTransitioning =
    resultsQuery.isFetching && resultsQuery.isPlaceholderData;
  const run = runQuery.data;
  const routeSourceId = searchParams.get("source");
  const runSourceId =
    run?.source_id ??
    routeSourceId ??
    selectedResult?.source_id ??
    resultsQuery.data?.items[0]?.source_id ??
    null;
  const sourceQuery = useReferenceSource(runSourceId ?? "");
  const source = sourceQuery.data;
  const sourceView = deriveReferenceSourceDetailView(source);
  const runSourceTitle =
    source?.display_name ??
    run?.source_title ??
    run?.source_display_name ??
    null;
  const selectedWord = selectedResult
    ? toReferenceMatchingWordSummary(selectedResult, runSourceTitle)
    : null;
  const hasActiveResultsFilters = matchStatus !== "all" || targetScope !== "any" || Boolean(search);
  const isRunActive = run?.status === "queued" || run?.status === "running";

  function resolveResultsEmptyState() {
    if (isRunActive) {
      return {
        title: messages.referenceMatching.results.pendingTitle,
        description: messages.referenceMatching.results.pendingDescription,
      };
    }

    if (hasActiveResultsFilters) {
      if (matchStatus === "matched") {
        return {
          title: messages.referenceMatching.results.noMatchedTitle,
          description: messages.referenceMatching.results.noMatchedDescription,
        };
      }

      if (matchStatus === "unmatched") {
        return {
          title: messages.referenceMatching.results.noUnmatchedTitle,
          description: messages.referenceMatching.results.noUnmatchedDescription,
        };
      }

      return {
        title: messages.referenceMatching.results.noFilteredTitle,
        description: messages.referenceMatching.results.noFilteredDescription,
      };
    }

    return {
      title: messages.referenceMatching.results.noRecordedTitle,
      description: messages.referenceMatching.results.noRecordedDescription,
    };
  }

  const emptyState = resolveResultsEmptyState();

  return (
    <AuthGuard>
      <AppShell
        actions={
          <Link href={href(ROUTES.referenceMatching)}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {messages.referenceMatching.backToRuns}
            </Button>
          </Link>
        }
        description={messages.referenceMatching.detailDescription}
        title={messages.referenceMatching.title}
      >
        {runQuery.isLoading ? (
          <Skeleton className="h-[28rem]" />
        ) : runQuery.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
            {runQuery.error.message}
          </div>
        ) : run ? (
          <div className="space-y-6">
            <RunSummaryCard
              run={run}
              source={
                runSourceId || runSourceTitle || run?.source_import_method || run?.source_warning
                  ? {
                      id: runSourceId,
                      title: runSourceTitle,
                      importMethod: sourceView.lastImportMethod ?? run?.source_import_method ?? null,
                      warning: sourceView.lastImportWarning ?? run?.source_warning ?? null,
                      showOcrWarning:
                        sourceView.showOcrWarning ||
                        isOcrReferenceImportMethod(sourceView.lastImportMethod ?? run?.source_import_method ?? null),
                    }
                  : null
              }
            />

            {eventsQuery.data?.length ? (
              <JobStageTimeline
                description={messages.referenceMatching.detail.stageHistoryDescription}
                events={eventsQuery.data}
                title={messages.referenceMatching.detail.stageHistoryTitle}
              />
            ) : null}

            <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
              <div className="space-y-1 border-b border-border/70 pb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  {messages.referenceMatching.results.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {messages.referenceMatching.results.description}
                </p>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[14rem_14rem_minmax(0,1fr)_auto]">
                <select
                  className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => {
                    setMatchStatus(event.target.value as ReferenceMatchingResultStatusFilter);
                    setCurrentPage(1);
                  }}
                  value={matchStatus}
                >
                  <option value="all">{messages.referenceMatching.results.matchStatuses.all}</option>
                  <option value="matched">{messages.referenceMatching.results.matchStatuses.matched}</option>
                  <option value="unmatched">{messages.referenceMatching.results.matchStatuses.unmatched}</option>
                </select>

                <select
                  className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => {
                    setTargetScope(event.target.value as ReferenceMatchingRunResultsScopeFilter);
                    setCurrentPage(1);
                  }}
                  value={targetScope}
                >
                  <option value="any">{messages.referenceMatching.results.scopeFilters.any}</option>
                  <option value="lexicon_only">
                    {messages.referenceMatching.results.scopeFilters.lexicon_only}
                  </option>
                  <option value="books_only">{messages.referenceMatching.results.scopeFilters.books_only}</option>
                </select>

                <form
                  className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setCurrentPage(1);
                    setSearch(draftSearch.trim());
                  }}
                >
                  <Input
                    onChange={(event) => setDraftSearch(event.target.value)}
                    placeholder={messages.referenceMatching.results.searchPlaceholder}
                    value={draftSearch}
                  />
                  <Button type="submit" variant="outline">
                    <Search className="h-4 w-4" />
                    {messages.common.search}
                  </Button>
                </form>
              </div>

              <div className="mt-6">
                <RunResultsTable
                  currentPage={currentPage}
                  data={resultsQuery.data}
                  emptyDescription={emptyState.description}
                  emptyTitle={emptyState.title}
                  errorMessage={resultsQuery.error?.message}
                  isFetching={isResultsTableTransitioning}
                  isLoading={resultsQuery.isLoading || isResultsTableTransitioning}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setCurrentPage(1);
                  }}
                  onViewDetails={(result) => setSelectedResult(result)}
                  pageSize={pageSize}
                />
              </div>
            </section>

            <WordDetailDrawer
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedResult(null);
                }
              }}
              open={Boolean(selectedResult)}
              word={selectedWord}
            />
          </div>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
