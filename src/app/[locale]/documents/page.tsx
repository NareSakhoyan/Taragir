"use client";

import { useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DocumentsTable } from "@/components/documents/documents-table";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/lib/hooks/use-documents";
import { useI18n } from "@/lib/i18n/use-i18n";
import { DOCUMENT_PAGE_SIZE } from "@/lib/utils/constants";
import { formatNumber } from "@/lib/utils/format";

export default function DocumentsPage() {
  const { locale, messages } = useI18n();
  const [offset, setOffset] = useState(0);
  const documentsQuery = useDocuments({
    limit: DOCUMENT_PAGE_SIZE,
    offset,
  });

  const total = documentsQuery.data?.total ?? 0;
  const canGoBack = offset > 0;
  const canGoNext = offset + DOCUMENT_PAGE_SIZE < total;

  return (
    <AuthGuard>
      <AppShell title={messages.documents.title} description={messages.documents.description}>
        <div className="flex flex-col">
          {documentsQuery.isLoading ? (
            <Skeleton className="h-[32rem]" />
          ) : (
            <DocumentsTable
              description={messages.documents.tableDescription}
              documents={documentsQuery.data?.items ?? []}
              emptyMessage={messages.documents.tableEmpty}
              title={messages.documents.tableTitle}
            />
          )}

          <Separator className="my-10" />

          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              {messages.documents.showing
                .replace("{start}", documentsQuery.data ? formatNumber(offset + 1, locale) : "0")
                .replace("{end}", documentsQuery.data ? formatNumber(Math.min(offset + DOCUMENT_PAGE_SIZE, total), locale) : "0")
                .replace("{total}", formatNumber(total, locale))}
            </div>
            <div className="flex gap-2">
              <Button disabled={!canGoBack} onClick={() => setOffset((current) => Math.max(0, current - DOCUMENT_PAGE_SIZE))} variant="outline">
                {messages.common.previous}
              </Button>
              <Button disabled={!canGoNext} onClick={() => setOffset((current) => current + DOCUMENT_PAGE_SIZE)} variant="outline">
                {messages.common.next}
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
