"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { getJob, getJobEvents, listJobs, retryJobStart } from "@/lib/api/jobs";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { documentKeys } from "@/lib/hooks/use-documents";
import { singleDocumentKeys } from "@/lib/hooks/use-document";
import type { ListParams } from "@/lib/types/api";
import { JOB_ACTIVE_STATUSES, JOB_POLL_INTERVAL_MS } from "@/lib/utils/constants";

export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (params: ListParams) => [...jobKeys.lists(), params] as const,
  detail: (jobId: string) => [...jobKeys.all, jobId] as const,
  events: (jobId: string) => [...jobKeys.detail(jobId), "events"] as const,
};

export function useJobs(params: ListParams) {
  const { isLoading, session } = useAuthSession();
  const isAuthReady = !isLoading;
  const hasSession = Boolean(session);

  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => listJobs(params),
    enabled: isAuthReady && hasSession,
    refetchInterval(query) {
      if (!isAuthReady || !hasSession) {
        return false;
      }

      const jobs = query.state.data ?? [];

      return jobs?.some((job) => job && JOB_ACTIVE_STATUSES.has(job.status))
        ? JOB_POLL_INTERVAL_MS
        : false;
    },
  });
}

export function useJob(jobId: string) {
  const { isLoading, session } = useAuthSession();
  const isAuthReady = !isLoading;
  const hasSession = Boolean(session);

  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId) && isAuthReady && hasSession,
    refetchInterval(query) {
      if (!isAuthReady || !hasSession) {
        return false;
      }

      const status = query.state.data?.status;
      return status && JOB_ACTIVE_STATUSES.has(status) ? JOB_POLL_INTERVAL_MS : false;
    },
  });
}

export function useTrackedJobs(jobIds: string[]) {
  const { isLoading, session } = useAuthSession();
  const isAuthReady = !isLoading;
  const hasSession = Boolean(session);

  return useQueries({
    queries: jobIds.map((jobId) => ({
      queryKey: jobKeys.detail(jobId),
      queryFn: () => getJob(jobId),
      enabled: Boolean(jobId) && isAuthReady && hasSession,
      refetchInterval(query: { state: { data?: { status?: string | null } } }) {
        if (!isAuthReady || !hasSession) {
          return false;
        }

        const status = query.state.data?.status;
        return status && JOB_ACTIVE_STATUSES.has(status) ? JOB_POLL_INTERVAL_MS : false;
      },
    })),
  });
}

export function useRetryJobStart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryJobStart,
    onSuccess: ({ job }) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job);

      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: singleDocumentKeys.all });

      if (job.document_id) {
        void queryClient.invalidateQueries({
          queryKey: singleDocumentKeys.detail(job.document_id),
        });
      }
    },
  });
}

export const useRetryJob = useRetryJobStart;

export function useJobEvents(jobId: string, status?: string | null, enabled = true) {
  const { isLoading, session } = useAuthSession();
  const isAuthReady = !isLoading;
  const hasSession = Boolean(session);
  const canFetchEvents = Boolean(jobId) && enabled && isAuthReady && hasSession;

  return useQuery({
    queryKey: jobKeys.events(jobId),
    queryFn: () => getJobEvents(jobId),
    enabled: canFetchEvents,
    refetchInterval:
      canFetchEvents && status && JOB_ACTIVE_STATUSES.has(status)
        ? JOB_POLL_INTERVAL_MS
        : false,
  });
}
