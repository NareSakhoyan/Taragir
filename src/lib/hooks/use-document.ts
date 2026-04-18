"use client";

import { useQuery } from "@tanstack/react-query";

import { getDocument } from "@/lib/api/documents";

export const singleDocumentKeys = {
  all: ["document"] as const,
  detail: (documentId: string) => [...singleDocumentKeys.all, documentId] as const,
};

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: singleDocumentKeys.detail(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
  });
}
