"use client";

import { useQuery } from "@tanstack/react-query";

import { getLexemes } from "@/lib/api/lexemes";
import type { SearchListParams } from "@/lib/types/api";

export const lexemeKeys = {
  all: ["lexemes"] as const,
  lists: () => [...lexemeKeys.all, "list"] as const,
  list: (params: SearchListParams) => [...lexemeKeys.lists(), params] as const,
  detail: (lexemeId: string) => [...lexemeKeys.all, lexemeId] as const,
};

export function useLexemes(params: SearchListParams) {
  return useQuery({
    queryKey: lexemeKeys.list(params),
    queryFn: () => getLexemes(params),
    placeholderData: (previousData) => previousData,
  });
}
