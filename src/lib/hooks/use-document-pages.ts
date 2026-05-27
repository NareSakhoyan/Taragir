"use client";

import { useQuery } from "@tanstack/react-query";

import { listDocumentPages } from "@/lib/api/documents";
import type { ListParams } from "@/lib/types/api";

export const documentPageKeys = {
  all: ["document-pages"] as const,
  list: (documentId: string, params: ListParams) => [...documentPageKeys.all, documentId, params] as const,
};

export function useDocumentPages(documentId: string, params: ListParams = {}, enabled = true) {
  return useQuery({
    queryKey: documentPageKeys.list(documentId, params),
    queryFn: () => listDocumentPages(documentId, params),
    enabled: enabled && Boolean(documentId),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
