"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ReferenceImportForm } from "@/components/references/reference-import-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useJob } from "@/lib/hooks/use-job";
import { useReferenceSource } from "@/lib/hooks/use-references";
import { useReferenceSourceWordCandidates } from "@/lib/hooks/use-words";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getRememberedReferenceSourceJobLink } from "@/lib/supabase/session";
import type { WordCandidateFilter, WordEvidenceSummary } from "@/lib/types/api";
import { ROUTES, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import {
  formatDate,
  formatNumber,
  formatReferenceImportMethod,
  humanizeSnakeCase,
  isOcrReferenceImportMethod,
} from "@/lib/utils/format";
import { SourceWordCandidatesTable } from "@/components/words/source-word-candidates-table";
import { WordDetailDrawer } from "@/components/words/word-detail-drawer";
import { useState } from "react";
import { deriveReferenceSourceDetailView } from "@/lib/utils/reference-sources";

function MetadataItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

export default function ReferenceSourceDetailPage() {
  const params = useParams<{ sourceId: string }>();
  const { href, locale, messages } = useI18n();
  const [wordFilter, setWordFilter] = useState<WordCandidateFilter>("all");
  const [wordDraftSearch, setWordDraftSearch] = useState("");
  const [wordSearch, setWordSearch] = useState("");
  const [wordPage, setWordPage] = useState(1);
  const [wordPageSize, setWordPageSize] = useState<number>(TABLE_PAGE_SIZE_OPTIONS[1] ?? 20);
  const [selectedWord, setSelectedWord] = useState<WordEvidenceSummary | null>(null);
  const sourceQuery = useReferenceSource(params.sourceId);
  const source = sourceQuery.data;
  const knownImportJobId = getRememberedReferenceSourceJobLink(params.sourceId);
  const latestJobQuery = useJob(knownImportJobId ?? "");
  const wordCandidatesQuery = useReferenceSourceWordCandidates(
    params.sourceId,
    {
      filter: wordFilter,
      search: wordSearch || undefined,
      limit: wordPageSize,
      offset: (wordPage - 1) * wordPageSize,
    },
    sourceQuery.isSuccess,
  );
  const sourceView = deriveReferenceSourceDetailView(source);
  const latestImport = sourceView.latestImport;

  return (
    <AuthGuard>
      <AppShell
        actions={
          <Link href={href(ROUTES.references)}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {messages.references.backToSources}
            </Button>
          </Link>
        }
        description={messages.references.detailDescription}
        title={source?.display_name ?? messages.references.title}
      >
        {sourceQuery.isLoading ? (
          <Skeleton className="h-[32rem]" />
        ) : sourceQuery.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
            {sourceQuery.error.message}
          </div>
        ) : source ? (
          <div className="space-y-6">
            {latestJobQuery.data ? (
              <section className="rounded-md border border-border/80 bg-card/80 px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{messages.references.latestJobTitle}</p>
                    <p className="text-sm text-muted-foreground">{messages.references.latestJobDescription}</p>
                  </div>
                  <Link href={href(`${ROUTES.jobs}/${latestJobQuery.data.id}`)}>
                    <Button variant="outline">
                      {messages.references.openLatestJob}
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                </div>
              </section>
            ) : null}

            {sourceView.showOcrWarning ? (
              <section className="rounded-md border border-amber-200 bg-amber-50/80 px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-start gap-3">
                  <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                    {messages.reference.badges.ocrSource}
                  </Badge>
                  <div className="space-y-1">
                    <p className="font-medium text-amber-950">{messages.references.ocrWarningTitle}</p>
                    <p className="text-sm text-amber-900">{messages.references.ocrWarningDescription}</p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-md border border-border/80 bg-card/80 p-6 shadow-sm">
              <div className="space-y-1 border-b border-border/70 pb-5">
                <h2 className="text-lg font-semibold tracking-tight">{messages.references.metadataTitle}</h2>
                <p className="text-sm text-muted-foreground">{messages.references.metadataDescription}</p>
              </div>

              <div className="grid gap-4 py-5 md:grid-cols-2 xl:grid-cols-3">
                <MetadataItem label={messages.references.fields.displayName} value={source.display_name} />
                <MetadataItem label={messages.references.fields.sourceType} value={humanizeSnakeCase(source.source_type)} />
                <MetadataItem label={messages.references.fields.language} value={source.language || "—"} />
                <MetadataItem
                  label={messages.references.fields.entryCount}
                  value={source.entry_count == null ? "—" : formatNumber(source.entry_count, locale)}
                />
                <MetadataItem
                  label={messages.references.fields.importMethod}
                  value={formatReferenceImportMethod(sourceView.lastImportMethod)}
                />
                <MetadataItem
                  label={messages.references.fields.lastImported}
                  value={formatDate(sourceView.lastImportedAt, locale)}
                />
                <MetadataItem label={messages.references.fields.createdAt} value={formatDate(source.created_at, locale)} />
                <MetadataItem label={messages.references.fields.updatedAt} value={formatDate(source.updated_at, locale)} />
              </div>

              <div className="rounded-md border border-border/70 bg-muted/10 p-4 text-sm leading-7 text-foreground/90">
                {source.description?.trim() || "—"}
              </div>

              {sourceView.lastImportWarning ? (
                <div
                  className={
                    sourceView.showOcrWarning
                      ? "mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                      : "mt-4 rounded-md border border-border/70 bg-muted/10 px-4 py-3 text-sm text-foreground/90"
                  }
                >
                  <p className="font-medium">{messages.references.fields.importWarning}</p>
                  <p className="mt-1">{sourceView.lastImportWarning}</p>
                </div>
              ) : null}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <ReferenceImportForm sourceId={source.id} />

              <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
                <div className="space-y-1 border-b border-border/70 pb-4">
                  <h2 className="text-lg font-semibold tracking-tight">{messages.references.latestImportTitle}</h2>
                  <p className="text-sm text-muted-foreground">{messages.references.latestImportDescription}</p>
                </div>

                {sourceView.latestImportState === "summary" && latestImport ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                      <p className="text-sm text-muted-foreground">{messages.reference.labels.status}</p>
                      <p className="mt-2 font-semibold [overflow-wrap:anywhere]">{latestImport.status}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{formatDate(latestImport.created_at, locale)}</p>
                      {latestImport.filename ? (
                        <p className="mt-2 text-sm [overflow-wrap:anywhere]">{latestImport.filename}</p>
                      ) : null}
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground">{messages.reference.labels.importMethod}</p>
                        <p className="mt-1 font-semibold">
                          {formatReferenceImportMethod(latestImport.import_method)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <MetadataItem
                        label={messages.reference.labels.rowsRead}
                        value={
                          sourceView.hasExactImportCounters && latestImport.rows_read != null
                            ? formatNumber(latestImport.rows_read, locale)
                            : "—"
                        }
                      />
                      <MetadataItem
                        label={messages.reference.labels.rowsImported}
                        value={
                          sourceView.hasExactImportCounters && latestImport.rows_imported != null
                            ? formatNumber(latestImport.rows_imported, locale)
                            : "—"
                        }
                      />
                      <MetadataItem
                        label={messages.reference.labels.rowsSkipped}
                        value={
                          sourceView.hasExactImportCounters && latestImport.rows_skipped != null
                            ? formatNumber(latestImport.rows_skipped, locale)
                            : "—"
                        }
                      />
                    </div>

                    {latestImport.warning_message ? (
                      <div
                        className={
                          isOcrReferenceImportMethod(latestImport.import_method)
                            ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                            : "rounded-md border border-border/70 bg-muted/10 px-4 py-3 text-sm text-foreground/90"
                        }
                      >
                        <p className="font-medium">{messages.reference.labels.importWarning}</p>
                        <p className="mt-1">{latestImport.warning_message}</p>
                      </div>
                    ) : null}

                    {latestImport.error_message ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {latestImport.error_message}
                      </div>
                    ) : null}
                  </div>
                ) : sourceView.latestImportState === "metadata_only" ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                      <p className="font-medium">{messages.references.importSummaryUnavailable}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {messages.references.importSummaryUnavailableDescription}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <MetadataItem
                        label={messages.references.fields.entryCount}
                        value={source.entry_count == null ? "—" : formatNumber(source.entry_count, locale)}
                      />
                      <MetadataItem
                        label={messages.references.fields.importMethod}
                        value={formatReferenceImportMethod(sourceView.lastImportMethod)}
                      />
                      <MetadataItem
                        label={messages.references.fields.lastImported}
                        value={formatDate(sourceView.lastImportedAt, locale)}
                      />
                    </div>

                    {sourceView.lastImportWarning ? (
                      <div
                        className={
                          sourceView.showOcrWarning
                            ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                            : "rounded-md border border-border/70 bg-muted/10 px-4 py-3 text-sm text-foreground/90"
                        }
                      >
                        <p className="font-medium">{messages.reference.labels.importWarning}</p>
                        <p className="mt-1">{sourceView.lastImportWarning}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border border-dashed border-border/80 bg-muted/10 px-5 py-10 text-center">
                    <p className="text-sm text-muted-foreground">{messages.references.noImportYet}</p>
                  </div>
                )}
              </section>
            </div>

            <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
              <div className="space-y-1 border-b border-border/70 pb-4">
                <h2 className="text-lg font-semibold tracking-tight">{messages.references.wordsTitle}</h2>
                <p className="text-sm text-muted-foreground">{messages.references.wordsDescription}</p>
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
                    placeholder={messages.references.wordsSearchPlaceholder}
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
                emptyDescription={messages.references.wordsEmptyDescription}
                emptyTitle={messages.references.wordsEmptyTitle}
                errorMessage={wordCandidatesQuery.error?.message}
                isFetching={wordCandidatesQuery.isFetching}
                isLoading={wordCandidatesQuery.isLoading}
                onPageChange={setWordPage}
                onPageSizeChange={(nextPageSize) => {
                    setWordPageSize(nextPageSize);
                    setWordPage(1);
                  }}
                  onViewDetails={setSelectedWord}
                  pageSize={wordPageSize}
                  variant="reference_source"
                />
              </div>
            </section>

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
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
