"use client";

import { useQuery } from "@tanstack/react-query";

import { listDocumentPages } from "@/lib/api/documents";

export const documentPageKeys = {
  all: ["document-pages"] as const,
  list: (documentId: string) => [...documentPageKeys.all, documentId] as const,
};

export function useDocumentPages(documentId: string) {
  return useQuery({
    queryKey: documentPageKeys.list(documentId),
    queryFn: () => listDocumentPages(documentId),
    enabled: Boolean(documentId),
  });
}
