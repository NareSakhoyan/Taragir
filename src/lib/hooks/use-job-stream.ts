"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { streamJobProgress } from "@/lib/api/job-stream";
import { getJob } from "@/lib/api/jobs";
import { invalidateWorkflowQueries } from "@/lib/hooks/invalidate-curation";
import { jobKeys } from "@/lib/hooks/use-job";
import type { JobRead, StageEvent } from "@/lib/types/api";
import { JOB_ACTIVE_STATUSES } from "@/lib/utils/constants";
import { isAbortError } from "@/lib/utils/abort";
import { invalidateDocumentTrustedExternalQueries } from "@/lib/hooks/use-document-trusted-external";
import { isIngestionJobKind, isTrustedExternalLookupJobKind } from "@/lib/utils/jobs";

type UseJobStreamOptions = {
  enabled?: boolean;
};

function mergeStreamJob(previous: JobRead | undefined, next: JobRead) {
  if (!previous) {
    return next;
  }

  return {
    ...next,
    owner_display_name: next.owner_display_name ?? previous.owner_display_name,
    owner_email: next.owner_email ?? previous.owner_email,
    is_stale: next.is_stale ?? previous.is_stale,
    stale_detected_at: next.stale_detected_at ?? previous.stale_detected_at,
    last_progress_at: next.last_progress_at ?? previous.last_progress_at,
    recovery_note: next.recovery_note ?? previous.recovery_note,
    latest_retry_job_id: next.latest_retry_job_id ?? previous.latest_retry_job_id,
    latest_retry_job_status: next.latest_retry_job_status ?? previous.latest_retry_job_status,
  };
}

export function useJobStream(jobId: string, options?: UseJobStreamOptions) {
  const queryClient = useQueryClient();
  const enabled = Boolean(jobId) && (options?.enabled ?? true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    let events: StageEvent[] = [];

    void streamJobProgress(
      jobId,
      {
        onSnapshot: ({ job, events: snapshotEvents }) => {
          events = snapshotEvents;
          queryClient.setQueryData<JobRead | undefined>(jobKeys.detail(jobId), (previous) =>
            mergeStreamJob(previous, job),
          );
          queryClient.setQueryData(jobKeys.events(jobId), events);
        },
        onJob: (job) => {
          queryClient.setQueryData<JobRead | undefined>(jobKeys.detail(jobId), (previous) =>
            mergeStreamJob(previous, job),
          );
        },
        onEvent: (event) => {
          const exists = events.some((existing) => existing.id === event.id);
          events = exists ? events : [...events, event];
          queryClient.setQueryData(jobKeys.events(jobId), events);
        },
        onDone: () => {
          const job = queryClient.getQueryData<JobRead>(jobKeys.detail(jobId));
          void queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
          void queryClient.invalidateQueries({ queryKey: jobKeys.events(jobId) });
          void queryClient.invalidateQueries({ queryKey: jobKeys.lists() });

          if (job && (job.status === "completed" || job.status === "failed")) {
            const documentId =
              job.document_id ??
              (job.result_resource_type === "document" ? job.result_resource_id : null);

            if (isIngestionJobKind(job.job_kind)) {
              void invalidateWorkflowQueries(queryClient, { documentId });
            }

            if (isTrustedExternalLookupJobKind(job.job_kind) && documentId) {
              void invalidateDocumentTrustedExternalQueries(queryClient, documentId);
            }
          }
        },
        onError: () => {
          void getJob(jobId)
            .then((job) => {
              queryClient.setQueryData(jobKeys.detail(jobId), job);
            })
            .catch(() => undefined);
        },
      },
      controller.signal,
    ).catch((error) => {
      if (isAbortError(error)) {
        return;
      }
    });

    return () => {
      controller.abort();
    };
  }, [enabled, jobId, queryClient]);
}

export function shouldStreamJob(job: JobRead | null | undefined) {
  return Boolean(job?.status && JOB_ACTIVE_STATUSES.has(job.status));
}
