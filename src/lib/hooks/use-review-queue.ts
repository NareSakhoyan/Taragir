"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getReviewQueue } from "@/lib/api/workflow";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import type { ListParams } from "@/lib/types/api";

export const reviewQueueKeys = {
  all: ["review-queue"] as const,
  list: (params: ListParams) => [...reviewQueueKeys.all, params] as const,
};

const REVIEW_QUEUE_POLL_MS = 10_000;

export function useReviewQueue(params: ListParams = {}) {
  const queryClient = useQueryClient();
  const { isLoading, session } = useAuthSession();
  const enabled = !isLoading && Boolean(session);

  return useQuery({
    queryKey: reviewQueueKeys.list(params),
    queryFn: () => getReviewQueue(params),
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: () => {
      if (!enabled) {
        return false;
      }

      const activeJobCount =
        queryClient.getQueryData<{ count: number }>(["active-jobs-count"])?.count ?? 0;
      return activeJobCount > 0 ? REVIEW_QUEUE_POLL_MS : false;
    },
  });
}
