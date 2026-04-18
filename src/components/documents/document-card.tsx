"use client";

import Link from "next/link";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";
import { getRememberedDocumentJobLink } from "@/lib/supabase/session";
import type { DocumentRead } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatNumber, titleFromDocument } from "@/lib/utils/format";

type DocumentCardProps = {
  document: DocumentRead;
};

export function DocumentCard({ document }: DocumentCardProps) {
  const { href, locale, messages } = useI18n();
  const rememberedJobId = getRememberedDocumentJobLink(document.id);
  const issueHref =
    document.status === "failed" && rememberedJobId
      ? href(`${ROUTES.jobs}/${rememberedJobId}`)
      : href(`${ROUTES.documents}/${document.id}`);

  return (
    <div className="border-b border-border/70 py-5 last:border-b-0 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{titleFromDocument(document)}</p>
          <p className="text-sm text-muted-foreground">{document.original_filename}</p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>

      {document.status === "failed" ? (
        <p className="mt-2 text-sm text-destructive">{messages.documents.failedHelper}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">{messages.documents.pages}</p>
          <p>{formatNumber(document.page_count ?? 0, locale)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{messages.documents.created}</p>
          <p>{formatDate(document.created_at, locale)}</p>
        </div>
      </div>

      <Link className="mt-4 block" href={issueHref}>
        <Button className="w-full" variant="outline">
          {document.status === "failed" ? messages.documents.viewIssue : messages.documents.viewDetails}
        </Button>
      </Link>
    </div>
  );
}
