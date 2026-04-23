"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { JobProgressBar, normalizeProgressPercent } from "@/components/jobs/job-progress-bar";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceImportMethod, ReferenceMatchingRunDetail } from "@/lib/types/api";
import { formatDate, formatNumber, formatReferenceImportMethod } from "@/lib/utils/format";
import { getReferenceMatchingResultSourceHref } from "@/lib/utils/reference-matching";

type RunSummaryCardProps = {
  run: ReferenceMatchingRunDetail;
  source?: {
    id?: string | null;
    title: string | null;
    importMethod: ReferenceImportMethod | null;
    warning: string | null;
    showOcrWarning: boolean;
  } | null;
};

type Messages = ReturnType<typeof useI18n>["messages"];

function resolveStageLabel(run: ReferenceMatchingRunDetail, messages: Messages) {
  if (run.current_stage_label?.trim()) {
    return run.current_stage_label;
  }

  switch (run.status) {
    case "queued":
      return messages.status.queued;
    case "running":
      return messages.status.running;
    case "completed":
      return messages.status.completed;
    case "failed":
      return messages.referenceMatching.detail.errorTitle;
    default:
      return messages.status.pending;
  }
}

function resolveStageMessage(run: ReferenceMatchingRunDetail, messages: Messages) {
  if (run.stage_message_user?.trim()) {
    return run.stage_message_user;
  }

  switch (run.status) {
    case "queued":
      return messages.referenceMatching.detail.queueMessage;
    case "running":
      return messages.referenceMatching.detail.processingMessage;
    case "completed":
      return messages.referenceMatching.detail.completedMessage;
    case "failed":
      return run.error_message?.trim() || messages.referenceMatching.detail.failedMessage;
    default:
      return messages.referenceMatching.detail.processingMessage;
  }
}

function TotalsCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/10 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

export function RunSummaryCard({ run, source = null }: RunSummaryCardProps) {
  const { href, locale, messages } = useI18n();
  const stageLabel = resolveStageLabel(run, messages);
  const stageMessage = resolveStageMessage(run, messages);
  const progressPercent = normalizeProgressPercent(
    run.progress_percent,
    run.status === "completed" ? 100 : 0,
  );
  const counterText =
    run.items_processed != null && run.items_total != null
      ? messages.referenceMatching.detail.itemsCompared
          .replace("{processed}", formatNumber(run.items_processed, locale))
          .replace("{total}", formatNumber(run.items_total, locale))
      : null;
  const isActive = run.status === "queued" || run.status === "running";
  const isCompleted = run.status === "completed";

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{messages.referenceMatching.results.workspaceIntro}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {messages.referenceMatching.scope[run.run_scope]}
            </h2>
            <DocumentStatusBadge status={run.status} />
          </div>
          <p className="text-sm text-muted-foreground">{formatDate(run.created_at, locale)}</p>
        </div>

        {isCompleted ? (
          <div className="flex flex-wrap gap-2">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
              {messages.referenceMatching.results.completedMatched
                .replace("{count}", formatNumber(run.matched_items, locale))}
            </Badge>
            <Badge className="border-border/80 bg-muted/20 text-foreground" variant="outline">
              {messages.referenceMatching.results.completedUnmatched
                .replace("{count}", formatNumber(run.unmatched_items, locale))}
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="space-y-6 pt-6">
        {source ? (
          <section className="rounded-md border border-border/70 bg-muted/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {messages.referenceMatching.sourceLabel}
                </p>
                <p className="text-lg font-semibold tracking-tight">
                  {source.title || messages.referenceMatching.sourceLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {formatReferenceImportMethod(source.importMethod)}
                  </Badge>
                  {source.showOcrWarning ? (
                    <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                      {messages.reference.badges.ocrSource}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {source.id && getReferenceMatchingResultSourceHref(source.id) ? (
                <Link
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  href={href(getReferenceMatchingResultSourceHref(source.id)!)}
                >
                  {messages.referenceMatching.results.openSource}
                </Link>
              ) : null}
            </div>

            {source.warning ? (
              <p className="mt-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">{source.warning}</p>
            ) : null}
          </section>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {messages.referenceMatching.detail.currentStage}
          </p>
          <h3 className="text-2xl font-semibold tracking-tight">{stageLabel}</h3>
          <p className="max-w-3xl text-sm text-muted-foreground">{stageMessage}</p>
        </div>

        <JobProgressBar
          counterText={counterText}
          label={messages.job.progress}
          percent={progressPercent}
        />

        {isActive ? (
          <div className="rounded-md border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {messages.referenceMatching.detail.leaveAndComeBack}
          </div>
        ) : null}

        <div className="grid gap-4 border-t border-border/70 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <TotalsCard
            label={messages.referenceMatching.table.totalItems}
            value={run.total_items == null ? "—" : formatNumber(run.total_items, locale)}
          />
          <TotalsCard
            label={messages.referenceMatching.table.matchedItems}
            value={run.matched_items == null ? "—" : formatNumber(run.matched_items, locale)}
          />
          <TotalsCard
            label={messages.referenceMatching.detail.processedItems}
            value={run.processed_items == null ? "—" : formatNumber(run.processed_items, locale)}
          />
          <TotalsCard
            label={messages.referenceMatching.detail.unmatchedItems}
            value={run.unmatched_items == null ? "—" : formatNumber(run.unmatched_items, locale)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TotalsCard
            label={messages.reference.labels.includeFuzzy}
            value={run.include_fuzzy ? messages.common.yes : messages.common.no}
          />
          <TotalsCard
            label={messages.referenceMatching.table.createdAt}
            value={formatDate(run.created_at, locale)}
          />
          <TotalsCard label={messages.job.started} value={formatDate(run.started_at, locale)} />
          <TotalsCard label={messages.job.finished} value={formatDate(run.finished_at, locale)} />
        </div>

        {run.error_message ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">{messages.referenceMatching.detail.errorTitle}</p>
            <p className="mt-2">{run.error_message}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
