"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { applyLexiconAction, getLexiconGroups } from "@/lib/api/lexicon";
import { invalidateCurationQueries } from "@/lib/hooks/invalidate-curation";
import type { LexiconActionRequest, LexiconGroupsListParams } from "@/lib/types/api";

export const lexiconKeys = {
  all: ["lexicon"] as const,
  groups: () => [...lexiconKeys.all, "groups"] as const,
  groupList: (params: LexiconGroupsListParams) => [...lexiconKeys.groups(), params] as const,
  groupDetail: (normalizedForm: string) => [...lexiconKeys.groups(), normalizedForm] as const,
};

export function useLexiconGroups(params: LexiconGroupsListParams) {
  return useQuery({
    queryKey: lexiconKeys.groupList(params),
    queryFn: () => getLexiconGroups(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useLexiconAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexiconActionRequest) => applyLexiconAction(payload),
    onSuccess: async () => {
      await invalidateCurationQueries(queryClient);
    },
  });
}
