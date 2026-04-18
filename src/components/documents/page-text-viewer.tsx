"use client";

import { ScrollText } from "lucide-react";

import { useI18n } from "@/lib/i18n/use-i18n";
import type { DocumentPageRead } from "@/lib/types/api";
import { formatNumber } from "@/lib/utils/format";

type PageTextViewerProps = {
  page: DocumentPageRead | null;
};

export function PageTextViewer({ page }: PageTextViewerProps) {
  const { locale, messages } = useI18n();

  return (
    <section className="flex min-h-[28rem] flex-col">
      <header className="mb-6 border-b border-border/70 pb-6">
        <h3 className="text-lg font-semibold tracking-tight">
          {page
            ? messages.pageViewer.titleWithPage.replace("{page}", String(page.page_number))
            : messages.pageViewer.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {page
            ? messages.pageViewer.descriptionWithPage
                .replace("{method}", messages.extractionMethod[page.extraction_method])
                .replace("{charCount}", formatNumber(page.char_count, locale))
            : messages.pageViewer.descriptionEmpty}
        </p>
      </header>

      {page ? (
        <div className="max-h-[34rem] overflow-y-auto rounded-md border border-border/80 bg-background/60 p-5 font-serif text-[15px] leading-7 shadow-sm whitespace-pre-wrap">
          {page.extracted_text || messages.pageViewer.noExtractedText}
        </div>
      ) : (
        <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/10 py-12 text-center shadow-sm">
          <ScrollText className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-medium">{messages.pageViewer.noPageSelected}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{messages.pageViewer.noPageSelectedDescription}</p>
        </div>
      )}
    </section>
  );
}
