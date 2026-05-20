"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useWordMorphology } from "@/lib/hooks/use-morphology";
import { useWordCheck, useWordEvidence } from "@/lib/hooks/use-words";
import { useI18n } from "@/lib/i18n/use-i18n";
import type {
  WordEvidenceSummary,
  WordInternalEvidenceItem,
  WordTrustedExternalEvidenceItem,
} from "@/lib/types/api";
import { formatReferenceImportMethod, isOcrReferenceImportMethod } from "@/lib/utils/format";
import {
  formatMorphologyStatus,
  getMorphologyEmptyLabel,
} from "@/lib/utils/morphology";
import {
  getWordLexemeHref,
  getWordMatchTypeClassName,
  getWordMatchTypeLabel,
  getWordSearchResultHref,
  getWordSourceTypeLabel,
  isTrustedExternalWord,
  isWordResultExternalLink,
} from "@/lib/utils/words";

type WordDetailDrawerProps = {
  word: WordEvidenceSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightSnippet(snippet: string, terms: string[]) {
  const normalizedTerms = Array.from(
    new Set(
      terms
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => right.length - left.length);

  if (!normalizedTerms.length) {
    return snippet;
  }

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}\\p{M}_])(${normalizedTerms.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}\\p{M}_])`,
    "giu",
  );
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of snippet.matchAll(pattern)) {
    const matchedText = match[0];
    const startIndex = match.index ?? -1;

    if (startIndex < 0) {
      continue;
    }

    if (startIndex > lastIndex) {
      segments.push(<span key={`text-${matchIndex}`}>{snippet.slice(lastIndex, startIndex)}</span>);
    }

    segments.push(
      <strong className="font-semibold text-foreground" key={`match-${matchIndex}`}>
        {matchedText}
      </strong>,
    );

    lastIndex = startIndex + matchedText.length;
    matchIndex += 1;
  }

  if (!segments.length) {
    return snippet;
  }

  if (lastIndex < snippet.length) {
    segments.push(<span key={`text-tail-${matchIndex}`}>{snippet.slice(lastIndex)}</span>);
  }

  return segments;
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-md border border-border/70 bg-muted/10 p-4">
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MorphologyMetric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background/70 p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value ?? "—"}</p>
    </div>
  );
}

function MorphologyDistribution({
  title,
  items,
}: {
  title: string;
  items: { value: string; count: number }[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={`${title}:${item.value}`} variant="outline">
            {item.value} · {item.count}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function buildFallbackInternalEvidenceItems(word: WordEvidenceSummary | null | undefined) {
  if (
    !word ||
    isTrustedExternalWord(word) ||
    (!word.source_title && word.page_number == null && !word.context_snippet && !word.reference_link)
  ) {
    return [] as WordInternalEvidenceItem[];
  }

  return [
    {
      id: `internal-fallback:${word.id}`,
      page_number: word.page_number,
      context_snippet: word.context_snippet,
      reference_link: word.reference_link,
      source_title: word.source_title,
      extraction_method: word.extraction_method,
      source_warning: word.source_warning ?? null,
    },
  ] satisfies WordInternalEvidenceItem[];
}

function buildFallbackTrustedExternalEvidenceItems(word: WordEvidenceSummary | null | undefined) {
  if (
    !word ||
    (!isTrustedExternalWord(word) &&
      !word.provider_display_name &&
      !word.match_type &&
      !word.matched_form &&
      !word.reference_link)
  ) {
    return [] as WordTrustedExternalEvidenceItem[];
  }

  return [
    {
      id: `trusted-external-fallback:${word.id}`,
      provider_display_name: word.provider_display_name,
      source_title: word.source_title,
      snippet: word.context_snippet,
      matched_form: word.matched_form ?? word.display_word,
      reference_link: word.reference_link,
      match_type: word.match_type,
      match_score: word.match_score,
      source_warning: word.source_warning ?? null,
      warning_message: null,
    },
  ] satisfies WordTrustedExternalEvidenceItem[];
}

export function WordDetailDrawer({ word, open, onOpenChange }: WordDetailDrawerProps) {
  const { href, locale, messages } = useI18n();
  const detailQuery = useWordEvidence(
    {
      id: word ? String(word.id) : null,
      sourceType: word?.source_type ?? null,
      sourceId: word?.source_id ? String(word.source_id) : null,
      normalizedForm: word?.normalized_form ?? null,
      q: word?.display_word ?? null,
    },
    open && Boolean(word),
  );
  const effectiveWord = detailQuery.data && word ? { ...word, ...detailQuery.data } : detailQuery.data ?? word;
  const checkQuery = useWordCheck(
    effectiveWord?.normalized_form ?? effectiveWord?.display_word ?? "",
    open && Boolean(effectiveWord),
  );
  const morphologyQuery = useWordMorphology(
    {
      id: word ? String(word.id) : null,
      sourceType: word?.source_type ?? null,
      sourceId: word?.source_id ? String(word.source_id) : null,
      normalizedForm: word?.normalized_form ?? null,
      q: word?.display_word ?? null,
    },
    open && Boolean(word),
  );
  const sourceHref = effectiveWord ? getWordSearchResultHref(effectiveWord) : null;
  const lexemeHref = effectiveWord ? getWordLexemeHref(effectiveWord) : null;
  const externalSourceLink = effectiveWord ? isWordResultExternalLink(effectiveWord) : false;
  const isTrustedExternal = effectiveWord ? isTrustedExternalWord(effectiveWord) : false;
  const morphologySummary = effectiveWord?.morphology ?? null;
  const morphologyDetail = morphologyQuery.data;
  const snippetHighlightTerms = effectiveWord
    ? [effectiveWord.display_word, effectiveWord.normalized_form ?? ""]
    : [];
  const internalEvidenceItems =
    detailQuery.data?.internal_evidence_items?.length
      ? detailQuery.data.internal_evidence_items
      : detailQuery.data?.evidence_items?.length
        ? detailQuery.data.evidence_items
        : buildFallbackInternalEvidenceItems(effectiveWord);
  const trustedExternalEvidenceItems = detailQuery.data?.trusted_external_evidence_items?.length
    ? detailQuery.data.trusted_external_evidence_items
    : buildFallbackTrustedExternalEvidenceItems(effectiveWord);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-xl" side="right">
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <SheetTitle>{effectiveWord?.display_word ?? messages.words.detail.title}</SheetTitle>
          <SheetDescription>{messages.words.detail.description}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          {!word ? null : detailQuery.isLoading && !detailQuery.data ? (
            <div className="space-y-4 px-6 py-5">
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-40 rounded-md" />
              <Skeleton className="h-32 rounded-md" />
            </div>
          ) : detailQuery.error && !effectiveWord ? (
            <div className="px-6 py-5">
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {detailQuery.error.message}
              </div>
            </div>
          ) : effectiveWord ? (
            <div className="space-y-4 px-6 py-5">
              {detailQuery.error ? (
                <div className="rounded-md border border-amber-300/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                  {detailQuery.error.message}
                </div>
              ) : null}

              <DetailSection title={messages.words.detail.summaryTitle}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{getWordSourceTypeLabel(effectiveWord.source_type, messages)}</Badge>
                  {effectiveWord.provider_display_name ? (
                    <Badge className="border-orange-200 bg-orange-50 text-orange-700" variant="outline">
                      {effectiveWord.provider_display_name}
                    </Badge>
                  ) : null}
                  {effectiveWord.page_number != null && !isTrustedExternal ? (
                    <Badge variant="outline">
                      {messages.words.labels.page}: {effectiveWord.page_number}
                    </Badge>
                  ) : null}
                  {effectiveWord.is_suspicious ? (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
                      {messages.words.badges.suspicious}
                    </Badge>
                  ) : null}
                  {effectiveWord.match_status === "matched" ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
                      {messages.words.badges.referenceMatched}
                    </Badge>
                  ) : null}
                  {effectiveWord.match_type ? (
                    <Badge className={getWordMatchTypeClassName(effectiveWord.match_type)} variant="outline">
                      {getWordMatchTypeLabel(effectiveWord.match_type, messages)}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p className="[overflow-wrap:anywhere]">
                    <span className="font-medium text-foreground">{messages.words.labels.normalizedForm}</span>
                    {": "}
                    {effectiveWord.normalized_form || "—"}
                  </p>
                  <p className="[overflow-wrap:anywhere]">
                    <span className="font-medium text-foreground">{messages.words.labels.source}</span>
                    {": "}
                    {effectiveWord.source_title || "—"}
                  </p>
                  <p className="[overflow-wrap:anywhere]">
                    <span className="font-medium text-foreground">{messages.words.labels.canonicalForm}</span>
                    {": "}
                    {effectiveWord.canonical_form || "—"}
                  </p>
                  <p className="[overflow-wrap:anywhere]">
                    <span className="font-medium text-foreground">{messages.words.labels.linkedLexeme}</span>
                    {": "}
                    {effectiveWord.linked_lexeme?.canonical_form ?? messages.words.labels.unlinked}
                  </p>
                  {effectiveWord.provider_display_name ? (
                    <p className="[overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground">{messages.words.labels.provider}</span>
                      {": "}
                      {effectiveWord.provider_display_name}
                    </p>
                  ) : null}
                  {effectiveWord.matched_form ? (
                    <p className="[overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground">{messages.words.labels.matchedForm}</span>
                      {": "}
                      {effectiveWord.matched_form}
                    </p>
                  ) : null}
                  {effectiveWord.match_score != null ? (
                    <p>
                      <span className="font-medium text-foreground">{messages.words.labels.matchScore}</span>
                      {": "}
                      {effectiveWord.match_score.toLocaleString(locale)}
                    </p>
                  ) : null}
                </div>
              </DetailSection>

              <DetailSection
                description={messages.words.detail.internalEvidenceDescription}
                title={messages.words.detail.internalEvidenceTitle}
              >
                {internalEvidenceItems.length ? (
                  <div className="space-y-3">
                    {internalEvidenceItems.map((item, index) => (
                      <div
                        className="space-y-2 rounded-md border border-border/70 bg-background/70 p-3"
                        key={item.id ?? `${item.page_number}-${index}`}
                      >
                        {item.source_title ? (
                          <p className="text-sm font-medium [overflow-wrap:anywhere]">{item.source_title}</p>
                        ) : null}
                        {item.page_number != null ? (
                          <p className="text-sm text-muted-foreground">
                            {messages.words.labels.page}: {item.page_number}
                          </p>
                        ) : null}
                        <p className="text-sm leading-6 text-foreground/90">
                          {item.context_snippet
                            ? highlightSnippet(item.context_snippet, snippetHighlightTerms)
                            : messages.words.emptyStates.noContext}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {item.extraction_method ? (
                            <Badge variant="outline">{formatReferenceImportMethod(item.extraction_method)}</Badge>
                          ) : null}
                          {item.source_warning ? (
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
                              {item.source_warning}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{messages.words.detail.noInternalEvidence}</p>
                )}
              </DetailSection>

              <DetailSection
                description={messages.words.detail.trustedExternalDescription}
                title={messages.words.detail.trustedExternalTitle}
              >
                {trustedExternalEvidenceItems.length ? (
                  <div className="space-y-3">
                    {trustedExternalEvidenceItems.map((item, index) => (
                      <div
                        className="space-y-3 rounded-md border border-orange-200/80 bg-orange-50/50 p-3"
                        key={item.id ?? `${item.provider_display_name ?? "provider"}-${index}`}
                      >
                        <div className="flex flex-wrap gap-2">
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
                          {item.source_warning || item.warning_message ? (
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
                              {item.warning_message ?? item.source_warning}
                            </Badge>
                          ) : null}
                        </div>

                        {item.source_title ? (
                          <p className="text-sm font-medium [overflow-wrap:anywhere]">{item.source_title}</p>
                        ) : null}

                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <p className="[overflow-wrap:anywhere]">
                            <span className="font-medium text-foreground">{messages.words.labels.provider}</span>
                            {": "}
                            {item.provider_display_name || "—"}
                          </p>
                          <p className="[overflow-wrap:anywhere]">
                            <span className="font-medium text-foreground">{messages.words.labels.matchedForm}</span>
                            {": "}
                            {item.matched_form || effectiveWord.display_word}
                          </p>
                          {item.match_score != null ? (
                            <p>
                              <span className="font-medium text-foreground">{messages.words.labels.matchScore}</span>
                              {": "}
                              {item.match_score.toLocaleString(locale)}
                            </p>
                          ) : null}
                        </div>

                        <p className="text-sm leading-6 text-foreground/90">
                          {item.snippet
                            ? highlightSnippet(item.snippet, snippetHighlightTerms)
                            : messages.words.emptyStates.noContext}
                        </p>

                        {item.reference_link ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={item.reference_link} rel="noopener noreferrer" target="_blank">
                              {messages.words.actions.openSource}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{messages.words.detail.noTrustedExternalEvidence}</p>
                )}
              </DetailSection>

              <DetailSection title={messages.words.detail.lexiconTitle}>
                {checkQuery.isLoading ? (
                  <Skeleton className="h-20 rounded-md" />
                ) : checkQuery.error ? (
                  <p className="text-sm text-muted-foreground">{checkQuery.error.message}</p>
                ) : checkQuery.data ? (
                  <div className="space-y-3 text-sm">
                    <p>
                      <span className="font-medium text-foreground">{messages.words.check.existsLabel}</span>
                      {": "}
                      {checkQuery.data.exists_in_lexicon ? messages.common.yes : messages.common.no}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">{messages.words.check.lexemeCount}</span>
                      {": "}
                      {checkQuery.data.matching_lexeme_count}
                    </p>
                    {checkQuery.data.matching_lexemes.length ? (
                      <div className="flex flex-wrap gap-2">
                        {checkQuery.data.matching_lexemes.map((lexeme) => (
                          <Badge key={lexeme.id} variant="outline">
                            {lexeme.canonical_form}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{messages.words.check.empty}</p>
                )}
              </DetailSection>

              <DetailSection title={messages.words.detail.referenceTitle}>
                {effectiveWord.reference_match?.has_match ? (
                  <div className="space-y-2 text-sm">
                    <p className="[overflow-wrap:anywhere]">
                      <span className="font-medium text-foreground">{messages.words.labels.referenceMatch}</span>
                      {": "}
                      {[effectiveWord.reference_match.source_name, effectiveWord.reference_match.matched_form]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {effectiveWord.reference_match.match_type ? (
                      <p>
                        <span className="font-medium text-foreground">{messages.words.labels.matchType}</span>
                        {": "}
                        {getWordMatchTypeLabel(effectiveWord.reference_match.match_type, messages)}
                      </p>
                    ) : null}
                    {effectiveWord.reference_match.source_import_method ? (
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {formatReferenceImportMethod(effectiveWord.reference_match.source_import_method)}
                        </Badge>
                        {isOcrReferenceImportMethod(effectiveWord.reference_match.source_import_method) ? (
                          <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                            {messages.reference.badges.ocrSource}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{messages.words.detail.noReferenceMatch}</p>
                )}
              </DetailSection>

              <DetailSection title={messages.words.detail.morphologyTitle}>
                {morphologyQuery.isLoading && !morphologySummary && !morphologyDetail ? (
                  <Skeleton className="h-20 rounded-md" />
                ) : morphologySummary || morphologyDetail ? (
                  <div className="space-y-3 text-sm">
                    {morphologySummary ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {messages.morphology.labels.available}:{" "}
                            {morphologySummary.available ? messages.common.yes : messages.common.no}
                          </Badge>
                          {morphologySummary.status ? (
                            <Badge variant="outline">
                              {formatMorphologyStatus(morphologySummary.status, messages)}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="[overflow-wrap:anywhere]">
                          <span className="font-medium text-foreground">{messages.morphology.labels.bestLemma}</span>
                          {": "}
                          {morphologySummary.best_lemma || "—"}
                        </p>

                        {morphologySummary.lemma_candidates.length ? (
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">{messages.morphology.labels.lemmaCandidates}</p>
                            <div className="flex flex-wrap gap-2">
                              {morphologySummary.lemma_candidates.map((candidate) => (
                                <Badge key={candidate} variant="outline">
                                  {candidate}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {morphologySummary.pos_candidates.length ? (
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">{messages.morphology.labels.posCandidates}</p>
                            <div className="flex flex-wrap gap-2">
                              {morphologySummary.pos_candidates.map((candidate) => (
                                <Badge key={candidate} variant="outline">
                                  {candidate}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {morphologyDetail ? (
                      <>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <MorphologyMetric
                            label={messages.morphology.labels.analyzedOccurrenceCount}
                            value={morphologyDetail.analyzed_occurrence_count}
                          />
                          <MorphologyMetric
                            label={messages.morphology.labels.completedCount}
                            value={morphologyDetail.completed_count}
                          />
                          <MorphologyMetric
                            label={messages.morphology.labels.skippedCount}
                            value={morphologyDetail.skipped_count}
                          />
                          <MorphologyMetric
                            label={messages.morphology.labels.failedCount}
                            value={morphologyDetail.failed_count}
                          />
                        </div>

                        <MorphologyDistribution
                          items={morphologyDetail.lemma_candidates}
                          title={messages.morphology.labels.lemmaDistribution}
                        />
                        <MorphologyDistribution
                          items={morphologyDetail.pos_distribution}
                          title={messages.morphology.labels.posDistribution}
                        />

                        {Object.entries(morphologyDetail.morph_feature_summaries).length ? (
                          <div className="space-y-3">
                            <p className="font-medium text-foreground">
                              {messages.morphology.labels.morphFeatureSummaries}
                            </p>
                            <div className="space-y-3">
                              {Object.entries(morphologyDetail.morph_feature_summaries).map(
                                ([featureName, items]) => (
                                  <MorphologyDistribution
                                    items={items}
                                    key={featureName}
                                    title={featureName}
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {!morphologyDetail &&
                    (!morphologySummary ||
                      (!morphologySummary.available &&
                        !morphologySummary.best_lemma &&
                        !morphologySummary.lemma_candidates.length &&
                        !morphologySummary.pos_candidates.length)) ? (
                      <p className="text-muted-foreground">
                        {getMorphologyEmptyLabel(morphologySummary, messages)}
                      </p>
                    ) : null}
                  </div>
                ) : morphologyQuery.error ? (
                  <p className="text-sm text-muted-foreground">{morphologyQuery.error.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {getMorphologyEmptyLabel(null, messages)}
                  </p>
                )}
              </DetailSection>
            </div>
          ) : null}
        </ScrollArea>

        <SheetFooter className="border-t border-border/70 px-6 py-4">
          {sourceHref ? (
            externalSourceLink ? (
              <Button asChild variant="outline">
                <a href={effectiveWord?.reference_link ?? sourceHref} rel="noopener noreferrer" target="_blank">
                  {messages.words.actions.openSourceContext}
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={href(sourceHref)}>{messages.words.actions.openSource}</Link>
              </Button>
            )
          ) : null}
          {lexemeHref ? (
            <Button asChild variant="outline">
              <Link href={href(lexemeHref)}>{messages.words.actions.openLexeme}</Link>
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
