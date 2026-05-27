"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDocumentTrustedExternalLookupSummary,
  startDocumentTrustedExternalLookupRun,
} from "@/lib/api/documents";
import { wordKeys } from "@/lib/hooks/use-words";

export const documentTrustedExternalKeys = {
  all: ["documents", "trusted-external"] as const,
  summary: (documentId: string) => [...documentTrustedExternalKeys.all, documentId, "summary"] as const,
};

export function useDocumentTrustedExternalLookupSummary(documentId: string, enabled = true) {
  return useQuery({
    queryKey: documentTrustedExternalKeys.summary(documentId),
    queryFn: () => getDocumentTrustedExternalLookupSummary(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useStartDocumentTrustedExternalLookupRun(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startDocumentTrustedExternalLookupRun(documentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentTrustedExternalKeys.summary(documentId) }),
        queryClient.invalidateQueries({ queryKey: wordKeys.documentCandidates(documentId, {}) }),
        queryClient.invalidateQueries({ queryKey: ["words", "documents", documentId] }),
      ]);
    },
  });
}

export async function invalidateDocumentTrustedExternalQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: documentTrustedExternalKeys.summary(documentId) }),
    queryClient.invalidateQueries({ queryKey: ["words", "documents", documentId] }),
  ]);
}
