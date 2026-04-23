"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { RecentJobsPanel } from "@/components/jobs/recent-jobs-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/lib/hooks/use-job";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function JobsPage() {
  const { messages } = useI18n();
  const jobsQuery = useJobs({
    limit: 30,
    offset: 0,
  });

  return (
    <AuthGuard>
      <AppShell
        description={messages.job.backgroundWorkDescription}
        title={messages.job.backgroundWorkTitle}
      >
        {jobsQuery.isLoading ? (
          <Skeleton className="h-[24rem]" />
        ) : jobsQuery.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
            {jobsQuery.error.message}
          </div>
        ) : (
          <RecentJobsPanel jobs={jobsQuery.data ?? []} />
        )}
      </AppShell>
    </AuthGuard>
  );
}
