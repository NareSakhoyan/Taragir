"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { MorphologySummary } from "@/lib/types/api";
import {
  formatMorphologyStatus,
  getMorphologyEmptyLabel,
} from "@/lib/utils/morphology";

type MorphologySummaryCardProps = {
  title: string;
  description: string;
  summary: MorphologySummary;
};

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const { locale } = useI18n();

  return (
    <div className="rounded-md border border-border/70 bg-muted/10 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value == null ? "—" : value.toLocaleString(locale)}</p>
    </div>
  );
}

export function MorphologySummaryCard({
  title,
  description,
  summary,
}: MorphologySummaryCardProps) {
  const { messages } = useI18n();
  const hasCounters = [
    summary.analyzed_occurrence_count,
    summary.completed_count,
    summary.skipped_count,
    summary.failed_count,
    summary.distinct_lemma_count,
  ].some((value) => value != null);

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <div className="space-y-1 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          {summary.status ? (
            <Badge variant="outline">{formatMorphologyStatus(summary.status, messages)}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {messages.morphology.labels.available}: {summary.is_available ? messages.common.yes : messages.common.no}
          </Badge>
          <Badge variant="outline">
            {messages.morphology.labels.eligible}: {summary.is_eligible ? messages.common.yes : messages.common.no}
          </Badge>
        </div>

        {hasCounters ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryMetric
              label={messages.morphology.labels.analyzedOccurrenceCount}
              value={summary.analyzed_occurrence_count}
            />
            <SummaryMetric
              label={messages.morphology.labels.completedCount}
              value={summary.completed_count}
            />
            <SummaryMetric
              label={messages.morphology.labels.skippedCount}
              value={summary.skipped_count}
            />
            <SummaryMetric
              label={messages.morphology.labels.failedCount}
              value={summary.failed_count}
            />
            <SummaryMetric
              label={messages.morphology.labels.distinctLemmaCount}
              value={summary.distinct_lemma_count}
            />
          </div>
        ) : !summary.is_available ? (
          <p className="text-sm text-muted-foreground">{getMorphologyEmptyLabel(summary, messages)}</p>
        ) : null}
      </div>
    </section>
  );
}
