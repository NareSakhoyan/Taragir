"use client";

import { FileText } from "lucide-react";

import { useI18n } from "@/lib/i18n/use-i18n";
import type { DocumentPageRead } from "@/lib/types/api";
import { cn } from "@/lib/utils/classnames";
import { formatNumber } from "@/lib/utils/format";

type PageListProps = {
  pages: DocumentPageRead[];
  selectedPageId: string | null;
  onSelectPage: (page: DocumentPageRead) => void;
};

export function PageList({ pages, selectedPageId, onSelectPage }: PageListProps) {
  const { locale, messages } = useI18n();

  if (!pages.length) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background/60 px-5 py-8 text-sm text-muted-foreground">
        {messages.documentDetail.pagesPending}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pages.map((page) => {
        const active = page.id === selectedPageId;

        return (
          <button
            className={cn(
              "flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors",
              active ? "border-primary bg-primary/10" : "border-border bg-background/70 hover:bg-secondary/60",
            )}
            key={page.id}
            onClick={() => onSelectPage(page)}
            type="button"
          >
            <div className="mt-1 rounded-md bg-secondary p-2 text-secondary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {messages.documentDetail.pageLabel} {page.page_number}
              </p>
              <p className="text-xs text-muted-foreground">
                {messages.extractionMethod[page.extraction_method]} • {formatNumber(page.char_count, locale)} {messages.documentDetail.chars}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
