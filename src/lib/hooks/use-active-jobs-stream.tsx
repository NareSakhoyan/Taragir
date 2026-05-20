"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getActiveJobsCount, streamActiveJobs } from "@/lib/api/active-jobs-stream";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { invalidateWorkflowQueries } from "@/lib/hooks/invalidate-curation";
import { jobKeys } from "@/lib/hooks/use-job";
import type { JobRead } from "@/lib/types/api";
import { isAbortError } from "@/lib/utils/abort";
import { invalidateDocumentNayiriQueries } from "@/lib/hooks/use-document-nayiri";
import { isIngestionJobKind, isNayiriTrustedLookupJobKind } from "@/lib/utils/jobs";

const ActiveJobsStreamContext = createContext(false);

function sortJobs(jobs: JobRead[]) {
  return [...jobs].sort((left, right) => {
    const leftTime = Date.parse(left.created_at);
    const rightTime = Date.parse(right.created_at);
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return right.id.localeCompare(left.id);
  });
}

function mergeActiveJobsIntoList(existing: JobRead[] | undefined, activeJobs: JobRead[]) {
  if (!existing) {
    return sortJobs(activeJobs);
  }

  const activeById = new Map(activeJobs.map((job) => [job.id, job]));
  const merged = existing.map((job) => activeById.get(job.id) ?? job);
  const existingIds = new Set(existing.map((job) => job.id));

  for (const job of activeJobs) {
    if (!existingIds.has(job.id)) {
      merged.push(job);
    }
  }

  return sortJobs(merged);
}

function applyJobsToCache(queryClient: ReturnType<typeof useQueryClient>, jobs: JobRead[]) {
  for (const job of jobs) {
    queryClient.setQueryData(jobKeys.detail(job.id), job);
  }

  queryClient.setQueriesData<JobRead[]>({ queryKey: jobKeys.lists() }, (existing) =>
    mergeActiveJobsIntoList(existing, jobs),
  );
}

function resolveDocumentJobId(job: JobRead) {
  return job.document_id ?? (job.result_resource_type === "document" ? job.result_resource_id : null);
}

function maybeInvalidateWorkflowForJob(
  queryClient: ReturnType<typeof useQueryClient>,
  job: JobRead,
  previousStatus?: string | null,
) {
  const reachedTerminal = job.status === "completed" || job.status === "failed";
  if (!reachedTerminal) {
    return;
  }

  if (previousStatus === job.status) {
    return;
  }

  const documentId = resolveDocumentJobId(job);

  if (isIngestionJobKind(job.job_kind)) {
    void invalidateWorkflowQueries(queryClient, { documentId });
  }

  if (isNayiriTrustedLookupJobKind(job.job_kind) && documentId) {
    void invalidateDocumentNayiriQueries(queryClient, documentId);
  }
}

function invalidateWorkflowForTerminalIngestionJobs(
  queryClient: ReturnType<typeof useQueryClient>,
  jobs: JobRead[],
) {
  for (const job of jobs) {
    const previous = queryClient.getQueryData<JobRead>(jobKeys.detail(job.id));
    maybeInvalidateWorkflowForJob(queryClient, job, previous?.status);
  }
}

export function ActiveJobsStreamProvider({ children }: { children: React.ReactNode }) {
  const streaming = useActiveJobsStream();
  return (
    <ActiveJobsStreamContext.Provider value={streaming}>{children}</ActiveJobsStreamContext.Provider>
  );
}

export function useActiveJobsStreamEnabled() {
  return useContext(ActiveJobsStreamContext);
}

export function useActiveJobsStream() {
  const queryClient = useQueryClient();
  const { isLoading, session } = useAuthSession();
  const [streaming, setStreaming] = useState(false);
  const enabled = !isLoading && Boolean(session);
  const activeJobsCountQuery = useQuery({
    queryKey: ["active-jobs-count"],
    queryFn: getActiveJobsCount,
    enabled,
    refetchInterval: (query) => {
      if (!enabled) {
        return false;
      }
      return (query.state.data?.count ?? 0) > 0 ? 10_000 : 30_000;
    },
  });
  const hasActiveJobs = (activeJobsCountQuery.data?.count ?? 0) > 0;
  const streamEnabled = enabled && hasActiveJobs;

  useEffect(() => {
    if (!streamEnabled) {
      return;
    }

    const controller = new AbortController();

    void streamActiveJobs(
      {
        onSnapshot: (jobs) => {
          setStreaming(true);
          applyJobsToCache(queryClient, jobs);
          invalidateWorkflowForTerminalIngestionJobs(queryClient, jobs);
        },
        onJobs: (jobs) => {
          applyJobsToCache(queryClient, jobs);
          invalidateWorkflowForTerminalIngestionJobs(queryClient, jobs);
        },
        onJob: (job) => {
          const previous = queryClient.getQueryData<JobRead>(jobKeys.detail(job.id));
          queryClient.setQueryData(jobKeys.detail(job.id), job);
          queryClient.setQueriesData<JobRead[]>({ queryKey: jobKeys.lists() }, (existing) =>
            mergeActiveJobsIntoList(existing, [job]),
          );
          maybeInvalidateWorkflowForJob(queryClient, job, previous?.status);
        },
        onError: () => {
          setStreaming(false);
        },
      },
      controller.signal,
    )
      .catch((error) => {
        if (!isAbortError(error)) {
          setStreaming(false);
        }
      })
      .finally(() => {
        setStreaming(false);
      });

    return () => {
      controller.abort();
    };
  }, [streamEnabled, queryClient]);

  return streaming && hasActiveJobs;
}
