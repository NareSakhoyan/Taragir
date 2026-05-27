"use client";

import { useMutation, useQuery, useQueryClient, type Query } from "@tanstack/react-query";

import {
  decideDocumentDiscoveryCandidate,
  getDocumentDiscoveryCandidate,
  getDocumentDiscoverySummary,
  listDocumentDiscoveryCandidates,
  startDocumentDiscoveryBuild,
  startDocumentReferenceEvidenceUpdate,
} from "@/lib/api/documents";
import type { DiscoveryCandidateParams, DiscoveryDecisionRequest, DiscoverySummary } from "@/lib/types/api";

type DiscoverySummaryRefetchInterval =
  | number
  | false
  | ((query: Query<DiscoverySummary>) => number | false | undefined);

export const documentDiscoveryKeys = {
  all: ["documents", "discovery"] as const,
  list: (documentId: string, params: DiscoveryCandidateParams) =>
    [...documentDiscoveryKeys.all, documentId, "candidates", params] as const,
  summary: (documentId: string) => [...documentDiscoveryKeys.all, documentId, "summary"] as const,
  detail: (documentId: string, candidateId: string | null, includeTechnical = false, includeRawPayload = false) =>
    [...documentDiscoveryKeys.all, documentId, "candidate", candidateId, includeTechnical, includeRawPayload] as const,
};

export function useDocumentDiscoveryCandidates(
  documentId: string,
  params: DiscoveryCandidateParams,
  enabled = true,
  refetchInterval: number | false = false,
) {
  return useQuery({
    queryKey: documentDiscoveryKeys.list(documentId, params),
    queryFn: () => listDocumentDiscoveryCandidates(documentId, params),
    enabled: enabled && Boolean(documentId),
    placeholderData: (previousData) => previousData,
    refetchInterval,
  });
}

export function useDocumentDiscoverySummary(
  documentId: string,
  enabled = true,
  refetchInterval: DiscoverySummaryRefetchInterval = false,
) {
  return useQuery({
    queryKey: documentDiscoveryKeys.summary(documentId),
    queryFn: () => getDocumentDiscoverySummary(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 30_000,
    refetchInterval,
  });
}

export function useDocumentDiscoveryCandidate(
  documentId: string,
  candidateId: string | null,
  options: { includeTechnical?: boolean; includeRawPayload?: boolean } = {},
  enabled = true,
) {
  const includeTechnical = options.includeTechnical ?? false;
  const includeRawPayload = options.includeRawPayload ?? false;
  return useQuery({
    queryKey: documentDiscoveryKeys.detail(documentId, candidateId, includeTechnical, includeRawPayload),
    queryFn: () =>
      getDocumentDiscoveryCandidate(documentId, candidateId ?? "", {
        include_technical: includeTechnical,
        include_raw_payload: includeRawPayload,
      }),
    enabled: enabled && Boolean(documentId && candidateId),
  });
}

export function useStartDocumentDiscoveryBuild(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startDocumentDiscoveryBuild(documentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentDiscoveryKeys.all });
    },
  });
}

export function useStartDocumentReferenceEvidenceUpdate(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (referenceSourceId?: string) =>
      startDocumentReferenceEvidenceUpdate(documentId, referenceSourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentDiscoveryKeys.all });
    },
  });
}

export function useDecideDocumentDiscoveryCandidate(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ candidateId, request }: { candidateId: string; request: DiscoveryDecisionRequest }) =>
      decideDocumentDiscoveryCandidate(documentId, candidateId, request),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentDiscoveryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: documentDiscoveryKeys.detail(documentId, variables.candidateId),
        }),
      ]);
    },
  });
}
