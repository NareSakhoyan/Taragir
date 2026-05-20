"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDocumentNayiriLookupSummary, startDocumentNayiriLookupRun } from "@/lib/api/documents";
import { wordKeys } from "@/lib/hooks/use-words";

export const documentNayiriKeys = {
  all: ["documents", "nayiri"] as const,
  summary: (documentId: string) => [...documentNayiriKeys.all, documentId, "summary"] as const,
};

export function useDocumentNayiriLookupSummary(documentId: string, enabled = true) {
  return useQuery({
    queryKey: documentNayiriKeys.summary(documentId),
    queryFn: () => getDocumentNayiriLookupSummary(documentId),
    enabled: enabled && Boolean(documentId),
  });
}

export function useStartDocumentNayiriLookupRun(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startDocumentNayiriLookupRun(documentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentNayiriKeys.summary(documentId) }),
        queryClient.invalidateQueries({ queryKey: wordKeys.documentCandidates(documentId, {}) }),
        queryClient.invalidateQueries({ queryKey: ["words", "documents", documentId] }),
      ]);
    },
  });
}

export async function invalidateDocumentNayiriQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: documentNayiriKeys.summary(documentId) }),
    queryClient.invalidateQueries({ queryKey: ["words", "documents", documentId] }),
  ]);
}
