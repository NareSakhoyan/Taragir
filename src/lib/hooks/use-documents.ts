"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listAllDocuments, listDocuments, uploadDocument } from "@/lib/api/documents";
import type { ListParams } from "@/lib/types/api";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (params: ListParams) => [...documentKeys.lists(), params] as const,
  summary: () => [...documentKeys.all, "summary"] as const,
};

export function useDocuments(params: ListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => listDocuments(params),
  });
}

export function useDocumentsSummary() {
  return useQuery({
    queryKey: documentKeys.summary(),
    queryFn: listAllDocuments,
  });
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      ]);
    },
  });
}
