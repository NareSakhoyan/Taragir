"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listAllDocuments, listDocuments, startDocumentUpload } from "@/lib/api/documents";
import { jobKeys } from "@/lib/hooks/use-job";
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

export function useStartDocumentUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startDocumentUpload,
    onSuccess: (response) => {
      queryClient.setQueryData(jobKeys.detail(response.job.id), response.job);

      if (response.document) {
        queryClient.setQueryData(["document", response.document.id], response.document);
      }

      void queryClient.invalidateQueries({ queryKey: documentKeys.all });
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export const useUploadDocumentMutation = useStartDocumentUpload;
