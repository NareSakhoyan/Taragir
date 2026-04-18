"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateLexeme } from "@/lib/api/lexemes";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";
import type { LexemeUpdateRequest } from "@/lib/types/api";

export function useUpdateLexeme(lexemeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LexemeUpdateRequest) => updateLexeme(lexemeId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lexemeKeys.detail(lexemeId) }),
        queryClient.invalidateQueries({ queryKey: lexemeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: lexiconKeys.all }),
      ]);
    },
  });
}
