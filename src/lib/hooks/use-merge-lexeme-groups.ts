"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { mergeLexemeGroups } from "@/lib/api/lexemes";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";
import type { LexemeMergeGroupsRequest } from "@/lib/types/api";

export function useMergeLexemeGroups(lexemeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexemeMergeGroupsRequest) => mergeLexemeGroups(lexemeId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lexiconKeys.all }),
        queryClient.invalidateQueries({ queryKey: lexemeKeys.all }),
        queryClient.invalidateQueries({ queryKey: lexemeKeys.detail(lexemeId) }),
      ]);
    },
  });
}
