"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { WordCheckResponse } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";

type WordCheckSummaryProps = {
  data?: WordCheckResponse;
  isLoading?: boolean;
  errorMessage?: string | null;
  emptyLabel?: string | null;
};

export function WordCheckSummary({
  data,
  isLoading = false,
  errorMessage,
  emptyLabel,
}: WordCheckSummaryProps) {
  const { href, locale, messages } = useI18n();

  if (isLoading) {
    return <Skeleton className="h-28 rounded-md" />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (!data) {
    return emptyLabel ? (
      <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    ) : null;
  }

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <div className="space-y-1 border-b border-border/70 pb-4">
        <h2 className="text-lg font-semibold tracking-tight">{messages.words.check.title}</h2>
        <p className="text-sm text-muted-foreground">{messages.words.check.description}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          className={
            data.exists_in_lexicon
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-border/80 bg-muted/20 text-muted-foreground"
          }
          variant="outline"
        >
          {data.exists_in_lexicon ? messages.words.check.existsYes : messages.words.check.existsNo}
        </Badge>
        {data.found_in_documents ? (
          <Badge className="border-sky-200 bg-sky-50 text-sky-700" variant="outline">
            {messages.words.categories.documents}
          </Badge>
        ) : null}
        {data.found_in_reference_sources ? (
          <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
            {messages.words.categories.referenceSources}
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-border/70 bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">{messages.words.check.existsLabel}</p>
          <p className="mt-2 font-semibold">
            {data.exists_in_lexicon ? messages.common.yes : messages.common.no}
          </p>
        </div>
        <div className="rounded-md border border-border/70 bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">{messages.words.check.lexemeCount}</p>
          <p className="mt-2 font-semibold">
            {data.matching_lexeme_count.toLocaleString(locale)}
          </p>
        </div>
        <div className="rounded-md border border-border/70 bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">{messages.words.check.sourcePresence}</p>
          <p className="mt-2 text-sm text-foreground">
            {messages.words.check.documentsFound.replace(
              "{count}",
              data.document_hit_count?.toLocaleString(locale) ?? "0",
            )}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {messages.words.check.referenceSourcesFound.replace(
              "{count}",
              data.reference_source_hit_count?.toLocaleString(locale) ?? "0",
            )}
          </p>
        </div>
      </div>

      {data.matching_lexemes.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">{messages.words.check.matchingLexemes}</p>
          <div className="flex flex-wrap gap-2">
            {data.matching_lexemes.map((lexeme) => (
              <Link href={href(`${ROUTES.lexemes}/${lexeme.id}`)} key={lexeme.id}>
                <Badge className="cursor-pointer border-border/80 bg-background hover:bg-accent" variant="outline">
                  {lexeme.canonical_form}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
