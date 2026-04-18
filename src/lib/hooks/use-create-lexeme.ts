"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createLexeme } from "@/lib/api/lexemes";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";

export function useCreateLexeme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLexeme,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lexiconKeys.all }),
        queryClient.invalidateQueries({ queryKey: lexemeKeys.all }),
      ]);
    },
  });
}
