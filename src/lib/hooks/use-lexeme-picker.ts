"use client";

import { useQuery } from "@tanstack/react-query";

import { getLexemePicker } from "@/lib/api/lexemes";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import type { LexemePickerListParams } from "@/lib/types/api";

export const lexemePickerKeys = {
  all: ["lexeme-picker"] as const,
  list: (params: LexemePickerListParams) => [...lexemePickerKeys.all, params] as const,
};

export function useLexemePicker(params: LexemePickerListParams, enabled = true) {
  const { isLoading, session } = useAuthSession();
  const isAuthReady = !isLoading;
  const hasSession = Boolean(session);

  return useQuery({
    queryKey: lexemePickerKeys.list(params),
    queryFn: () => getLexemePicker(params),
    enabled: enabled && isAuthReady && hasSession,
    staleTime: 30_000,
  });
}
