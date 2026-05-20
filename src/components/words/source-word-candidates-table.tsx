"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { DocumentTrustedExternalStatus, OffsetPagination, WordEvidenceSummary } from "@/lib/types/api";
import { isWordResultExternalLink } from "@/lib/utils/words";
import { TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { getWordLexemeHref } from "@/lib/utils/words";

type SourceWordCandidatesTableProps = {
  variant: "document" | "reference_source";
  data?: OffsetPagination<WordEvidenceSummary>;
  isLoading?: boolean;
  isFetching?: boolean;
  errorMessage?: string | null;
  emptyTitle: string;
  emptyDescription: string;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetails: (item: WordEvidenceSummary) => void;
};

function MatchStatusBadge({ item }: { item: WordEvidenceSummary }) {
  const { messages } = useI18n();
  const isMatched = item.has_reference_match ?? item.match_status === "matched";

  return (
    <Badge
      className={
        isMatched
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border/80 bg-muted/20 text-muted-foreground"
      }
      variant="outline"
    >
      {isMatched ? messages.words.badges.referenceMatched : messages.words.badges.referenceUnmatched}
    </Badge>
  );
}

function NayiriStatusBadge({ status }: { status: DocumentTrustedExternalStatus | null | undefined }) {
  const { messages } = useI18n();

  switch (status) {
    case "found":
      return (
        <Badge className="border-sky-200 bg-sky-50 text-sky-800" variant="outline">
          {messages.words.badges.nayiriFound}
        </Badge>
      );
    case "not_found":
      return (
        <Badge className="border-border/80 bg-muted/20 text-muted-foreground" variant="outline">
          {messages.words.badges.nayiriNotFound}
        </Badge>
      );
    case "unavailable":
      return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-800" variant="outline">
          {messages.words.badges.nayiriUnavailable}
        </Badge>
      );
    default:
      return (
        <Badge className="border-dashed border-border/80 bg-background text-muted-foreground" variant="outline">
          {messages.words.badges.nayiriUnchecked}
        </Badge>
      );
  }
}

function resolveNayiriCanonicalizationLabel(
  status: WordEvidenceSummary["trusted_external_canonicalization_status"],
  messages: ReturnType<typeof useI18n>["messages"],
) {
  if (status === "direct_match") {
    return messages.words.nayiri.canonicalization.directMatch;
  }
  if (status === "canonicalized_by_nayiri") {
    return messages.words.nayiri.canonicalization.canonicalized;
  }
  if (status === "morphology_assisted") {
    return messages.words.nayiri.canonicalization.morphologyAssisted;
  }
  return messages.words.nayiri.canonicalization.unresolved;
}

export function SourceWordCandidatesTable({
  variant,
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
}: SourceWordCandidatesTableProps) {
  const { href, locale, messages } = useI18n();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasLinkedLexeme = variant === "reference_source" && items.some((item) => Boolean(item.linked_lexeme));
  const hasReferenceStatus =
    variant === "reference_source" && items.some((item) => Boolean(item.match_status || item.has_reference_match));
  const showNayiriColumn = variant === "document";

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
              <TableHead>{messages.words.columns.word}</TableHead>
              {variant === "document" ? (
                <>
                  <TableHead>{messages.words.columns.occurrences}</TableHead>
                  <TableHead>{messages.words.columns.pages}</TableHead>
                  <TableHead>{messages.words.columns.samples}</TableHead>
                </>
              ) : null}
              {variant === "document" || hasLinkedLexeme ? (
                <TableHead>{messages.words.columns.linkedLexeme}</TableHead>
              ) : null}
              {variant === "document" || hasReferenceStatus ? (
                <TableHead>{messages.words.columns.referenceStatus}</TableHead>
              ) : null}
              {showNayiriColumn ? <TableHead>{messages.words.columns.nayiriStatus}</TableHead> : null}
              <TableHead className="text-right">{messages.words.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const lexemeHref = getWordLexemeHref(item);
              const sampleTokens = Array.isArray(item.sample_tokens) ? item.sample_tokens : [];
              const samplePages = Array.isArray(item.sample_pages) ? item.sample_pages : [];

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium [overflow-wrap:anywhere]">{item.normalized_form ?? item.display_word}</p>
                        {item.morphology?.available ? (
                          <Badge className="border-violet-200 bg-violet-50 text-violet-700" variant="outline">
                            {messages.morphology.badges.available}
                          </Badge>
                        ) : null}
                      </div>
                      {sampleTokens.length ? (
                        <p className="text-xs text-muted-foreground">{sampleTokens.slice(0, 3).join(", ")}</p>
                      ) : null}
                      {item.morphology?.best_lemma ? (
                        <p className="text-xs text-muted-foreground">
                          {messages.morphology.labels.bestLemma}: {item.morphology.best_lemma}
                        </p>
                      ) : null}
                      {item.morphology?.pos_candidates.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.morphology.pos_candidates.slice(0, 3).map((candidate) => (
                            <Badge key={candidate} variant="outline">
                              {candidate}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>

                  {variant === "document" ? (
                    <>
                      <TableCell>{(item.occurrence_count ?? 0).toLocaleString(locale)}</TableCell>
                      <TableCell>{(item.page_count ?? 0).toLocaleString(locale)}</TableCell>
                      <TableCell className="[overflow-wrap:anywhere]">
                        {samplePages.length
                          ? samplePages.slice(0, 4).join(", ")
                          : item.context_snippet || "—"}
                      </TableCell>
                    </>
                  ) : null}

                  {variant === "document" || hasLinkedLexeme ? (
                    <TableCell>
                      {item.linked_lexeme ? (
                        <div className="space-y-1">
                          <p className="font-medium [overflow-wrap:anywhere]">{item.linked_lexeme.canonical_form}</p>
                          {lexemeHref ? (
                            <Link className="text-xs text-primary underline-offset-4 hover:underline" href={href(lexemeHref)}>
                              {messages.words.actions.openLexeme}
                            </Link>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{messages.words.labels.unlinked}</span>
                      )}
                    </TableCell>
                  ) : null}
                  {variant === "document" || hasReferenceStatus ? (
                    <TableCell>
                      <MatchStatusBadge item={item} />
                    </TableCell>
                  ) : null}
                  {showNayiriColumn ? (
                    <TableCell>
                      <div className="space-y-2">
                        <NayiriStatusBadge status={item.trusted_external_status} />
                        {item.trusted_external_status === "found" ? (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {item.trusted_external_matched_form ? (
                              <p className="[overflow-wrap:anywhere]">
                                {messages.words.nayiri.matchedForm}: {item.trusted_external_matched_form}
                              </p>
                            ) : null}
                            <p className="[overflow-wrap:anywhere]">
                              {resolveNayiriCanonicalizationLabel(
                                item.trusted_external_canonicalization_status,
                                messages,
                              )}
                            </p>
                            {item.trusted_external_source_title ? (
                              <p className="[overflow-wrap:anywhere]">{item.trusted_external_source_title}</p>
                            ) : null}
                            {item.trusted_external_reference_link &&
                            isWordResultExternalLink({
                              ...item,
                              reference_link: item.trusted_external_reference_link,
                            }) ? (
                              <a
                                className="text-primary underline-offset-4 hover:underline [overflow-wrap:anywhere]"
                                href={item.trusted_external_reference_link}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {messages.words.actions.openSource}
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <Button onClick={() => onViewDetails(item)} size="sm" type="button" variant="outline">
                      {messages.words.actions.viewDetails}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((item) => {
          const lexemeHref = getWordLexemeHref(item);
          const sampleTokens = Array.isArray(item.sample_tokens) ? item.sample_tokens : [];
          const samplePages = Array.isArray(item.sample_pages) ? item.sample_pages : [];

          return (
            <div className="rounded-md border border-border/80 bg-card/80 p-4 shadow-sm" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold [overflow-wrap:anywhere]">{item.normalized_form ?? item.display_word}</p>
                    {item.morphology?.available ? (
                      <Badge className="border-violet-200 bg-violet-50 text-violet-700" variant="outline">
                        {messages.morphology.badges.available}
                      </Badge>
                    ) : null}
                  </div>
                  {sampleTokens.length ? (
                    <p className="text-sm text-muted-foreground">{sampleTokens.slice(0, 3).join(", ")}</p>
                  ) : null}
                  {item.morphology?.best_lemma ? (
                    <p className="text-xs text-muted-foreground">
                      {messages.morphology.labels.bestLemma}: {item.morphology.best_lemma}
                    </p>
                  ) : null}
                </div>
                <MatchStatusBadge item={item} />
              </div>

              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {variant === "document" ? (
                  <>
                    <p>
                      {messages.words.columns.occurrences}:{" "}
                      {(item.occurrence_count ?? 0).toLocaleString(locale)}
                    </p>
                    <p>
                      {messages.words.columns.pages}: {(item.page_count ?? 0).toLocaleString(locale)}
                    </p>
                    <p className="[overflow-wrap:anywhere]">
                      {messages.words.columns.samples}:{" "}
                      {samplePages.length ? samplePages.slice(0, 4).join(", ") : "—"}
                    </p>
                  </>
                ) : null}
                {variant === "document" || hasLinkedLexeme ? (
                  <p className="[overflow-wrap:anywhere]">
                    {messages.words.columns.linkedLexeme}:{" "}
                    {item.linked_lexeme?.canonical_form ?? messages.words.labels.unlinked}
                  </p>
                ) : null}
                {variant === "document" || hasReferenceStatus ? (
                  <div className="flex flex-wrap gap-2">
                    <span>{messages.words.columns.referenceStatus}:</span>
                    <MatchStatusBadge item={item} />
                  </div>
                ) : null}
                {showNayiriColumn ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{messages.words.columns.nayiriStatus}:</span>
                      <NayiriStatusBadge status={item.trusted_external_status} />
                    </div>
                    {item.trusted_external_source_title ? (
                      <p className="[overflow-wrap:anywhere]">{item.trusted_external_source_title}</p>
                    ) : null}
                  </div>
                ) : null}
                {item.morphology?.pos_candidates.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.morphology.pos_candidates.slice(0, 3).map((candidate) => (
                      <Badge key={candidate} variant="outline">
                        {candidate}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {lexemeHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={href(lexemeHref)}>{messages.words.actions.openLexeme}</Link>
                  </Button>
                ) : null}
                <Button onClick={() => onViewDetails(item)} size="sm" type="button" variant="outline">
                  {messages.words.actions.viewDetails}
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
