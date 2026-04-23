"use client";

import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReferenceSource } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import { DEFAULT_REFERENCE_SOURCE_TYPE, ROUTES } from "@/lib/utils/constants";

const createReferenceSourceSchema = z.object({
  displayName: z.string().trim().min(1),
  description: z.string().optional(),
  sourceType: z.string().trim().min(1),
  language: z.string().optional(),
});

type CreateReferenceSourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openDetailOnSuccess?: boolean;
};

export function CreateReferenceSourceDialog({
  open,
  onOpenChange,
  openDetailOnSuccess = false,
}: CreateReferenceSourceDialogProps) {
  const router = useRouter();
  const { href, messages } = useI18n();
  const createMutation = useCreateReferenceSource();
  const [values, setValues] = useState({
    displayName: "",
    description: "",
    sourceType: DEFAULT_REFERENCE_SOURCE_TYPE,
    language: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetForm() {
    setValues({
      displayName: "",
      description: "",
      sourceType: DEFAULT_REFERENCE_SOURCE_TYPE,
      language: "",
    });
    setErrorMessage(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit() {
    setErrorMessage(null);
    const parsed = createReferenceSourceSchema.safeParse(values);

    if (!parsed.success) {
      setErrorMessage(messages.references.createDialog.invalidName);
      return;
    }

    try {
      const source = await createMutation.mutateAsync({
        display_name: parsed.data.displayName,
        description: parsed.data.description?.trim() || undefined,
        source_type: parsed.data.sourceType,
        language: parsed.data.language?.trim() || undefined,
      });

      toast.success(messages.references.createDialog.successTitle, {
        description: messages.references.createDialog.successDescription.replace("{displayName}", source.display_name),
      });

      handleOpenChange(false);

      if (openDetailOnSuccess) {
        router.push(href(`${ROUTES.references}/${source.id}`));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.references.createDialog.createFailed);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{messages.references.createDialog.title}</DialogTitle>
          <DialogDescription>{messages.references.createDialog.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="reference-source-display-name">{messages.references.createDialog.displayName}</Label>
            <Input
              id="reference-source-display-name"
              onChange={(event) => setValues((current) => ({ ...current, displayName: event.target.value }))}
              value={values.displayName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference-source-description">{messages.references.createDialog.descriptionLabel}</Label>
            <Textarea
              id="reference-source-description"
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              value={values.description}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference-source-type">{messages.references.createDialog.sourceType}</Label>
              <Input
                id="reference-source-type"
                onChange={(event) => setValues((current) => ({ ...current, sourceType: event.target.value }))}
                value={values.sourceType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference-source-language">{messages.references.createDialog.language}</Label>
              <Input
                id="reference-source-language"
                onChange={(event) => setValues((current) => ({ ...current, language: event.target.value }))}
                value={values.language}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)} type="button" variant="ghost">
            {messages.common.cancel}
          </Button>
          <Button disabled={createMutation.isPending} onClick={() => void handleSubmit()} type="button">
            {createMutation.isPending
              ? messages.references.createDialog.submitting
              : messages.references.createDialog.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
