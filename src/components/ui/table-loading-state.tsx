"use client";

import { LoaderCircle } from "lucide-react";

import { useI18n } from "@/lib/i18n/use-i18n";

type TableLoadingStateProps = {
  label?: string;
  className?: string;
};

export function TableLoadingState({ label, className }: TableLoadingStateProps) {
  const { messages } = useI18n();

  return (
    <div
      className={`flex min-h-[24rem] items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 shadow-sm ${className ?? ""}`.trim()}
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {label ?? messages.common.loading}
      </div>
    </div>
  );
}
