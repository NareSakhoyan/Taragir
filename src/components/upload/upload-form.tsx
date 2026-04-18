"use client";

import { LoaderCircle, UploadCloud } from "lucide-react";
import { startTransition, useCallback, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { useUploadDocumentMutation } from "@/lib/hooks/use-documents";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ACCEPTED_FILE_INPUT, ACCEPTED_FILE_TYPES, ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/classnames";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const mutation = useUploadDocumentMutation();
  const { href, messages } = useI18n();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    file?: string;
    form?: string;
  }>({});

  const assignFile = useCallback(
    (next: File | null) => {
      if (next && !isAcceptedFile(next)) {
        setErrors((current) => ({ ...current, file: messages.upload.invalidFileError }));
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors.file;
        return nextErrors;
      });
      setFile(next);
    },
    [messages.upload.invalidFileError],
  );

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    assignFile(event.target.files?.[0] ?? null);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) {
      assignFile(null);
      return;
    }
    assignFile(dropped);
    if (fileInputRef.current && isAcceptedFile(dropped)) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(dropped);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

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
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          toast.success(messages.upload.successTitle, {
            description: messages.upload.successDescription.replace("{jobId}", response.job.id.slice(0, 8)),
          });
          startTransition(() => {
            router.push(href(`${ROUTES.jobs}/${response.job.id}`));
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
          <Input
            ref={fileInputRef}
            accept={ACCEPTED_FILE_INPUT}
            className="sr-only"
            id={fileInputId}
            type="file"
            onChange={onFileInputChange}
          />
          <button
            className={cn(
                "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-background/80 px-4 py-10 text-center shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isDragging
                ? "border-primary bg-muted/40 shadow-md"
                : file
                  ? "border-primary/60 bg-muted/20"
                  : "border-input hover:border-primary/50 hover:bg-muted/30",
            )}
            type="button"
            onClick={openFilePicker}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFilePicker();
              }
            }}
          >
            <UploadCloud
              aria-hidden
              className={cn("h-9 w-9 text-muted-foreground", isDragging && "text-primary")}
            />
            <span className="text-sm text-muted-foreground">{messages.upload.dropzoneHint}</span>
            {file ? (
              <span className="max-w-full truncate px-2 text-sm font-medium text-foreground" title={file.name}>
                {file.name}
              </span>
            ) : null}
          </button>
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
