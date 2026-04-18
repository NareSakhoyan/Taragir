"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { AuthGuard } from "@/components/auth/auth-guard";
import { JobProgressCard } from "@/components/jobs/job-progress-card";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useJob, useRetryJob } from "@/lib/hooks/use-job";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

export default function JobDetailPage() {
  const params = useParams<{ locale: string; jobId: string }>();
  const router = useRouter();
  const { href, messages } = useI18n();
  const jobQuery = useJob(params.jobId);
  const retryMutation = useRetryJob();

  async function handleRetry() {
    try {
      const result = await retryMutation.mutateAsync(params.jobId);
      toast.success(messages.job.retryStartedTitle, {
        description: result.message || messages.job.retryStartedDescription,
      });

      if (result.job.id) {
        router.push(href(`${ROUTES.jobs}/${result.job.id}`));
      }
    } catch (error) {
      toast.error(messages.job.retryFailedTitle, {
        description: error instanceof Error ? error.message : undefined,
      });
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
            isRetrying={retryMutation.isPending}
            job={jobQuery.data}
            onRetry={jobQuery.data.can_retry ? handleRetry : undefined}
          />
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}
