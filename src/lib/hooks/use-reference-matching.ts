"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getReferenceMatchingRun,
  getReferenceMatchingRunEvents,
  getReferenceMatchingRunResultDetail,
  getReferenceMatchingRunResults,
  getReferenceMatchingRuns,
  startReferenceMatchingRun,
} from "@/lib/api/reference-matching";
import { referenceMatchKeys, referenceSourceKeys } from "@/lib/hooks/use-references";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";
import type {
  ReferenceMatchingRunResultsParams,
  StartReferenceMatchingRunRequest,
} from "@/lib/types/api";
import { ACTIVE_REFERENCE_MATCHING_RUN_STATUSES, MATCH_RUN_POLL_INTERVAL_MS } from "@/lib/utils/constants";

export const referenceMatchingKeys = {
  all: ["reference-matching"] as const,
  runs: () => [...referenceMatchingKeys.all, "runs"] as const,
  detail: (runId: string) => [...referenceMatchingKeys.runs(), runId] as const,
  events: (runId: string) => [...referenceMatchingKeys.detail(runId), "events"] as const,
  results: (runId: string) => [...referenceMatchingKeys.detail(runId), "results"] as const,
  resultsList: (runId: string, params: ReferenceMatchingRunResultsParams) =>
    [...referenceMatchingKeys.results(runId), params] as const,
  resultDetail: (runId: string, resultId: string) =>
    [...referenceMatchingKeys.results(runId), resultId] as const,
};

export function useReferenceMatchingRuns() {
  return useQuery({
    queryKey: referenceMatchingKeys.runs(),
    queryFn: getReferenceMatchingRuns,
    refetchInterval(query) {
      const hasActiveRun = (query.state.data ?? []).some((run) =>
        ACTIVE_REFERENCE_MATCHING_RUN_STATUSES.has(run.status),
      );

      return hasActiveRun ? MATCH_RUN_POLL_INTERVAL_MS : false;
    },
  });
}

export function useReferenceMatchingRun(runId: string) {
  return useQuery({
    queryKey: referenceMatchingKeys.detail(runId),
    queryFn: () => getReferenceMatchingRun(runId),
    enabled: Boolean(runId),
    refetchInterval(query) {
      const status = query.state.data?.status;
      return status && ACTIVE_REFERENCE_MATCHING_RUN_STATUSES.has(status)
        ? MATCH_RUN_POLL_INTERVAL_MS
        : false;
    },
  });
}

export function useReferenceMatchingRunResults(
  runId: string,
  params: ReferenceMatchingRunResultsParams,
  status?: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: referenceMatchingKeys.resultsList(runId, params),
    queryFn: () => getReferenceMatchingRunResults(runId, params),
    enabled: enabled && Boolean(runId),
    placeholderData: (previousData) => previousData,
    refetchInterval:
      enabled && status && ACTIVE_REFERENCE_MATCHING_RUN_STATUSES.has(status)
        ? MATCH_RUN_POLL_INTERVAL_MS
        : false,
  });
}

export function useReferenceMatchingRunResultDetail(
  runId: string,
  resultId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: referenceMatchingKeys.resultDetail(runId, resultId),
    queryFn: () => getReferenceMatchingRunResultDetail(runId, resultId),
    enabled: enabled && Boolean(runId) && Boolean(resultId),
  });
}

export function useStartReferenceMatchingRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartReferenceMatchingRunRequest) => startReferenceMatchingRun(payload),
    onSuccess: (response) => {
      if (response.run) {
        queryClient.setQueryData(referenceMatchingKeys.detail(response.run.id), response.run);
      }

      void queryClient.invalidateQueries({ queryKey: referenceMatchingKeys.all });
      void queryClient.invalidateQueries({ queryKey: referenceMatchKeys.all });
      void queryClient.invalidateQueries({ queryKey: referenceSourceKeys.all });
      void queryClient.invalidateQueries({ queryKey: lexiconKeys.all });
      void queryClient.invalidateQueries({ queryKey: lexemeKeys.all });
    },
  });
}

export function useReferenceMatchingRunEvents(runId: string, status?: string | null) {
  return useQuery({
    queryKey: referenceMatchingKeys.events(runId),
    queryFn: () => getReferenceMatchingRunEvents(runId),
    enabled: Boolean(runId),
    refetchInterval:
      status && ACTIVE_REFERENCE_MATCHING_RUN_STATUSES.has(status)
        ? MATCH_RUN_POLL_INTERVAL_MS
        : false,
  });
}
