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
import { useWordCheck, useWordEvidence } from "@/lib/hooks/use-words";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { WordEvidenceSummary } from "@/lib/types/api";
import { formatReferenceImportMethod, isOcrReferenceImportMethod } from "@/lib/utils/format";
import {
  getWordLexemeHref,
  getWordSearchResultHref,
  getWordSourceTypeLabel,
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

export function WordDetailDrawer({ word, open, onOpenChange }: WordDetailDrawerProps) {
  const { href, messages } = useI18n();
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
  const sourceHref = effectiveWord ? getWordSearchResultHref(effectiveWord) : null;
  const lexemeHref = effectiveWord ? getWordLexemeHref(effectiveWord) : null;
  const externalSourceLink = effectiveWord ? isWordResultExternalLink(effectiveWord) : false;
  const snippetHighlightTerms = effectiveWord
    ? [effectiveWord.display_word, effectiveWord.normalized_form ?? ""]
    : [];
  const evidenceItems = detailQuery.data?.evidence_items?.length
    ? detailQuery.data.evidence_items
    : effectiveWord
      ? [
          {
            page_number: effectiveWord.page_number,
            context_snippet: effectiveWord.context_snippet,
            reference_link: effectiveWord.reference_link,
            source_title: effectiveWord.source_title,
            extraction_method: effectiveWord.extraction_method,
            source_warning: effectiveWord.source_warning ?? null,
          },
        ]
      : [];

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
              <DetailSection title={messages.words.detail.summaryTitle}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{getWordSourceTypeLabel(effectiveWord.source_type, messages)}</Badge>
                  {effectiveWord.page_number != null ? (
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
                </div>
              </DetailSection>

              <DetailSection
                description={messages.words.detail.contextDescription}
                title={messages.words.detail.contextTitle}
              >
                <div className="space-y-3">
                  {evidenceItems.map((item, index) => (
                    <div className="space-y-2 rounded-md border border-border/70 bg-background/70 p-3" key={`${item.page_number}-${index}`}>
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
                        {effectiveWord.reference_match.match_type}
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
            </div>
          ) : null}
        </ScrollArea>

        <SheetFooter className="border-t border-border/70 px-6 py-4">
          {sourceHref ? (
            externalSourceLink ? (
              <Button asChild variant="outline">
                <a href={effectiveWord?.reference_link ?? sourceHref} rel="noreferrer" target="_blank">
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
