"use client";

import { Link2, Unlink2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

type GroupLinkedBadgeProps = {
  linkedLexemeId: string | null;
  linkedLexemeCanonicalForm: string | null;
};

export function GroupLinkedBadge({ linkedLexemeId, linkedLexemeCanonicalForm }: GroupLinkedBadgeProps) {
  const { href, messages } = useI18n();

  if (!linkedLexemeId) {
    return (
      <Badge className="gap-1.5" variant="outline">
        <Unlink2 className="h-3.5 w-3.5" />
        {messages.lexicon.linked.unlinked}
      </Badge>
    );
  }

  const label = linkedLexemeCanonicalForm?.trim() || messages.lexicon.linked.linkedFallback;

  return (
    <Link href={href(`${ROUTES.lexemes}/${linkedLexemeId}`)}>
      <Badge className="gap-1.5" variant="secondary">
        <Link2 className="h-3.5 w-3.5" />
        {label}
      </Badge>
    </Link>
  );
}
