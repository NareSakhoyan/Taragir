"use client";

import { z } from "zod";
import { useState } from "react";

import { ReferenceMatchBadge } from "@/components/lexicon/reference-match-badge";
import { LexemeFormsList } from "@/components/lexemes/lexeme-forms-list";
import { LexemeReferenceMatchesCard } from "@/components/lexemes/lexeme-reference-matches-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateLexeme } from "@/lib/hooks/use-update-lexeme";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import type { LexemeDetail } from "@/lib/types/api";
import { formatDate, formatNumber } from "@/lib/utils/format";

const editLexemeSchema = z.object({
  canonicalForm: z.string().trim().min(1),
  status: z.string().trim().min(1),
  notes: z.string().optional(),
});

type LexemeDetailCardProps = {
  lexeme: LexemeDetail;
};

export function LexemeDetailCard({ lexeme }: LexemeDetailCardProps) {
  const { locale, messages } = useI18n();
  const updateLexemeMutation = useUpdateLexeme(lexeme.id);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [values, setValues] = useState({
    canonicalForm: lexeme.canonical_form,
    status: lexeme.status,
    notes: lexeme.notes ?? "",
  });

  async function onSave() {
    setErrorMessage(null);
    const parsed = editLexemeSchema.safeParse(values);

    if (!parsed.success) {
      setErrorMessage(messages.lexemeDetail.invalidUpdate);
      return;
    }

    try {
      await updateLexemeMutation.mutateAsync({
        canonical_form: parsed.data.canonicalForm,
        status: parsed.data.status,
        notes: parsed.data.notes?.trim() || "",
      });
      setIsEditing(false);
      toast.success(messages.lexemeDetail.successTitle, {
        description: messages.lexemeDetail.successDescription.replace("{canonicalForm}", parsed.data.canonicalForm),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.lexemeDetail.updateFailed);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border/80 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-5 border-b border-border/70 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-3xl font-semibold tracking-tight">{lexeme.canonical_form}</h2>
              <Badge variant="secondary">{lexeme.status}</Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{lexeme.canonical_normalized_form}</p>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMessage(null);
                    setValues({
                      canonicalForm: lexeme.canonical_form,
                      status: lexeme.status,
                      notes: lexeme.notes ?? "",
                    });
                  }}
                  type="button"
                  variant="ghost"
                >
                  {messages.lexemeDetail.cancel}
                </Button>
                <Button disabled={updateLexemeMutation.isPending} onClick={() => void onSave()} type="button">
                  {updateLexemeMutation.isPending ? messages.lexemeDetail.saving : messages.lexemeDetail.saveChanges}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setValues({
                    canonicalForm: lexeme.canonical_form,
                    status: lexeme.status,
                    notes: lexeme.notes ?? "",
                  });
                  setErrorMessage(null);
                  setIsEditing(true);
                }}
                type="button"
                variant="outline"
              >
                {messages.lexemeDetail.edit}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-b border-border/70 py-6 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="text-sm text-muted-foreground">{messages.lexemeDetail.status}</p>
            {isEditing ? (
              <div className="mt-2">
                <Input
                  onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}
                  value={values.status}
                />
              </div>
            ) : (
              <p className="mt-2 font-semibold">{lexeme.status}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{messages.lexemeDetail.occurrenceCount}</p>
            <p className="mt-2 font-semibold">{formatNumber(lexeme.occurrence_count, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{messages.lexemeDetail.created}</p>
            <p className="mt-2 font-semibold">{formatDate(lexeme.created_at, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{messages.lexemeDetail.updated}</p>
            <p className="mt-2 font-semibold">{formatDate(lexeme.updated_at, locale)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{messages.lexemes.table.reference}</p>
            <div className="mt-2">
              <ReferenceMatchBadge
                bestMatch={lexeme.best_reference_match}
                hasMatch={lexeme.has_reference_match}
                matchCount={lexeme.reference_match_count}
                showUnmatched
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 py-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lexeme-canonical-form">{messages.lexemeDetail.canonicalForm}</Label>
              {isEditing ? (
                <Input
                  id="lexeme-canonical-form"
                  onChange={(event) => setValues((current) => ({ ...current, canonicalForm: event.target.value }))}
                  value={values.canonicalForm}
                />
              ) : (
                <div className="rounded-md border border-border/70 bg-muted/10 px-4 py-3 text-sm">
                  {lexeme.canonical_form}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lexeme-notes">{messages.lexemeDetail.notes}</Label>
              {isEditing ? (
                <Textarea
                  id="lexeme-notes"
                  onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
                  placeholder={messages.lexemeDetail.notesPlaceholder}
                  value={values.notes}
                />
              ) : (
                <div className="rounded-md border border-border/70 bg-muted/10 px-4 py-3 text-sm leading-7 text-foreground/90">
                  {lexeme.notes?.trim() || messages.lexemeDetail.noNotes}
                </div>
              )}
            </div>

            {errorMessage ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                {errorMessage}
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-border/80 bg-muted/10 p-5">
            <h3 className="font-semibold tracking-tight">{messages.lexemeDetail.sampleContexts}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{messages.lexemeDetail.sampleContextsDescription}</p>
            <div className="mt-4 space-y-3">
              {lexeme.sample_contexts.length ? (
                lexeme.sample_contexts.map((context, index) => (
                  <div className="rounded-md border border-border/70 bg-card px-4 py-3 text-sm leading-7" key={`${lexeme.id}-context-${index}`}>
                    {context}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-border/80 bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
                  {messages.lexemeDetail.noSampleContexts}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <LexemeReferenceMatchesCard
        bestReferenceMatch={lexeme.best_reference_match}
        canonicalForm={lexeme.canonical_form}
        canonicalNormalizedForm={lexeme.canonical_normalized_form}
        hasReferenceMatch={lexeme.has_reference_match}
        lexemeId={lexeme.id}
        referenceMatchCount={lexeme.reference_match_count}
      />

      <LexemeFormsList normalizedForms={lexeme.normalized_forms} />
    </div>
  );
}
