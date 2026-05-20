"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { linkLexiconGroupsToLexeme } from "@/lib/api/lexicon";
import { invalidateCurationQueries } from "@/lib/hooks/invalidate-curation";
import type { LexiconGroupLinkRequest } from "@/lib/types/api";

export function useLinkLexiconGroups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexiconGroupLinkRequest) => linkLexiconGroupsToLexeme(payload),
    onSuccess: async (result) => {
      await invalidateCurationQueries(queryClient, { lexemeId: result.lexeme_id });
    },
  });
}
