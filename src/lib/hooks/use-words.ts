"use client";

import { useQuery } from "@tanstack/react-query";

import {
  checkWord,
  getDocumentWordCandidates,
  getReferenceSourceWordCandidates,
  getWordEvidence,
  searchWords,
} from "@/lib/api/words";
import type { WordCandidatesParams, WordSearchParams } from "@/lib/types/api";

export const wordKeys = {
  all: ["words"] as const,
  search: () => [...wordKeys.all, "search"] as const,
  searchResult: (params: WordSearchParams) => [...wordKeys.search(), params] as const,
  check: (query: string) => [...wordKeys.all, "check", query] as const,
  evidence: (input: {
    id?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
    normalizedForm?: string | null;
    q?: string | null;
  }) => [...wordKeys.all, "evidence", input] as const,
  documentCandidates: (documentId: string, params: WordCandidatesParams) =>
    [...wordKeys.all, "documents", documentId, params] as const,
  referenceSourceCandidates: (sourceId: string, params: WordCandidatesParams) =>
    [...wordKeys.all, "reference-sources", sourceId, params] as const,
};

export function useWordSearch(params: WordSearchParams, enabled = true) {
  const query = params.q.trim();

  return useQuery({
    queryKey: wordKeys.searchResult({ ...params, q: query }),
    queryFn: () => searchWords({ ...params, q: query }),
    enabled: enabled && Boolean(query),
  });
}

export function useWordCheck(query: string, enabled = true) {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: wordKeys.check(trimmedQuery),
    queryFn: () => checkWord(trimmedQuery),
    enabled: enabled && Boolean(trimmedQuery),
  });
}

export function useWordEvidence(
  input: {
    id?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
    normalizedForm?: string | null;
    q?: string | null;
    includeExternal?: boolean;
    providerKeys?: string[] | null;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: wordKeys.evidence(input),
    queryFn: () =>
      getWordEvidence({
        id: input.id ?? "",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        normalizedForm: input.normalizedForm,
        q: input.q,
        includeExternal: input.includeExternal,
        providerKeys: input.providerKeys,
      }),
    enabled: enabled && Boolean(input.id),
  });
}

export function useDocumentWordCandidates(
  documentId: string,
  params: WordCandidatesParams,
  enabled = true,
) {
  return useQuery({
    queryKey: wordKeys.documentCandidates(documentId, params),
    queryFn: () => getDocumentWordCandidates(documentId, params),
    enabled: enabled && Boolean(documentId),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useReferenceSourceWordCandidates(
  sourceId: string,
  params: WordCandidatesParams,
  enabled = true,
) {
  return useQuery({
    queryKey: wordKeys.referenceSourceCandidates(sourceId, params),
    queryFn: () => getReferenceSourceWordCandidates(sourceId, params),
    enabled: enabled && Boolean(sourceId),
    placeholderData: (previousData) => previousData,
  });
}
