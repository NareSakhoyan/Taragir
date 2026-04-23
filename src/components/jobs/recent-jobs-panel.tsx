"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { JobRead } from "@/lib/types/api";
import { normalizeProgressPercent } from "@/components/jobs/job-progress-bar";
import { resolveJobStageLabel, formatJobKind } from "@/lib/utils/jobs";
import { ROUTES } from "@/lib/utils/constants";

type RecentJobsPanelProps = {
  jobs: JobRead[] | null | undefined;
  compact?: boolean;
};

function sortByNewest(jobs: JobRead[]) {
  return [...jobs].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    return rightTime - leftTime;
  });
}

function JobListSection({
  title,
  description,
  jobs,
  compact = false,
}: {
  title: string;
  description: string;
  jobs: JobRead[];
  compact?: boolean;
}) {
  const { href, messages } = useI18n();

  if (!jobs.length) {
    return (
      <section className="rounded-md border border-dashed border-border/80 bg-muted/10 px-4 py-6">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <p className="mt-4 text-sm text-muted-foreground">{messages.job.recentJobsEmpty}</p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-4 shadow-sm">
      <div className="border-b border-border/70 pb-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mt-4 space-y-3">
        {jobs.map((job) => {
          const progressPercent = normalizeProgressPercent(
            job.progress_percent,
            job.status === "completed" ? 100 : 0,
          );

          return (
            <Link
              className="block rounded-md border border-border/70 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-background"
              href={href(`${ROUTES.jobs}/${job.id}`)}
              key={job.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {formatJobKind(job.job_kind, messages.job)}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {resolveJobStageLabel(job, messages)}
                  </p>
                </div>
                <DocumentStatusBadge status={job.status} />
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Progress className="h-2" value={progressPercent} />
                <span className="w-12 shrink-0 text-right text-xs font-medium text-muted-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>

              {!compact ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-muted-foreground">
                    {job.current_stage_label ?? messages.job.currentStage}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    {messages.job.openJob}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RecentJobsPanel({ jobs, compact = false }: RecentJobsPanelProps) {
  const { messages } = useI18n();

  if (jobs == null) {
    return null;
  }

  const sortedJobs = sortByNewest(jobs);
  const ongoingJobs = sortedJobs.filter((job) => job.status === "queued" || job.status === "running");
  const failedJobs = sortedJobs.filter((job) => job.status === "failed");

  if (compact) {
    const compactJobs = (ongoingJobs.length ? ongoingJobs : sortedJobs).slice(0, 3);

    if (!compactJobs.length) {
      return null;
    }

    return (
      <JobListSection
        compact
        description={messages.job.backgroundWorkDescription}
        jobs={compactJobs}
        title={messages.job.backgroundWorkTitle}
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <JobListSection
        description={messages.job.ongoingJobsDescription}
        jobs={ongoingJobs.slice(0, 4)}
        title={messages.job.ongoingJobsTitle}
      />
      <JobListSection
        description={messages.job.failedJobsDescription}
        jobs={failedJobs.slice(0, 4)}
        title={messages.job.failedJobsTitle}
      />
      <JobListSection
        description={messages.job.recentJobsDescription}
        jobs={sortedJobs.slice(0, 6)}
        title={messages.job.recentJobsTitle}
      />
    </div>
  );
}
