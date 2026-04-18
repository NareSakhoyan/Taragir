"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getJob, retryJob } from "@/lib/api/jobs";
import { documentKeys } from "@/lib/hooks/use-documents";
import { singleDocumentKeys } from "@/lib/hooks/use-document";
import { JOB_ACTIVE_STATUSES, JOB_POLL_INTERVAL_MS } from "@/lib/utils/constants";

export const jobKeys = {
  all: ["jobs"] as const,
  detail: (jobId: string) => [...jobKeys.all, jobId] as const,
};

export function useJob(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
    refetchInterval(query) {
      const status = query.state.data?.status;
      return status && JOB_ACTIVE_STATUSES.has(status) ? JOB_POLL_INTERVAL_MS : false;
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryJob,
    onSuccess: async ({ job }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: singleDocumentKeys.all }),
        queryClient.invalidateQueries({
          queryKey: job.document_id ? singleDocumentKeys.detail(job.document_id) : singleDocumentKeys.all,
        }),
      ]);
    },
  });
}
