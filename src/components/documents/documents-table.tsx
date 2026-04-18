"use client";

import Link from "next/link";

import { DocumentCard } from "@/components/documents/document-card";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getRememberedDocumentJobLink } from "@/lib/supabase/session";
import type { DocumentRead } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatNumber, titleFromDocument } from "@/lib/utils/format";

type DocumentsTableProps = {
  documents: DocumentRead[];
  title: string;
  description: string;
  emptyMessage: string;
};

export function DocumentsTable({ documents, title, description, emptyMessage }: DocumentsTableProps) {
  const { href, locale, messages } = useI18n();

  return (
    <section className="w-full">
      <header className="mb-8 border-b border-border/70 pb-6">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="space-y-4">
        {documents.length ? (
          <>
            <div className="hidden overflow-hidden rounded-md border border-border/80 shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{messages.documents.columns.title}</TableHead>
                    <TableHead>{messages.documents.columns.originalFilename}</TableHead>
                    <TableHead>{messages.documents.columns.status}</TableHead>
                    <TableHead>{messages.documents.columns.pageCount}</TableHead>
                    <TableHead>{messages.documents.columns.createdAt}</TableHead>
                    <TableHead className="text-right">{messages.documents.columns.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => {
                    const rememberedJobId = getRememberedDocumentJobLink(document.id);
                    const issueHref =
                      document.status === "failed" && rememberedJobId
                        ? href(`${ROUTES.jobs}/${rememberedJobId}`)
                        : href(`${ROUTES.documents}/${document.id}`);

                    return (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{titleFromDocument(document)}</TableCell>
                      <TableCell className="text-muted-foreground">{document.original_filename}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <DocumentStatusBadge status={document.status} />
                          {document.status === "failed" ? (
                            <p className="text-xs text-destructive">{messages.documents.failedHelper}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(document.page_count ?? 0, locale)}</TableCell>
                      <TableCell>{formatDate(document.created_at, locale)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={issueHref}>
                          <Button size="sm" variant="outline">
                            {document.status === "failed" ? messages.documents.viewIssue : messages.documents.open}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {documents.map((document) => (
                <DocumentCard document={document} key={document.id} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
            <p className="font-medium">{messages.documents.noDocumentsYet}</p>
            <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}
