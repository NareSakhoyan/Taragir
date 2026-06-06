"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDocumentStats,
  listAllDocumentOptions,
  listDocuments,
  startDocumentUpload,
} from "@/lib/api/documents";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import { jobKeys } from "@/lib/hooks/use-job";
import type { ListParams } from "@/lib/types/api";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (params: ListParams) => [...documentKeys.lists(), params] as const,
  summary: () => [...documentKeys.all, "summary"] as const,
  stats: () => [...documentKeys.all, "stats"] as const,
  options: () => [...documentKeys.all, "options"] as const,
};

export function useDocuments(params: ListParams) {
  const { isLoading, session } = useAuthSession();
  const enabled = !isLoading && Boolean(session);

  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => listDocuments(params),
    enabled,
  });
}

export function useDocumentStats() {
  const { isLoading, session } = useAuthSession();
  const enabled = !isLoading && Boolean(session);

  return useQuery({
    queryKey: documentKeys.stats(),
    queryFn: getDocumentStats,
    enabled,
  });
}

export function useDocumentOptions() {
  return useQuery({
    queryKey: documentKeys.options(),
    queryFn: listAllDocumentOptions,
    staleTime: 60_000,
  });
}

/** @deprecated Use useDocumentStats or useDocumentOptions instead. */
export function useDocumentsSummary() {
  return useDocumentOptions();
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
