"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { mergeLexemeGroups } from "@/lib/api/lexemes";
import { invalidateCurationQueries } from "@/lib/hooks/invalidate-curation";
import type { LexemeMergeGroupsRequest } from "@/lib/types/api";

export function useMergeLexemeGroups(lexemeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexemeMergeGroupsRequest) => mergeLexemeGroups(lexemeId, payload),
    onSuccess: async () => {
      await invalidateCurationQueries(queryClient, { lexemeId });
    },
  });
}
