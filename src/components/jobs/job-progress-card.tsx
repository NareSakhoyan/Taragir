"use client";

import Link from "next/link";
import { ArrowRight, Play, UserCircle } from "lucide-react";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { JobErrorCard } from "@/components/jobs/job-error-card";
import { JobProgressBar, normalizeProgressPercent } from "@/components/jobs/job-progress-bar";
import { JobStageTimeline } from "@/components/jobs/job-stage-timeline";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { IngestionJobRead, StageEvent } from "@/lib/types/api";
import { formatJobKind, resolveJobResultAction, resolveJobStageLabel, resolveJobStageMessage } from "@/lib/utils/jobs";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatNumber } from "@/lib/utils/format";

type JobProgressCardProps = {
  job: IngestionJobRead;
  events?: StageEvent[];
  onRetry?: () => void;
  onResume?: () => void;
  isRetrying?: boolean;
  isResuming?: boolean;
  showCompletedResult?: boolean;
};

function resolveCounterText(
  job: IngestionJobRead,
  locale: ReturnType<typeof useI18n>["locale"],
  messages: ReturnType<typeof useI18n>["messages"],
) {
  if (job.items_processed == null || job.items_total == null) {
    return null;
  }

  return messages.job.itemsProgress
    .replace("{processed}", formatNumber(job.items_processed, locale))
    .replace("{total}", formatNumber(job.items_total, locale));
}

function resolveOwnerLabel(job: IngestionJobRead) {
  if (job.owner_display_name?.trim()) {
    return job.owner_display_name;
  }

  if (job.owner_email?.trim()) {
    return job.owner_email;
  }

  return job.user_id ? `User ${job.user_id.slice(0, 8)}` : null;
}

export function JobProgressCard({
  job,
  events = [],
  onRetry,
  onResume,
  isRetrying = false,
  isResuming = false,
  showCompletedResult = true,
}: JobProgressCardProps) {
  const { href, locale, messages } = useI18n();
  const stageLabel = resolveJobStageLabel(job, messages);
  const stageMessage = resolveJobStageMessage(job, messages);
  const counterText = resolveCounterText(job, locale, messages);
  const progressPercent = normalizeProgressPercent(
    job.progress_percent,
    job.status === "completed" ? 100 : 0,
  );
  const isActive = job.status === "queued" || job.status === "running";
  const isRecoveredStaleJob = job.status === "failed" && job.error_code === "job_stale_no_progress";
  const resultAction = resolveJobResultAction(job, messages.job);
  const jobDocumentHref = job.document_id ? `${ROUTES.documents}/${job.document_id}?jobId=${job.id}` : null;
  const ownerLabel = resolveOwnerLabel(job);
  const resumeLabel =
    job.resume_from_page != null
      ? messages.job.resumeFromPage.replace("{page}", formatNumber(job.resume_from_page, locale))
      : messages.job.resumeProcessing;

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border/80 bg-card/80 p-6 shadow-sm">
        <header className="border-b border-border/70 pb-5">
          <h2 className="text-xl font-semibold tracking-tight">{messages.job.cardTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{messages.job.cardDescription}</p>
        </header>

        <div className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <DocumentStatusBadge status={job.status} />
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              {formatJobKind(job.job_kind, messages.job)}
            </span>
            {ownerLabel ? (
              <span
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
                title={job.owner_email ?? job.user_id}
              >
                <UserCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{ownerLabel}</span>
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{messages.job.currentStage}</p>
            <h3 className="text-2xl font-semibold tracking-tight">{stageLabel}</h3>
            <p className="max-w-3xl text-sm text-muted-foreground">{stageMessage}</p>
          </div>

          <JobProgressBar
            counterText={counterText}
            label={messages.job.progress}
            percent={progressPercent}
          />

          {job.is_stale ? (
            <div className="rounded-md border border-amber-300 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">{messages.job.staleWarningTitle}</p>
              <p className="mt-1">{messages.job.staleWarningDescription}</p>
              {job.last_progress_at ? (
                <p className="mt-2 text-xs text-amber-900/90">
                  {messages.job.lastProgressAt.replace(
                    "{time}",
                    formatDate(job.last_progress_at, locale),
                  )}
                </p>
              ) : null}
              {job.can_resume && onResume ? (
                <Button
                  className="mt-3"
                  disabled={isResuming}
                  onClick={onResume}
                  type="button"
                  variant="outline"
                >
                  <Play className="h-4 w-4" />
                  {isResuming ? messages.job.resuming : resumeLabel}
                </Button>
              ) : null}
            </div>
          ) : null}

          {isRecoveredStaleJob ? (
            <div className="rounded-md border border-sky-300 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <p className="font-medium">{messages.job.recoveryNoteTitle}</p>
              {job.stale_detected_at ? (
                <p className="mt-1">
                  {messages.job.staleDetectedAt.replace(
                    "{time}",
                    formatDate(job.stale_detected_at, locale),
                  )}
                </p>
              ) : null}
              {job.recovery_note ? <p className="mt-2">{job.recovery_note}</p> : null}
              {job.latest_retry_job_id ? (
                <Link
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sky-900 underline-offset-4 hover:underline"
                  href={href(`${ROUTES.jobs}/${job.latest_retry_job_id}`)}
                >
                  {messages.job.retryStartedDescription}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          ) : null}

          {isActive && events.length ? <JobStageTimeline events={events} /> : null}

          {isActive ? (
            <div className="rounded-md border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {messages.job.leaveAndComeBack}
            </div>
          ) : null}

          <div className="grid gap-4 border-t border-border/70 pt-6 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">{messages.job.created}</p>
              <p className="mt-2 font-medium">{formatDate(job.created_at, locale)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{messages.job.started}</p>
              <p className="mt-2 font-medium">{formatDate(job.started_at, locale)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{messages.job.finished}</p>
              <p className="mt-2 font-medium">{formatDate(job.finished_at, locale)}</p>
            </div>
            {jobDocumentHref ? (
              <div>
                <p className="text-sm text-muted-foreground">{messages.job.document}</p>
                <Link
                  className="mt-2 inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                  href={href(jobDocumentHref)}
                >
                  {messages.job.openDocument}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
            {job.retry_of_job_id ? (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">{messages.job.retryOf}</p>
                <Link
                  className="mt-2 inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                  href={href(`${ROUTES.jobs}/${job.retry_of_job_id}`)}
                >
                  {messages.job.openPreviousAttempt}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
            {job.resume_of_job_id ? (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">{messages.job.resumeOf}</p>
                <Link
                  className="mt-2 inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                  href={href(`${ROUTES.jobs}/${job.resume_of_job_id}`)}
                >
                  {messages.job.openPreviousAttempt}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {job.status === "failed" ? (
        <JobErrorCard
          canResume={job.can_resume}
          canRetry={job.can_retry}
          errorMessageUser={job.error_message_user}
          isResuming={isResuming}
          isRetrying={isRetrying}
          lastRetriedAt={job.last_retried_at}
          nextSteps={job.next_steps}
          onResume={onResume}
          onRetry={onRetry}
          resumeFromPage={job.resume_from_page}
          retryCount={job.retry_count}
        />
      ) : null}

      {showCompletedResult && job.status === "completed" && resultAction ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-900">{messages.job.resultReady}</p>
          <p className="mt-1 text-sm text-emerald-800">{messages.job.completedResultDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2">
              <Link className="inline-flex" href={href(resultAction.href)}>
                <Button>
                  {resultAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {"secondaryHref" in resultAction && resultAction.secondaryHref ? (
                <Link className="inline-flex" href={href(resultAction.secondaryHref)}>
                  <Button type="button" variant="outline">
                    {resultAction.secondaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
