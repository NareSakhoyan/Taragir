"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDocumentMorphologySummary,
  getReferenceSourceMorphologySummary,
  getWordMorphology,
  startMorphologyRun,
  updateMorphologySettings,
} from "@/lib/api/morphology";
import { documentKeys } from "@/lib/hooks/use-documents";
import { singleDocumentKeys } from "@/lib/hooks/use-document";
import { jobKeys } from "@/lib/hooks/use-job";
import { referenceSourceKeys } from "@/lib/hooks/use-references";
import { wordKeys } from "@/lib/hooks/use-words";
import type {
  MorphologySourceType,
  UpdateMorphologySettingsRequest,
} from "@/lib/types/api";

export const morphologyKeys = {
  all: ["morphology"] as const,
  documents: () => [...morphologyKeys.all, "documents"] as const,
  documentSummary: (documentId: string) => [...morphologyKeys.documents(), documentId, "summary"] as const,
  referenceSources: () => [...morphologyKeys.all, "reference-sources"] as const,
  referenceSourceSummary: (sourceId: string) =>
    [...morphologyKeys.referenceSources(), sourceId, "summary"] as const,
  words: () => [...morphologyKeys.all, "words"] as const,
  word: (input: {
    id?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
    normalizedForm?: string | null;
    q?: string | null;
  }) => [...morphologyKeys.words(), input] as const,
};

export function useDocumentMorphologySummary(documentId: string, enabled = true) {
  return useQuery({
    queryKey: morphologyKeys.documentSummary(documentId),
    queryFn: () => getDocumentMorphologySummary(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useReferenceSourceMorphologySummary(sourceId: string, enabled = true) {
  return useQuery({
    queryKey: morphologyKeys.referenceSourceSummary(sourceId),
    queryFn: () => getReferenceSourceMorphologySummary(sourceId),
    enabled: enabled && Boolean(sourceId),
  });
}

export function useWordMorphology(
  input: {
    id?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
    normalizedForm?: string | null;
    q?: string | null;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: morphologyKeys.word(input),
    queryFn: () => getWordMorphology(input),
    enabled: enabled && Boolean(input.normalizedForm?.trim()),
  });
}

export function useStartMorphologyRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { sourceType: MorphologySourceType; sourceId: string }) =>
      startMorphologyRun(input),
    onSuccess: (result, input) => {
      queryClient.setQueryData(jobKeys.detail(result.job.id), result.job);

      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: morphologyKeys.all });
      void queryClient.invalidateQueries({ queryKey: wordKeys.all });

      if (input.sourceType === "document") {
        void queryClient.invalidateQueries({ queryKey: documentKeys.all });
        void queryClient.invalidateQueries({ queryKey: singleDocumentKeys.detail(input.sourceId) });
      } else {
        void queryClient.invalidateQueries({ queryKey: referenceSourceKeys.all });
        void queryClient.invalidateQueries({ queryKey: referenceSourceKeys.detail(input.sourceId) });
      }
    },
  });
}

export function useUpdateMorphologySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      sourceType: MorphologySourceType;
      sourceId: string;
      settings: UpdateMorphologySettingsRequest;
    }) => updateMorphologySettings(input),
    onSuccess: (result, input) => {
      if (result.job) {
        queryClient.setQueryData(jobKeys.detail(result.job.id), result.job);
      }

      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      void queryClient.invalidateQueries({ queryKey: morphologyKeys.all });
      void queryClient.invalidateQueries({ queryKey: wordKeys.all });

      if (input.sourceType === "document") {
        void queryClient.invalidateQueries({ queryKey: documentKeys.all });
        void queryClient.invalidateQueries({ queryKey: singleDocumentKeys.detail(input.sourceId) });
      } else {
        void queryClient.invalidateQueries({ queryKey: referenceSourceKeys.all });
        void queryClient.invalidateQueries({ queryKey: referenceSourceKeys.detail(input.sourceId) });
      }
    },
  });
}
