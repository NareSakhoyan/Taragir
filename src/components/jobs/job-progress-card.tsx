"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { JobErrorCard } from "@/components/jobs/job-error-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { IngestionJobRead } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate } from "@/lib/utils/format";

type JobProgressCardProps = {
  job: IngestionJobRead;
  onRetry?: () => void;
  isRetrying?: boolean;
};

export function JobProgressCard({ job, onRetry, isRetrying = false }: JobProgressCardProps) {
  const { href, locale, messages } = useI18n();

  return (
    <section className="w-full">
      <header className="mb-8 border-b border-border/70 pb-6">
        <h2 className="text-xl font-semibold tracking-tight">{messages.job.cardTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{messages.job.cardDescription}</p>
      </header>

      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <DocumentStatusBadge status={job.status} />
          <span className="text-sm text-muted-foreground">
            {messages.job.step}: {job.step ?? messages.job.pending}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{messages.job.progress}</span>
            <span className="font-semibold">{job.progress_percent}%</span>
          </div>
          <Progress value={job.progress_percent} />
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">{messages.job.created}</p>
            <p className="font-medium">{formatDate(job.created_at, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{messages.job.started}</p>
            <p className="font-medium">{formatDate(job.started_at, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{messages.job.finished}</p>
            <p className="font-medium">{formatDate(job.finished_at, locale)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">{messages.job.document}</p>
            <Link
              className="inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
              href={href(`${ROUTES.documents}/${job.document_id}?jobId=${job.id}`)}
            >
              {messages.job.openDocument}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {job.retry_of_job_id ? (
            <div>
              <p className="text-sm text-muted-foreground">{messages.job.retryOf}</p>
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                href={href(`${ROUTES.jobs}/${job.retry_of_job_id}`)}
              >
                {messages.job.openPreviousAttempt}
              </Link>
            </div>
          ) : null}
        </div>

        {job.status === "failed" ? (
          <JobErrorCard
            canRetry={job.can_retry}
            errorMessageUser={job.error_message_user}
            isRetrying={isRetrying}
            lastRetriedAt={job.last_retried_at}
            nextSteps={job.next_steps}
            onRetry={onRetry}
            retryCount={job.retry_count}
          />
        ) : null}

        {job.status === "completed" ? (
          <Link href={href(`${ROUTES.documents}/${job.document_id}?jobId=${job.id}`)}>
            <Button>
              {messages.job.openDocument}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
