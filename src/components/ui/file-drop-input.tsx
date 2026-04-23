"use client";

import { UploadCloud } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/classnames";

type FileDropInputProps = {
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  placeholder: string;
  disabled?: boolean;
  id?: string;
  isFileAccepted?: (file: File) => boolean;
  onFileRejected?: (file: File) => void;
  className?: string;
};

export function FileDropInput({
  accept,
  file,
  onFileChange,
  placeholder,
  disabled = false,
  id,
  isFileAccepted,
  onFileRejected,
  className,
}: FileDropInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [file]);

  function openFilePicker() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  function updateFile(nextFile: File | null, syncInput = false) {
    if (!nextFile) {
      onFileChange(null);
      return;
    }

    if (isFileAccepted && !isFileAccepted(nextFile)) {
      onFileRejected?.(nextFile);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    onFileChange(nextFile);

    if (syncInput && inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(nextFile);
      inputRef.current.files = dataTransfer.files;
    }
  }

  function onDragEnter(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) {
      return;
    }

    dragDepth.current += 1;
    setIsDragging(true);
  }

  function onDragLeave(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current -= 1;

    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }

  function onDragOver(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);

    if (disabled) {
      return;
    }

    updateFile(event.dataTransfer.files?.[0] ?? null, true);
  }

  return (
    <div className={className}>
      <Input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        onChange={(event) => updateFile(event.target.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />

      <button
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-background/80 px-4 py-10 text-center shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          isDragging
            ? "border-primary bg-muted/40 shadow-md"
            : file
              ? "border-primary/60 bg-muted/20"
              : "border-input hover:border-primary/50 hover:bg-muted/30",
        )}
        disabled={disabled}
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
        type="button"
      >
        <UploadCloud
          aria-hidden
          className={cn("h-9 w-9 text-muted-foreground", isDragging && "text-primary")}
        />
        <span className="text-sm text-muted-foreground">{placeholder}</span>
        {file ? (
          <span className="max-w-full truncate px-2 text-sm font-medium text-foreground" title={file.name}>
            {file.name}
          </span>
        ) : null}
      </button>
    </div>
  );
}
