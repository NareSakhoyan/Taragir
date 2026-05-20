"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { WordEvidenceSummary } from "@/lib/types/api";
import {
  getWordLexemeHref,
  getWordMatchTypeClassName,
  getWordMatchTypeLabel,
  getWordSearchResultHref,
  isTrustedExternalWord,
  isWordResultExternalLink,
} from "@/lib/utils/words";

type WordResultCardProps = {
  item: WordEvidenceSummary;
  onViewDetails: (item: WordEvidenceSummary) => void;
};

export function WordResultCard({ item, onViewDetails }: WordResultCardProps) {
  const { href, locale, messages } = useI18n();
  const sourceHref = getWordSearchResultHref(item);
  const lexemeHref = getWordLexemeHref(item);
  const sampleContexts = Array.isArray(item.sample_contexts) ? item.sample_contexts : [];
  const isTrustedExternal = isTrustedExternalWord(item);
  const primaryContext = item.context_snippet || sampleContexts[0] || messages.words.emptyStates.noContext;

  return (
    <article
      className={
        isTrustedExternal
          ? "rounded-md border border-orange-200/80 bg-orange-50/40 p-4 shadow-sm"
          : "rounded-md border border-border/80 bg-card/80 p-4 shadow-sm"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold [overflow-wrap:anywhere]">{item.display_word}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {item.normalized_form ? <span>{item.normalized_form}</span> : null}
            {item.canonical_form ? <span>{messages.words.labels.canonicalForm}: {item.canonical_form}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isTrustedExternal ? (
            <>
              <Badge className="border-orange-200 bg-orange-50 text-orange-700" variant="outline">
                {messages.words.badges.trustedExternal}
              </Badge>
              <Badge className="border-orange-200 bg-white/80 text-orange-800" variant="outline">
                {item.provider_display_name || messages.words.badges.externalSource}
              </Badge>
              {item.match_type ? (
                <Badge className={getWordMatchTypeClassName(item.match_type)} variant="outline">
                  {getWordMatchTypeLabel(item.match_type, messages)}
                </Badge>
              ) : null}
              {item.morphology?.available ? (
                <Badge className="border-violet-200 bg-violet-50 text-violet-700" variant="outline">
                  {messages.morphology.badges.available}
                </Badge>
              ) : null}
            </>
          ) : (
            <>
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
              {item.morphology?.available ? (
                <Badge className="border-violet-200 bg-violet-50 text-violet-700" variant="outline">
                  {messages.morphology.badges.available}
                </Badge>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <div className="space-y-2">
          <p className="[overflow-wrap:anywhere]">
            <span className="font-medium text-foreground">{messages.words.labels.source}</span>
            {": "}
            {item.source_title || "—"}
          </p>
          {isTrustedExternal ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.words.labels.provider}</span>
              {": "}
              {item.provider_display_name || "—"}
            </p>
          ) : item.page_number != null ? (
            <p>
              <span className="font-medium text-foreground">{messages.words.labels.page}</span>
              {": "}
              {item.page_number}
            </p>
          ) : null}
          {isTrustedExternal ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.words.labels.matchedForm}</span>
              {": "}
              {item.matched_form ?? item.display_word}
            </p>
          ) : item.reference_match?.has_match ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.words.labels.referenceMatch}</span>
              {": "}
              {[item.reference_match.source_name, item.reference_match.matched_form]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {item.morphology?.best_lemma ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.morphology.labels.bestLemma}</span>
              {": "}
              {item.morphology.best_lemma}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="line-clamp-3">{primaryContext}</p>
          {isTrustedExternal ? (
            <>
              {item.match_type ? (
                <p className="[overflow-wrap:anywhere]">
                  <span className="font-medium text-foreground">{messages.words.labels.matchType}</span>
                  {": "}
                  {getWordMatchTypeLabel(item.match_type, messages)}
                </p>
              ) : null}
              {item.match_score != null ? (
                <p>
                  <span className="font-medium text-foreground">{messages.words.labels.matchScore}</span>
                  {": "}
                  {item.match_score.toLocaleString(locale)}
                </p>
              ) : null}
            </>
          ) : item.linked_lexeme ? (
            <p className="[overflow-wrap:anywhere]">
              <span className="font-medium text-foreground">{messages.words.labels.linkedLexeme}</span>
              {": "}
              {item.linked_lexeme.canonical_form}
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
          isWordResultExternalLink(item) ? (
            <Button asChild size="sm" variant="outline">
              <a href={sourceHref} rel="noopener noreferrer" target="_blank">
                {messages.words.actions.openSource}
              </a>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={href(sourceHref)}>{messages.words.actions.openSource}</Link>
            </Button>
          )
        ) : null}
      </div>
    </article>
  );
}
