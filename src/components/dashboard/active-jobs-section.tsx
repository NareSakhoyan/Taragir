"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { normalizeProgressPercent } from "@/components/jobs/job-progress-bar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/lib/hooks/use-job";
import { useI18n } from "@/lib/i18n/use-i18n";
import { formatJobKind, resolveJobStageLabel } from "@/lib/utils/jobs";
import { JOB_ACTIVE_STATUSES, ROUTES } from "@/lib/utils/constants";

export function ActiveJobsSection() {
  const { href, messages } = useI18n();
  const jobsQuery = useJobs({ limit: 12, offset: 0 });
  const activeJobs = (jobsQuery.data ?? []).filter((job) => JOB_ACTIVE_STATUSES.has(job.status));

  if (jobsQuery.isLoading) {
    return <Skeleton className="h-40" />;
  }

  if (!activeJobs.length) {
    return null;
  }

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <SectionHeader
        description={messages.job.ongoingJobsDescription}
        title={messages.job.ongoingJobsTitle}
        viewAllHref={href(ROUTES.jobs)}
        viewAllLabel={messages.job.pageTitle}
      />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {activeJobs.slice(0, 4).map((job) => {
          const progressPercent = normalizeProgressPercent(
            job.progress_percent,
            job.status === "completed" ? 100 : 0,
          );

          return (
            <Link
              className="block rounded-md border border-border/70 bg-background/70 p-4 transition-colors hover:border-primary/40 hover:bg-background"
              href={href(`${ROUTES.jobs}/${job.id}`)}
              key={job.id}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {formatJobKind(job.job_kind, messages.job)}
                </p>
                <p className="mt-1 text-sm font-semibold">{resolveJobStageLabel(job, messages)}</p>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <DocumentStatusBadge status={job.status} />
                <JobProgressInline progressPercent={progressPercent} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  description,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  description: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Link className="inline-flex items-center gap-1 text-sm font-medium text-primary" href={viewAllHref}>
        {viewAllLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function JobProgressInline({ progressPercent }: { progressPercent: number }) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <Progress className="h-2" value={progressPercent} />
      <span className="w-12 shrink-0 text-right text-xs font-medium text-muted-foreground">
        {Math.round(progressPercent)}%
      </span>
    </div>
  );
}
