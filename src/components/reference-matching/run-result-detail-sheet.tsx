"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/use-i18n";
import type {
  ReferenceMatchingRunResultDetail,
  ReferenceMatchingRunResultSummary,
} from "@/lib/types/api";
import { formatReferenceImportMethod, isOcrReferenceImportMethod } from "@/lib/utils/format";
import {
  formatReferenceMatchingCountLabel,
  formatReferenceMatchingStatus,
  getReferenceMatchingDocumentHref,
  getReferenceMatchingLexemeHref,
  getReferenceMatchingResultSourceHref,
} from "@/lib/utils/reference-matching";

type RunResultDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result?: ReferenceMatchingRunResultSummary | null;
  detail?: ReferenceMatchingRunResultDetail | null;
  isLoading?: boolean;
  errorMessage?: string | null;
};

function getMatchStatusClassName(status: ReferenceMatchingRunResultSummary["match_status"]) {
  return status === "matched"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-border/80 bg-muted/20 text-foreground";
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-md border border-border/80 bg-card/80 p-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function RunResultDetailSheet({
  open,
  onOpenChange,
  result,
  detail,
  isLoading = false,
  errorMessage,
}: RunResultDetailSheetProps) {
  const { href, locale, messages } = useI18n();
  const resolved = detail ?? result ?? null;
  const sourceHref = resolved ? getReferenceMatchingResultSourceHref(resolved.source_id) : null;
  const bestLexemeHref = resolved ? getReferenceMatchingLexemeHref(resolved.best_lexeme_id) : null;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{resolved?.target_label ?? messages.referenceMatching.results.detailTitle}</SheetTitle>
          <SheetDescription>{messages.referenceMatching.results.detailDescription}</SheetDescription>
        </SheetHeader>

        {!resolved && isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : errorMessage && !resolved ? (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : resolved ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-md border border-border/80 bg-muted/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="font-semibold [overflow-wrap:anywhere]">{resolved.target_label}</p>
                  <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                    <p className="[overflow-wrap:anywhere]">
                      {messages.referenceMatching.results.detailFields.normalizedForm}:{" "}
                      {resolved.normalized_form}
                    </p>
                    <p>
                      {messages.referenceMatching.results.detailFields.importMethod}:{" "}
                      {formatReferenceImportMethod(resolved.source_import_method)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getMatchStatusClassName(resolved.match_status)} variant="outline">
                    {formatReferenceMatchingStatus(resolved.match_status, messages)}
                  </Badge>
                  <Badge variant="outline">
                    {formatReferenceMatchingCountLabel(
                      messages.referenceMatching.results.detailMatchCount,
                      resolved.match_count,
                      locale,
                      "es",
                    )}
                  </Badge>
                  {isOcrReferenceImportMethod(resolved.source_import_method) ? (
                    <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                      {messages.reference.badges.ocrSource}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {resolved.source_warning ? (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-medium">{messages.referenceMatching.results.detailFields.warning}</p>
                  <p className="mt-1 [overflow-wrap:anywhere]">{resolved.source_warning}</p>
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {isLoading && !detail ? (
              <div className="space-y-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : detail ? (
              <>
                <DetailSection
                  description={messages.referenceMatching.results.detailSectionDescriptions.sourceEntry}
                  title={messages.referenceMatching.results.detailSections.sourceEntry}
                >
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <p className="[overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground">
                        {messages.referenceMatching.results.detailFields.source}
                      </span>
                      {": "}
                      {detail.source_entry.source_display_name}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        {messages.referenceMatching.results.detailFields.importMethod}
                      </span>
                      {": "}
                      {formatReferenceImportMethod(detail.source_entry.source_import_method)}
                    </p>
                    <p className="sm:col-span-2 [overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground">
                        {messages.referenceMatching.results.detailFields.sourceDescription}
                      </span>
                      {": "}
                      {detail.source_entry.source_description || "—"}
                    </p>
                  </div>

                  {detail.source_entry.source_warning ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-medium">{messages.referenceMatching.results.detailFields.warning}</p>
                      <p className="mt-1 [overflow-wrap:anywhere]">{detail.source_entry.source_warning}</p>
                    </div>
                  ) : null}

                  {detail.source_entry.source_metadata ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {messages.referenceMatching.results.detailFields.sourceMetadata}
                      </p>
                      <pre className="overflow-x-auto rounded-md border border-border/70 bg-muted/20 p-3 text-xs text-foreground/90">
                        {JSON.stringify(detail.source_entry.source_metadata, null, 2)}
                      </pre>
                    </div>
                  ) : null}

                  {sourceHref ? (
                    <div className="flex justify-end">
                      <Button asChild variant="outline">
                        <Link href={href(sourceHref)}>{messages.referenceMatching.results.openSource}</Link>
                      </Button>
                    </div>
                  ) : null}
                </DetailSection>

                <DetailSection
                  description={messages.referenceMatching.results.detailSectionDescriptions.lexicon}
                  title={messages.referenceMatching.results.detailSections.lexicon}
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={
                        detail.exists_in_lexicon
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border/80 bg-muted/20 text-muted-foreground"
                      }
                      variant="outline"
                    >
                      {detail.exists_in_lexicon
                        ? messages.referenceMatching.results.lexiconFound
                        : messages.referenceMatching.results.lexiconMissing}
                    </Badge>
                    <Badge variant="outline">
                      {formatReferenceMatchingCountLabel(
                        messages.referenceMatching.results.lexemeCount,
                        detail.matching_lexeme_count,
                        locale,
                        "es",
                      )}
                    </Badge>
                  </div>

                  {detail.matching_lexemes.length ? (
                    <div className="flex flex-wrap gap-2">
                      {detail.matching_lexemes.map((lexeme) => (
                        <Badge key={lexeme.lexeme_id} variant="outline">
                          {lexeme.canonical_form}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {messages.referenceMatching.results.noLexemeMatch}
                    </p>
                  )}

                  {bestLexemeHref ? (
                    <div className="flex justify-end">
                      <Button asChild variant="outline">
                        <Link href={href(bestLexemeHref)}>{messages.words.actions.openLexeme}</Link>
                      </Button>
                    </div>
                  ) : null}
                </DetailSection>

                <DetailSection
                  description={messages.referenceMatching.results.detailSectionDescriptions.books}
                  title={messages.referenceMatching.results.detailSections.books}
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={
                        detail.found_in_books
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border/80 bg-muted/20 text-muted-foreground"
                      }
                      variant="outline"
                    >
                      {detail.found_in_books
                        ? messages.referenceMatching.results.booksFound
                        : messages.referenceMatching.results.booksMissing}
                    </Badge>
                    <Badge variant="outline">
                      {formatReferenceMatchingCountLabel(
                        messages.referenceMatching.results.bookCount,
                        detail.matching_book_occurrence_count,
                        locale,
                        "s",
                      )}
                    </Badge>
                  </div>

                  {detail.book_evidence.length ? (
                    <div className="space-y-3">
                      {detail.book_evidence.map((context, index) => {
                        const documentHref =
                          context.reference_link ||
                          getReferenceMatchingDocumentHref(context.document_id, context.page_number);

                        return (
                          <div
                            className="space-y-3 rounded-md border border-border/70 bg-background/70 p-3"
                            key={`${context.document_id}-${context.occurrence_id ?? index}`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="font-medium [overflow-wrap:anywhere]">{context.document_title}</p>
                                {context.page_number != null ? (
                                  <p className="text-sm text-muted-foreground">
                                    {messages.words.labels.page}: {context.page_number}
                                  </p>
                                ) : null}
                              </div>
                              {documentHref ? (
                                <Button asChild size="sm" variant="outline">
                                  <Link href={href(documentHref)}>{messages.lexicon.detail.openDocument}</Link>
                                </Button>
                              ) : null}
                            </div>
                            <p className="text-sm leading-6 text-foreground/90">
                              {context.context_snippet || messages.referenceMatching.results.noBookEvidence}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {messages.referenceMatching.results.noBookEvidence}
                    </p>
                  )}
                </DetailSection>
              </>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
