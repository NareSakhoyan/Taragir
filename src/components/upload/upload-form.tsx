"use client";

import { LoaderCircle, UploadCloud } from "lucide-react";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { toast } from "@/lib/notifications";
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

const EMPTY_OPTION = "__none__";
const DEFAULT_LANGUAGE_STAGE = "classical";
const DEFAULT_MORPHOLOGY_PROFILE = "xcl_pie";

function isAcceptedFile(file: File) {
  return (
    ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number]) || file.type.startsWith("image/")
  );
}

export function UploadForm({ compact = false }: UploadFormProps) {
  const router = useRouter();
  const mutation = useStartDocumentUpload();
  const { handleAcceptedStart } = useStartAndRedirect();
  const { href, messages } = useI18n();
  const fileInputId = useId();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [languageStage, setLanguageStage] = useState(DEFAULT_LANGUAGE_STAGE);
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
        language_stage: languageStage === EMPTY_OPTION ? DEFAULT_LANGUAGE_STAGE : languageStage,
        morphology_profile: DEFAULT_MORPHOLOGY_PROFILE,
      },
      {
        onSuccess(response) {
          setTitle("");
          setFile(null);
          setLanguageStage(DEFAULT_LANGUAGE_STAGE);
          handleAcceptedStart({
            title: messages.upload.successTitle,
            description: response.message || messages.upload.successDescription,
            path: `${ROUTES.jobs}/${response.job.id}`,
            redirect: false,
            actionLabel: messages.job.openJob,
          });

          const linkedDocumentId = response.document?.id ?? response.job.document_id ?? null;
          const markedForMorphology =
            languageStage === "classical" || DEFAULT_MORPHOLOGY_PROFILE === "xcl_pie";

          if (linkedDocumentId && markedForMorphology) {
            toast.success(messages.upload.morphologyCtaTitle, {
              description: messages.upload.morphologyCtaDescription,
              action: {
                label: messages.upload.morphologyCtaAction,
                onClick: () => router.push(href(`${ROUTES.documents}/${linkedDocumentId}`)),
              },
            });
          }
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language-stage">{messages.upload.languageStage}</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              id="language-stage"
              onChange={(event) => setLanguageStage(event.target.value)}
              value={languageStage}
            >
              <option value={EMPTY_OPTION}>{messages.upload.languageStageOptions.unknown}</option>
              <option value="classical">{messages.upload.languageStageOptions.classical}</option>
              <option value="modern">{messages.upload.languageStageOptions.modern}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="morphology-profile">{messages.upload.morphologyProfile}</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-muted/40 px-4 py-2 text-sm text-muted-foreground outline-none transition-colors"
              disabled
              id="morphology-profile"
              value={DEFAULT_MORPHOLOGY_PROFILE}
            >
              <option value="xcl_pie">{messages.upload.profileOptions.xclPie}</option>
            </select>
            {/* TODO: Re-enable profile selection when more morphology tools are available. */}
          </div>
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
          <p className="text-xs text-muted-foreground">{messages.upload.morphologyHelp}</p>
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
