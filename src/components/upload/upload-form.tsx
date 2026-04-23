"use client";

import { LoaderCircle, UploadCloud } from "lucide-react";
import { useId, useState } from "react";
import { z } from "zod";

import { useStartDocumentUpload } from "@/lib/hooks/use-documents";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ACCEPTED_FILE_INPUT, ACCEPTED_FILE_TYPES, ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/classnames";
import { Button } from "@/components/ui/button";
import { FileDropInput } from "@/components/ui/file-drop-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadFormProps = {
  compact?: boolean;
};

function isAcceptedFile(file: File) {
  return (
    ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number]) || file.type.startsWith("image/")
  );
}

export function UploadForm({ compact = false }: UploadFormProps) {
  const mutation = useStartDocumentUpload();
  const { handleAcceptedStart } = useStartAndRedirect();
  const { messages } = useI18n();
  const fileInputId = useId();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    title?: string;
    file?: string;
    form?: string;
  }>({});

  function assignFile(next: File | null) {
    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.file;
      return nextErrors;
    });

    setFile(next);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const uploadSchema = z.object({
      title: z.string().max(512, messages.upload.titleTooLongError).optional(),
      file: z
        .instanceof(File, {
          message: messages.upload.chooseFileError,
        })
        .refine((inputFile) => isAcceptedFile(inputFile), messages.upload.invalidFileError),
    });

    const parsed = uploadSchema.safeParse({
      title,
      file,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setErrors({
        title: flattened.title?.[0],
        file: flattened.file?.[0],
      });
      return;
    }

    mutation.mutate(
      {
        file: parsed.data.file,
        title: parsed.data.title,
      },
      {
        onSuccess(response) {
          setTitle("");
          setFile(null);
          handleAcceptedStart({
            title: messages.upload.successTitle,
            description: response.message || messages.upload.successDescription,
            path: `${ROUTES.jobs}/${response.job.id}`,
            redirect: false,
            actionLabel: messages.job.openJob,
          });
        },
        onError(error) {
          setErrors({
            form: error.message,
          });
        },
      },
    );
  }

  return (
    <section className={cn("flex flex-col", compact ? "" : "h-full")}>
      <header className={cn("mb-8 border-b border-border/70 pb-6", compact && "mb-6 pb-4")}>
        <h3 className="text-xl font-semibold tracking-tight">{messages.upload.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{messages.upload.description}</p>
      </header>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="title">{messages.upload.optionalTitle}</Label>
          <Input
            id="title"
            placeholder={messages.upload.titlePlaceholder}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={fileInputId}>{messages.upload.file}</Label>
          <FileDropInput
            accept={ACCEPTED_FILE_INPUT}
            file={file}
            id={fileInputId}
            isFileAccepted={isAcceptedFile}
            onFileChange={assignFile}
            onFileRejected={() => {
              setErrors((current) => ({ ...current, file: messages.upload.invalidFileError }));
              setFile(null);
            }}
            placeholder={messages.upload.dropzoneHint}
          />
          <p className="text-xs text-muted-foreground">{messages.upload.accepted}</p>
          {errors.file ? <p className="text-sm text-destructive">{errors.file}</p> : null}
        </div>

        {errors.form ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.form}</p> : null}

        <Button className="w-full sm:w-auto" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {messages.upload.submitting}
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              {messages.upload.submit}
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
