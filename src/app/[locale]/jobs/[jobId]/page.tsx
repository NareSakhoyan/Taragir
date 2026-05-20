"use client";

import { useParams } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";
import { JobProgressCard } from "@/components/jobs/job-progress-card";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobProgress, useRetryJobStart } from "@/lib/hooks/use-job";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

export default function JobDetailPage() {
  const params = useParams<{ locale: string; jobId: string }>();
  const { handleAcceptedStart, handleStartError } = useStartAndRedirect();
  const { messages } = useI18n();
  const { jobQuery, eventsQuery: jobEventsQuery } = useJobProgress(params.jobId);
  const retryMutation = useRetryJobStart();

  async function handleRetry() {
    try {
      const result = await retryMutation.mutateAsync(params.jobId);
      handleAcceptedStart({
        title: messages.job.retryStartedTitle,
        description: result.message || messages.job.retryStartedDescription,
        path: `${ROUTES.jobs}/${result.job.id}`,
      });
    } catch (error) {
      handleStartError(messages.job.retryFailedTitle, error);
    }
  }

  return (
    <AuthGuard>
      <AppShell title={messages.job.pageTitle} description={messages.job.pageDescription}>
        {jobQuery.isLoading ? (
          <Skeleton className="h-[30rem]" />
        ) : jobQuery.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm text-destructive shadow-sm">{jobQuery.error.message}</div>
        ) : jobQuery.data ? (
          <JobProgressCard
            events={jobEventsQuery.data ?? []}
            isRetrying={retryMutation.isPending}
            job={jobQuery.data}
            onRetry={jobQuery.data.can_retry ? handleRetry : undefined}
          />
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
