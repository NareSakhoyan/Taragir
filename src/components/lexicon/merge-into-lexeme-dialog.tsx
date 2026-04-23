"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMergeLexemeGroups } from "@/lib/hooks/use-merge-lexeme-groups";
import { useLexemes } from "@/lib/hooks/use-lexemes";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import type { LexemeSummary } from "@/lib/types/api";
import { formatNumber } from "@/lib/utils/format";

type MergeIntoLexemeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNormalizedForms: string[];
};

function getConflictForms(error: ApiError) {
  const payload = error.payload;

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const detail =
    "detail" in payload && payload.detail && typeof payload.detail === "object"
      ? payload.detail
      : payload;

  if (!detail || typeof detail !== "object") {
    return [];
  }

  const detailRecord = detail as Record<string, unknown>;
  const candidateKeys = ["normalized_forms", "conflicting_normalized_forms", "conflicts", "forms"] as const;

  for (const key of candidateKeys) {
    const value = detailRecord[key];

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
  }

  return [];
}

function LexemeOption({
  lexeme,
  locale,
  selected,
  onSelect,
  formLabel,
  occurrenceLabel,
}: {
  lexeme: LexemeSummary;
  locale: Locale;
  selected: boolean;
  onSelect: () => void;
  formLabel: string;
  occurrenceLabel: string;
}) {
  return (
    <button
      className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
        selected ? "border-primary bg-primary/10" : "border-border/80 bg-card hover:bg-muted/20"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{lexeme.canonical_form}</p>
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{lexeme.status}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{lexeme.canonical_normalized_form}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{formatNumber(lexeme.form_count, locale)} {formLabel}</span>
        <span>{formatNumber(lexeme.occurrence_count, locale)} {occurrenceLabel}</span>
      </div>
    </button>
  );
}

export function MergeIntoLexemeDialog({
  open,
  onOpenChange,
  selectedNormalizedForms,
}: MergeIntoLexemeDialogProps) {
  const { locale, messages } = useI18n();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedLexemeId, setSelectedLexemeId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lexemesQuery = useLexemes({
    search: deferredSearch.trim() || undefined,
    limit: 20,
    offset: 0,
  });

  const selectedLexeme = useMemo(
    () => lexemesQuery.data?.items.find((lexeme) => lexeme.id === selectedLexemeId) ?? null,
    [lexemesQuery.data?.items, selectedLexemeId],
  );
  const mergeMutation = useMergeLexemeGroups(selectedLexemeId);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch("");
      setSelectedLexemeId("");
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!selectedNormalizedForms.length) {
      setErrorMessage(messages.lexicon.mergeDialog.noSelectionError);
      return;
    }

    if (!selectedLexemeId) {
      setErrorMessage(messages.lexicon.mergeDialog.noTargetError);
      return;
    }

    try {
      await mergeMutation.mutateAsync({
        normalized_forms: selectedNormalizedForms,
      });

      toast.success(messages.lexicon.mergeDialog.successTitle, {
        description: messages.lexicon.mergeDialog.successDescription
          .replace("{count}", selectedNormalizedForms.length.toLocaleString(locale))
          .replace("{suffix}", locale === "hy" ? (selectedNormalizedForms.length === 1 ? "" : "եր") : selectedNormalizedForms.length === 1 ? "" : "s")
          .replace("{canonicalForm}", selectedLexeme?.canonical_form ?? messages.lexicon.mergeDialog.noTargetSelected),
      });
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const conflictingForms = getConflictForms(error);
        setErrorMessage(
          conflictingForms.length
            ? messages.lexicon.mergeDialog.conflictDescription.replace("{forms}", conflictingForms.join(", "))
            : error.message,
        );
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : messages.lexicon.mergeDialog.mergeFailed);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.lexicon.mergeDialog.title}</DialogTitle>
          <DialogDescription>{messages.lexicon.mergeDialog.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="lexeme-search">
              {messages.lexicon.mergeDialog.searchLabel}
            </label>
            <Input
              id="lexeme-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={messages.lexicon.mergeDialog.searchPlaceholder}
              value={search}
            />
          </div>

          <div className="space-y-2">
            <div className="rounded-md border border-border/80">
              <ScrollArea className="h-60">
                <div className="space-y-2 p-3">
                  {lexemesQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{messages.lexicon.mergeDialog.loadingLexemes}</p>
                  ) : lexemesQuery.data?.items.length ? (
                    lexemesQuery.data.items.map((lexeme) => (
                      <LexemeOption
                        formLabel={messages.lexicon.mergeDialog.forms}
                        key={lexeme.id}
                        lexeme={lexeme}
                        locale={locale}
                        occurrenceLabel={messages.lexicon.mergeDialog.occurrences}
                        onSelect={() => setSelectedLexemeId(lexeme.id)}
                        selected={selectedLexemeId === lexeme.id}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{messages.lexicon.mergeDialog.noMatches}</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="rounded-md border border-border/80 bg-muted/10 px-4 py-3 text-sm">
            <p className="font-medium">{messages.lexicon.mergeDialog.selectedTarget}</p>
            <p className="mt-1 text-muted-foreground">
              {selectedLexeme ? `${selectedLexeme.canonical_form} (${selectedLexeme.canonical_normalized_form})` : messages.lexicon.mergeDialog.noTargetSelected}
            </p>
            <p className="mt-3 font-medium">{messages.lexicon.mergeDialog.normalizedFormsToMerge}</p>
            <p className="mt-1 text-muted-foreground">
              {selectedNormalizedForms.length ? selectedNormalizedForms.join(", ") : messages.lexicon.mergeDialog.noGroupsSelected}
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)} type="button" variant="ghost">
              {messages.common.cancel}
            </Button>
            <Button disabled={mergeMutation.isPending || !selectedLexemeId || !selectedNormalizedForms.length} type="submit">
              {mergeMutation.isPending ? messages.lexicon.mergeDialog.submitting : messages.lexicon.mergeDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
