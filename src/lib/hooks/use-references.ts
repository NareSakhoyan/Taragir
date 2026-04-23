"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createReferenceSource,
  getLexemeReferenceMatches,
  getLexiconGroupReferenceMatches,
  getReferenceSource,
  getReferenceSources,
  startReferenceImport,
} from "@/lib/api/references";
import { jobKeys } from "@/lib/hooks/use-job";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";
import type {
  ReferenceSourceCreateRequest,
  ReferenceSourceDetail,
  ReferenceSourceSummary,
} from "@/lib/types/api";

export const referenceSourceKeys = {
  all: ["reference-sources"] as const,
  lists: () => [...referenceSourceKeys.all, "list"] as const,
  detail: (sourceId: string) => [...referenceSourceKeys.all, sourceId] as const,
};

export const referenceMatchKeys = {
  all: ["reference-matches"] as const,
  groups: () => [...referenceMatchKeys.all, "groups"] as const,
  group: (normalizedForm: string) => [...referenceMatchKeys.groups(), normalizedForm] as const,
  lexemes: () => [...referenceMatchKeys.all, "lexemes"] as const,
  lexeme: (lexemeId: string) => [...referenceMatchKeys.lexemes(), lexemeId] as const,
};

function mergeImportIntoSource<T extends ReferenceSourceSummary | ReferenceSourceDetail>(
  source: T,
  createdAt: string,
): T {
  const detailFields =
    "last_import_method" in source
      ? {
          last_import_method: source.last_import_method ?? source.most_recent_import?.import_method ?? null,
          last_import_warning: source.last_import_warning ?? source.most_recent_import?.warning_message ?? null,
          last_imported_at: createdAt,
        }
      : {};

  return {
    ...source,
    most_recent_import: {
      id: source.most_recent_import?.id ?? `client-import-${createdAt}`,
      filename: source.most_recent_import?.filename ?? null,
      status: "queued",
      rows_read: source.most_recent_import?.rows_read ?? 0,
      rows_imported: source.most_recent_import?.rows_imported ?? 0,
      rows_skipped: source.most_recent_import?.rows_skipped ?? 0,
      import_method: source.most_recent_import?.import_method ?? null,
      warning_message: source.most_recent_import?.warning_message ?? null,
      error_message: null,
      created_at: createdAt,
    },
    ...detailFields,
  };
}

export function useReferenceSources() {
  return useQuery({
    queryKey: referenceSourceKeys.lists(),
    queryFn: getReferenceSources,
  });
}

export function useReferenceSource(sourceId: string) {
  return useQuery({
    queryKey: referenceSourceKeys.detail(sourceId),
    queryFn: () => getReferenceSource(sourceId),
    enabled: Boolean(sourceId),
  });
}

export function useCreateReferenceSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReferenceSourceCreateRequest) => createReferenceSource(payload),
    onSuccess: async (source) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: referenceSourceKeys.all }),
        queryClient.setQueryData(referenceSourceKeys.detail(source.id), source),
      ]);
    },
  });
}

export function useStartReferenceImport(sourceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => startReferenceImport(sourceId, file),
    onSuccess: (result) => {
      queryClient.setQueryData(jobKeys.detail(result.job.id), result.job);

      if (result.source) {
        queryClient.setQueryData(referenceSourceKeys.detail(sourceId), result.source);

        queryClient.setQueryData<ReferenceSourceSummary[] | undefined>(
          referenceSourceKeys.lists(),
          (current) =>
            current?.map((source) => (source.id === sourceId ? { ...source, ...result.source } : source)),
        );
      }

      queryClient.setQueryData<ReferenceSourceDetail | undefined>(
        referenceSourceKeys.detail(sourceId),
        (current) => (current ? mergeImportIntoSource(current, result.job.created_at) : current),
      );

      queryClient.setQueryData<ReferenceSourceSummary[] | undefined>(
        referenceSourceKeys.lists(),
        (current) =>
          current?.map((source) =>
            source.id === sourceId ? mergeImportIntoSource(source, result.job.created_at) : source,
          ),
      );

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: referenceSourceKeys.all }),
        queryClient.invalidateQueries({ queryKey: referenceMatchKeys.all }),
        queryClient.invalidateQueries({ queryKey: lexiconKeys.all }),
        queryClient.invalidateQueries({ queryKey: lexemeKeys.all }),
        queryClient.invalidateQueries({ queryKey: jobKeys.all }),
      ]);
    },
  });
}

export const useImportReferenceSource = useStartReferenceImport;

export function useLexiconGroupReferenceMatches(normalizedForm: string | null, enabled = true) {
  return useQuery({
    queryKey: referenceMatchKeys.group(normalizedForm ?? ""),
    queryFn: () => getLexiconGroupReferenceMatches(normalizedForm ?? ""),
    enabled: enabled && Boolean(normalizedForm),
  });
}

export function useLexemeReferenceMatches(lexemeId: string | null, enabled = true) {
  return useQuery({
    queryKey: referenceMatchKeys.lexeme(lexemeId ?? ""),
    queryFn: () => getLexemeReferenceMatches(lexemeId ?? ""),
    enabled: enabled && Boolean(lexemeId),
  });
}
