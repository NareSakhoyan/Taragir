"use client";

import { WordResultCard } from "@/components/words/word-result-card";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { WordEvidenceSummary, WordSearchCategory } from "@/lib/types/api";
import { getWordCategoryLabel } from "@/lib/utils/words";

type WordSearchResultsGroupProps = {
  category: WordSearchCategory;
  items: WordEvidenceSummary[];
  total: number;
  onViewDetails: (item: WordEvidenceSummary) => void;
  emptyLabel: string;
};

export function WordSearchResultsGroup({
  category,
  items,
  total,
  onViewDetails,
  emptyLabel,
}: WordSearchResultsGroupProps) {
  const { locale, messages } = useI18n();

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {getWordCategoryLabel(category, messages)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {messages.words.groupCount.replace("{count}", total.toLocaleString(locale))}
          </p>
        </div>
      </div>

      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <WordResultCard
              item={item}
              key={`${category}:${item.id}:${item.source_type}:${item.source_id ?? "unknown"}:${item.page_number ?? "na"}:${item.normalized_form ?? item.display_word}:${index}`}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-border/80 bg-muted/10 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        </div>
      )}
    </section>
  );
}
