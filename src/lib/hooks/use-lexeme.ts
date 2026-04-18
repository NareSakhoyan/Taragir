"use client";

import { useQuery } from "@tanstack/react-query";

import { getLexeme } from "@/lib/api/lexemes";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";

export function useLexeme(lexemeId: string) {
  return useQuery({
    queryKey: lexemeKeys.detail(lexemeId),
    queryFn: () => getLexeme(lexemeId),
    enabled: Boolean(lexemeId),
  });
}
