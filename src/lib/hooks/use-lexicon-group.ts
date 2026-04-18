"use client";

import { useQuery } from "@tanstack/react-query";

import { getLexiconGroup } from "@/lib/api/lexicon";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";

export function useLexiconGroup(normalizedForm: string | null, enabled = true) {
  return useQuery({
    queryKey: lexiconKeys.groupDetail(normalizedForm ?? ""),
    queryFn: () => getLexiconGroup(normalizedForm ?? ""),
    enabled: enabled && Boolean(normalizedForm),
  });
}
