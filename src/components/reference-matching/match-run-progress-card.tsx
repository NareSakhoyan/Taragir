"use client";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { JobProgressBar, normalizeProgressPercent } from "@/components/jobs/job-progress-bar";
import { JobStageTimeline } from "@/components/jobs/job-stage-timeline";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceMatchingRunDetail, StageEvent } from "@/lib/types/api";
import { formatDate, formatNumber } from "@/lib/utils/format";

type MatchRunProgressCardProps = {
  run: ReferenceMatchingRunDetail;
  events?: StageEvent[];
};

type Messages = ReturnType<typeof useI18n>["messages"];

function resolveStageLabel(
  run: ReferenceMatchingRunDetail,
  messages: Messages,
) {
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

function resolveStageMessage(
  run: ReferenceMatchingRunDetail,
  messages: Messages,
) {
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

export function MatchRunProgressCard({
  run,
  events = [],
}: MatchRunProgressCardProps) {
  const { locale, messages } = useI18n();
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

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border/80 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{messages.referenceMatching.table.scope}</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {messages.referenceMatching.scope[run.run_scope]}
            </h2>
            <p className="text-sm text-muted-foreground">{formatDate(run.created_at, locale)}</p>
          </div>

          <DocumentStatusBadge status={run.status} />
        </div>

        <div className="space-y-6 pt-6">
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

          {isActive && events.length ? <JobStageTimeline events={events} /> : null}

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

    </div>
  );
}
