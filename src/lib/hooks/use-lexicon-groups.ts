"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getLexiconGroups, ignoreLexiconGroups, unignoreLexiconGroups } from "@/lib/api/lexicon";
import type { LexiconGroupMutationRequest, LexiconGroupsListParams } from "@/lib/types/api";

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

export function useIgnoreLexiconGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexiconGroupMutationRequest) => ignoreLexiconGroups(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lexiconKeys.all });
    },
  });
}

export function useUnignoreLexiconGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexiconGroupMutationRequest) => unignoreLexiconGroups(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lexiconKeys.all });
    },
  });
}
