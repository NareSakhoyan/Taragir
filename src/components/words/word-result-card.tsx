"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { WordEvidenceSummary } from "@/lib/types/api";
import { getWordLexemeHref, getWordSearchResultHref } from "@/lib/utils/words";

type WordResultCardProps = {
  item: WordEvidenceSummary;
  onViewDetails: (item: WordEvidenceSummary) => void;
};

export function WordResultCard({ item, onViewDetails }: WordResultCardProps) {
  const { href, messages } = useI18n();
  const sourceHref = getWordSearchResultHref(item);
  const lexemeHref = getWordLexemeHref(item);
  const sampleContexts = Array.isArray(item.sample_contexts) ? item.sample_contexts : [];

  return (
    <article className="rounded-md border border-border/80 bg-card/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold [overflow-wrap:anywhere]">{item.display_word}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {item.normalized_form ? <span>{item.normalized_form}</span> : null}
            {item.canonical_form ? <span>{messages.words.labels.canonicalForm}: {item.canonical_form}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.is_suspicious ? (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
              {messages.words.badges.suspicious}
            </Badge>
          ) : null}
          {item.is_linked ? (
            <Badge className="border-sky-200 bg-sky-50 text-sky-700" variant="outline">
              {messages.words.badges.linked}
            </Badge>
          ) : null}
          <Badge
            className={
              item.match_status === "matched"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-border/80 bg-muted/20 text-muted-foreground"
            }
            variant="outline"
          >
            {item.match_status === "matched"
              ? messages.words.badges.referenceMatched
              : messages.words.badges.referenceUnmatched}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <div className="space-y-2">
          <p className="[overflow-wrap:anywhere]">
            <span className="font-medium text-foreground">{messages.words.labels.source}</span>
            {": "}
            {item.source_title || "—"}
          </p>
          {item.page_number != null ? (
            <p>
              <span className="font-medium text-foreground">{messages.words.labels.page}</span>
              {": "}
              {item.page_number}
            </p>
          ) : null}
          {item.reference_match?.has_match ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.words.labels.referenceMatch}</span>
              {": "}
              {[item.reference_match.source_name, item.reference_match.matched_form]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          {item.context_snippet ? (
            <p className="line-clamp-3">{item.context_snippet}</p>
          ) : sampleContexts.length ? (
            <p className="line-clamp-3">{sampleContexts[0]}</p>
          ) : (
            <p>{messages.words.emptyStates.noContext}</p>
          )}
          {item.linked_lexeme ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.words.labels.linkedLexeme}</span>
              {": "}
              {item.linked_lexeme.canonical_form}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button onClick={() => onViewDetails(item)} size="sm" type="button" variant="outline">
          {messages.words.actions.viewDetails}
        </Button>
        {lexemeHref ? (
          <Button asChild size="sm" variant="outline">
            <Link href={href(lexemeHref)}>{messages.words.actions.openLexeme}</Link>
          </Button>
        ) : null}
        {sourceHref ? (
          <Button asChild size="sm" variant="outline">
            <Link href={href(sourceHref)}>{messages.words.actions.openSource}</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
