"use client";

import { useId, useState } from "react";
import { CircleHelp, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileDropInput } from "@/components/ui/file-drop-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useStartReferenceImport } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ACCEPTED_REFERENCE_SOURCE_FILE_INPUT, ROUTES } from "@/lib/utils/constants";

type ReferenceImportFormProps = {
  sourceId: string;
};

function isValidReferenceFile(file: File) {
  const fileName = file.name.toLowerCase();
  return [".txt", ".csv", ".docx", ".pdf", ".xlsx"].some((extension) => fileName.endsWith(extension));
}

export function ReferenceImportForm({ sourceId }: ReferenceImportFormProps) {
  const inputId = useId();
  const { messages } = useI18n();
  const { handleAcceptedStart } = useStartAndRedirect();
  const importMutation = useStartReferenceImport(sourceId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleImport() {
    if (!selectedFile) {
      setErrorMessage(messages.references.importForm.chooseFileError);
      return;
    }

    if (!isValidReferenceFile(selectedFile)) {
      setErrorMessage(messages.references.importForm.invalidFileError);
      return;
    }

    setErrorMessage(null);

    try {
      const result = await importMutation.mutateAsync(selectedFile);
      setSelectedFile(null);
      handleAcceptedStart({
        title: messages.references.importForm.successTitle,
        description: result.message || messages.references.importForm.successDescription,
        path: `${ROUTES.jobs}/${result.job.id}`,
        redirect: false,
        actionLabel: messages.job.openJob,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : messages.references.importForm.invalidFileError);
    }
  }

  return (
    <div className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <div className="space-y-1 border-b border-border/70 pb-4">
        <h2 className="text-lg font-semibold tracking-tight">{messages.references.importForm.title}</h2>
        <p className="text-sm text-muted-foreground">{messages.references.importForm.description}</p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={inputId}>
            {messages.references.importForm.file}
          </label>
          <FileDropInput
            accept={ACCEPTED_REFERENCE_SOURCE_FILE_INPUT}
            disabled={importMutation.isPending}
            file={selectedFile}
            id={inputId}
            isFileAccepted={isValidReferenceFile}
            onFileChange={(file) => {
              setSelectedFile(file);
              setErrorMessage(null);
            }}
            onFileRejected={() => {
              setSelectedFile(null);
              setErrorMessage(messages.references.importForm.invalidFileError);
            }}
            placeholder={messages.references.importForm.dropzoneHint}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <p>{messages.references.importForm.acceptedFormats}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label={messages.references.importForm.formatHelp}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="button"
                  >
                    <CircleHelp className="h-4 w-4" />
                    <span className="sr-only">{messages.references.importForm.formatHelp}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-1.5 px-3 py-2 text-left text-xs leading-relaxed">
                  <p>{messages.references.importForm.helperTxt}</p>
                  <p>{messages.references.importForm.helperCsv}</p>
                  <p>{messages.references.importForm.helperDocument}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button disabled={importMutation.isPending} onClick={() => void handleImport()} type="button">
            <Upload className="h-4 w-4" />
            {importMutation.isPending ? messages.references.importForm.submitting : messages.references.importForm.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
