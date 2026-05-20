"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createLexeme } from "@/lib/api/lexemes";
import { invalidateCurationQueries } from "@/lib/hooks/invalidate-curation";

export function useCreateLexeme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLexeme,
    onSuccess: async () => {
      await invalidateCurationQueries(queryClient);
    },
  });
}
