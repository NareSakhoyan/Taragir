"use client";

import { useQuery } from "@tanstack/react-query";

import { listDocumentOccurrences } from "@/lib/api/occurrences";
import type { OccurrenceListParams } from "@/lib/types/api";

export const occurrenceKeys = {
  all: ["occurrences"] as const,
  list: (documentId: string, params: OccurrenceListParams) => [...occurrenceKeys.all, documentId, params] as const,
};

export function useDocumentOccurrences(documentId: string, params: OccurrenceListParams) {
  return useQuery({
    queryKey: occurrenceKeys.list(documentId, params),
    queryFn: () => listDocumentOccurrences(documentId, params),
    enabled: Boolean(documentId),
    placeholderData: (previousData) => previousData,
  });
}
