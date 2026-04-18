"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { LexiconGroupState } from "@/lib/types/api";

type GroupStateBadgeProps = {
  state: LexiconGroupState;
};

export function GroupStateBadge({ state }: GroupStateBadgeProps) {
  const { messages } = useI18n();

  const variant = state === "linked" ? "secondary" : state === "ignored_noise" ? "outline" : "default";

  return <Badge variant={variant}>{messages.lexicon.state[state]}</Badge>;
}
