"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { LexiconScriptType } from "@/lib/types/api";

type GroupClassificationBadgesProps = {
  scriptType: LexiconScriptType;
};

export function GroupClassificationBadges({ scriptType }: GroupClassificationBadgesProps) {
  const { messages } = useI18n();

  return (
    <Badge variant="outline">{messages.lexicon.script[scriptType]}</Badge>
  );
}
