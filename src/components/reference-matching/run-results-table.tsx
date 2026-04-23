"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { OffsetPagination, ReferenceMatchingRunResultSummary } from "@/lib/types/api";
import { TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { formatReferenceImportMethod, isOcrReferenceImportMethod } from "@/lib/utils/format";
import {
  formatReferenceMatchingCountLabel,
  formatReferenceMatchingStatus,
  getReferenceMatchingDocumentHref,
  getReferenceMatchingLexemeHref,
  getReferenceMatchingResultSourceHref,
} from "@/lib/utils/reference-matching";

type RunResultsTableProps = {
  data?: OffsetPagination<ReferenceMatchingRunResultSummary>;
  isLoading?: boolean;
  isFetching?: boolean;
  errorMessage?: string | null;
  emptyTitle: string;
  emptyDescription: string;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetails: (result: ReferenceMatchingRunResultSummary) => void;
};

function getMatchStatusClassName(status: ReferenceMatchingRunResultSummary["match_status"]) {
  return status === "matched"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-border/80 bg-muted/20 text-foreground";
}

function BooleanBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <Badge
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border/80 bg-muted/20 text-muted-foreground"
      }
      variant="outline"
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}

export function RunResultsTable({
  data,
  isLoading = false,
  isFetching = false,
  errorMessage,
  emptyTitle,
  emptyDescription,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
}: RunResultsTableProps) {
  const { href, locale, messages } = useI18n();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 rounded-md bg-muted/30" />
        <div className="h-16 rounded-md bg-muted/30" />
        <div className="h-16 rounded-md bg-muted/30" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-md border border-border/80 shadow-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{messages.referenceMatching.results.columns.entry}</TableHead>
              <TableHead>{messages.referenceMatching.results.columns.matchStatus}</TableHead>
              <TableHead>{messages.referenceMatching.results.columns.matchCount}</TableHead>
              <TableHead>{messages.referenceMatching.results.columns.lexicon}</TableHead>
              <TableHead>{messages.referenceMatching.results.columns.books}</TableHead>
              <TableHead>{messages.referenceMatching.results.columns.importMethod}</TableHead>
              <TableHead className="text-right">{messages.referenceMatching.results.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((result) => {
              const sourceHref = getReferenceMatchingResultSourceHref(result.source_id);
              const bestLexemeHref = getReferenceMatchingLexemeHref(result.best_lexeme_id);
              const bestDocumentHref = getReferenceMatchingDocumentHref(
                result.best_document_id,
                result.best_page_number,
              );

              return (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium [overflow-wrap:anywhere]">{result.target_label}</p>
                      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        {messages.referenceMatching.results.columns.normalizedForm}: {result.normalized_form}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge className={getMatchStatusClassName(result.match_status)} variant="outline">
                        {formatReferenceMatchingStatus(result.match_status, messages)}
                      </Badge>
                      {result.match_status === "unmatched" ? (
                        <p className="max-w-xs text-xs text-muted-foreground">
                          {messages.referenceMatching.results.unmatchedHelper}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{result.match_count.toLocaleString(locale)}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <BooleanBadge
                        active={result.exists_in_lexicon}
                        activeLabel={messages.referenceMatching.results.lexiconFound}
                        inactiveLabel={messages.referenceMatching.results.lexiconMissing}
                      />
                      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        {result.best_lexeme_canonical_form
                          ? result.best_lexeme_canonical_form
                          : messages.referenceMatching.results.noLexemeMatch}
                      </p>
                      {result.matching_lexeme_count > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {formatReferenceMatchingCountLabel(
                            messages.referenceMatching.results.lexemeCount,
                            result.matching_lexeme_count,
                            locale,
                            "es",
                          )}
                        </p>
                      ) : null}
                      {bestLexemeHref ? (
                        <Link
                          className="inline-block text-xs text-primary underline-offset-4 hover:underline"
                          href={href(bestLexemeHref)}
                        >
                          {messages.words.actions.openLexeme}
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <BooleanBadge
                        active={result.found_in_books}
                        activeLabel={messages.referenceMatching.results.booksFound}
                        inactiveLabel={messages.referenceMatching.results.booksMissing}
                      />
                      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        {result.best_document_title || messages.referenceMatching.results.noBookEvidence}
                      </p>
                      {result.matching_book_occurrence_count > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {formatReferenceMatchingCountLabel(
                            messages.referenceMatching.results.bookCount,
                            result.matching_book_occurrence_count,
                            locale,
                            "s",
                          )}
                          {result.best_page_number != null
                            ? ` · ${messages.words.labels.page} ${result.best_page_number}`
                            : ""}
                        </p>
                      ) : null}
                      {bestDocumentHref ? (
                        <Link
                          className="inline-block text-xs text-primary underline-offset-4 hover:underline"
                          href={href(bestDocumentHref)}
                        >
                          {messages.lexicon.detail.openDocument}
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <p>{formatReferenceImportMethod(result.source_import_method)}</p>
                      <div className="flex flex-wrap gap-2">
                        {isOcrReferenceImportMethod(result.source_import_method) ? (
                          <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                            {messages.reference.badges.ocrSource}
                          </Badge>
                        ) : null}
                      </div>
                      {result.source_warning ? (
                        <p className="max-w-xs text-xs text-amber-900 [overflow-wrap:anywhere]">
                          {result.source_warning}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => onViewDetails(result)} size="sm" type="button" variant="outline">
                        {messages.referenceMatching.results.viewDetails}
                      </Button>
                      {sourceHref ? (
                        <Link href={href(sourceHref)}>
                          <Button size="sm" variant="outline">
                            {messages.referenceMatching.results.openSource}
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled size="sm" type="button" variant="outline">
                          {messages.referenceMatching.results.openSource}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((result) => {
          const sourceHref = getReferenceMatchingResultSourceHref(result.source_id);
          const bestLexemeHref = getReferenceMatchingLexemeHref(result.best_lexeme_id);
          const bestDocumentHref = getReferenceMatchingDocumentHref(
            result.best_document_id,
            result.best_page_number,
          );

          return (
            <div className="rounded-md border border-border/80 bg-card/80 p-4 shadow-sm" key={result.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold [overflow-wrap:anywhere]">{result.target_label}</p>
                  <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                    {messages.referenceMatching.results.columns.normalizedForm}: {result.normalized_form}
                  </p>
                </div>
                <Badge className={getMatchStatusClassName(result.match_status)} variant="outline">
                  {formatReferenceMatchingStatus(result.match_status, messages)}
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                <p>
                  {messages.referenceMatching.results.columns.matchCount}:{" "}
                  {result.match_count.toLocaleString(locale)}
                </p>
                <div className="space-y-1">
                  <p>{messages.referenceMatching.results.columns.lexicon}</p>
                  <div className="flex flex-wrap gap-2">
                    <BooleanBadge
                      active={result.exists_in_lexicon}
                      activeLabel={messages.referenceMatching.results.lexiconFound}
                      inactiveLabel={messages.referenceMatching.results.lexiconMissing}
                    />
                    {bestLexemeHref ? (
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={href(bestLexemeHref)}
                      >
                        {messages.words.actions.openLexeme}
                      </Link>
                    ) : null}
                  </div>
                  <p className="[overflow-wrap:anywhere]">
                    {result.best_lexeme_canonical_form || messages.referenceMatching.results.noLexemeMatch}
                  </p>
                </div>
                <div className="space-y-1">
                  <p>{messages.referenceMatching.results.columns.books}</p>
                  <div className="flex flex-wrap gap-2">
                    <BooleanBadge
                      active={result.found_in_books}
                      activeLabel={messages.referenceMatching.results.booksFound}
                      inactiveLabel={messages.referenceMatching.results.booksMissing}
                    />
                    {bestDocumentHref ? (
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={href(bestDocumentHref)}
                      >
                        {messages.lexicon.detail.openDocument}
                      </Link>
                    ) : null}
                  </div>
                  <p className="[overflow-wrap:anywhere]">
                    {result.best_document_title || messages.referenceMatching.results.noBookEvidence}
                  </p>
                </div>
                <div className="space-y-1">
                  <p>{messages.referenceMatching.results.columns.importMethod}</p>
                  <p>{formatReferenceImportMethod(result.source_import_method)}</p>
                  {result.source_warning ? (
                    <p className="text-amber-900 [overflow-wrap:anywhere]">{result.source_warning}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {sourceHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href(sourceHref)}>{messages.referenceMatching.results.openSource}</Link>
                  </Button>
                ) : null}
                <Button onClick={() => onViewDetails(result)} size="sm" type="button" variant="outline">
                  {messages.referenceMatching.results.viewDetails}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <TablePagination
        currentPage={currentPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSize={pageSize}
        pageSizeOptions={[...TABLE_PAGE_SIZE_OPTIONS]}
        totalPages={totalPages}
        isBusy={isFetching}
      />
    </div>
  );
}
