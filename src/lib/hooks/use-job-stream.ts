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
import { invalidateDocumentNayiriQueries } from "@/lib/hooks/use-document-nayiri";
import { isIngestionJobKind, isNayiriTrustedLookupJobKind } from "@/lib/utils/jobs";

type UseJobStreamOptions = {
  enabled?: boolean;
};

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
          queryClient.setQueryData(jobKeys.detail(jobId), job);
          queryClient.setQueryData(jobKeys.events(jobId), events);
        },
        onJob: (job) => {
          queryClient.setQueryData(jobKeys.detail(jobId), job);
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

            if (isNayiriTrustedLookupJobKind(job.job_kind) && documentId) {
              void invalidateDocumentNayiriQueries(queryClient, documentId);
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
