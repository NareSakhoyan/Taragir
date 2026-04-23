"use client";

import { useState } from "react";

import { ReferenceMatchBadge } from "@/components/lexicon/reference-match-badge";
import { ReferenceMatchesSheet } from "@/components/lexicon/reference-matches-sheet";
import { Button } from "@/components/ui/button";
import { useLexemeReferenceMatches } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceMatchSummary } from "@/lib/types/api";

type LexemeReferenceMatchesCardProps = {
  lexemeId: string;
  canonicalForm: string;
  canonicalNormalizedForm: string;
  hasReferenceMatch: boolean;
  referenceMatchCount: number;
  bestReferenceMatch: ReferenceMatchSummary | null;
};

export function LexemeReferenceMatchesCard({
  lexemeId,
  canonicalForm,
  canonicalNormalizedForm,
  hasReferenceMatch,
  referenceMatchCount,
  bestReferenceMatch,
}: LexemeReferenceMatchesCardProps) {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);
  const matchesQuery = useLexemeReferenceMatches(lexemeId, open);

  return (
    <>
      <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight">{messages.reference.actions.viewMatches}</h3>
            <p className="text-sm text-muted-foreground">{messages.reference.messages.assistiveOnly}</p>
          </div>
          <Button onClick={() => setOpen(true)} type="button" variant="outline">
            {messages.reference.actions.viewMatches}
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <ReferenceMatchBadge
            bestMatch={bestReferenceMatch}
            hasMatch={hasReferenceMatch}
            matchCount={referenceMatchCount}
            showUnmatched
          />
          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{canonicalNormalizedForm}</p>
        </div>
      </section>

      <ReferenceMatchesSheet
        description={messages.reference.messages.assistiveOnly}
        errorMessage={matchesQuery.error?.message ?? null}
        hasMatch={matchesQuery.data?.has_match ?? hasReferenceMatch}
        isLoading={matchesQuery.isLoading}
        matches={matchesQuery.data?.matches ?? []}
        onOpenChange={setOpen}
        open={open}
        targetLabel={messages.reference.labels.targetLexeme}
        targetSecondaryValue={canonicalNormalizedForm}
        targetValue={matchesQuery.data?.canonical_form ?? canonicalForm}
        title={messages.reference.actions.viewMatches}
      />
    </>
  );
}
