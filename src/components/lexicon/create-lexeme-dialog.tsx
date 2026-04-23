"use client";

import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLexeme } from "@/lib/hooks/use-create-lexeme";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import { DEFAULT_LEXEME_STATUS, ROUTES } from "@/lib/utils/constants";

const createLexemeSchema = z.object({
  canonicalForm: z.string().trim().min(1),
  status: z.string().trim().min(1),
  notes: z.string().optional(),
});

type CreateLexemeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNormalizedForms: string[];
};

const initialState = {
  canonicalForm: "",
  status: DEFAULT_LEXEME_STATUS,
  notes: "",
};

export function CreateLexemeDialog({
  open,
  onOpenChange,
  selectedNormalizedForms,
}: CreateLexemeDialogProps) {
  const router = useRouter();
  const { href, locale, messages } = useI18n();
  const createLexemeMutation = useCreateLexeme();
  const [values, setValues] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setValues(initialState);
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!selectedNormalizedForms.length) {
      setErrorMessage(messages.lexicon.createDialog.noSelectionError);
      return;
    }

    const parsed = createLexemeSchema.safeParse(values);

    if (!parsed.success) {
      setErrorMessage(messages.lexicon.createDialog.invalidForm);
      return;
    }

    try {
      const response = await createLexemeMutation.mutateAsync({
        canonical_form: parsed.data.canonicalForm,
        normalized_forms: selectedNormalizedForms,
        notes: parsed.data.notes?.trim() || undefined,
        status: parsed.data.status,
      });

      toast.success(messages.lexicon.createDialog.successTitle, {
        description: messages.lexicon.createDialog.successDescription
          .replace("{count}", selectedNormalizedForms.length.toLocaleString(locale))
          .replace("{suffix}", locale === "hy" ? (selectedNormalizedForms.length === 1 ? "" : "եր") : selectedNormalizedForms.length === 1 ? "" : "s")
          .replace("{canonicalForm}", parsed.data.canonicalForm),
      });
      handleOpenChange(false);

      if (response.id) {
        router.push(href(`${ROUTES.lexemes}/${response.id}`));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.lexicon.createDialog.createFailed);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.lexicon.createDialog.title}</DialogTitle>
          <DialogDescription>{messages.lexicon.createDialog.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="create-lexeme-canonical-form">{messages.lexicon.createDialog.canonicalForm}</Label>
            <Input
              id="create-lexeme-canonical-form"
              onChange={(event) => setValues((current) => ({ ...current, canonicalForm: event.target.value }))}
              placeholder={messages.lexicon.createDialog.canonicalPlaceholder}
              value={values.canonicalForm}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-lexeme-status">{messages.lexicon.createDialog.status}</Label>
            <Input
              id="create-lexeme-status"
              onChange={(event) => setValues((current) => ({ ...current, status: event.target.value }))}
              value={values.status}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-lexeme-notes">{messages.lexicon.createDialog.notes}</Label>
            <Textarea
              id="create-lexeme-notes"
              onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
              placeholder={messages.lexicon.createDialog.notesPlaceholder}
              value={values.notes}
            />
          </div>

          <div className="space-y-2">
            <Label>{messages.lexicon.createDialog.selectedForms}</Label>
            <div className="rounded-md border border-border/80 bg-muted/10">
              <ScrollArea className="h-32">
                <div className="flex flex-wrap gap-2 p-3">
                  {selectedNormalizedForms.length ? (
                    selectedNormalizedForms.map((form) => (
                      <div className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-sm" key={form}>
                        {form}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{messages.lexicon.createDialog.noGroupsSelected}</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)} type="button" variant="ghost">{messages.common.cancel}</Button>
            <Button disabled={createLexemeMutation.isPending || !selectedNormalizedForms.length} type="submit">
              {createLexemeMutation.isPending ? messages.lexicon.createDialog.submitting : messages.lexicon.createDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
