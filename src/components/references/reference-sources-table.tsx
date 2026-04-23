"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceSourceSummary } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatNumber, humanizeSnakeCase } from "@/lib/utils/format";

type ReferenceSourcesTableProps = {
  sources: ReferenceSourceSummary[];
};

export function ReferenceSourcesTable({ sources }: ReferenceSourcesTableProps) {
  const { href, locale, messages } = useI18n();

  if (!sources.length) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
        <p className="font-medium">{messages.references.noSourcesTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{messages.references.noSourcesDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-md border border-border/80 shadow-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{messages.references.table.displayName}</TableHead>
              <TableHead>{messages.references.table.sourceType}</TableHead>
              <TableHead>{messages.references.table.language}</TableHead>
              <TableHead>{messages.references.table.entryCount}</TableHead>
              <TableHead>{messages.references.table.createdAt}</TableHead>
              <TableHead className="text-right">{messages.references.table.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-semibold [overflow-wrap:anywhere]">{source.display_name}</p>
                    {source.description ? (
                      <p className="max-w-xl text-xs text-muted-foreground [overflow-wrap:anywhere]">{source.description}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{humanizeSnakeCase(source.source_type)}</TableCell>
                <TableCell>{source.language || "—"}</TableCell>
                <TableCell>{source.entry_count == null ? "—" : formatNumber(source.entry_count, locale)}</TableCell>
                <TableCell>{formatDate(source.created_at, locale)}</TableCell>
                <TableCell className="text-right">
                  <Link href={href(`${ROUTES.references}/${source.id}`)}>
                    <Button size="sm" variant="outline">
                      {messages.references.openDetail}
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {sources.map((source) => (
          <div className="surface rounded-md border border-border/80 p-4 shadow-sm" key={source.id}>
            <div className="space-y-2">
              <p className="font-semibold [overflow-wrap:anywhere]">{source.display_name}</p>
              {source.description ? (
                <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{source.description}</p>
              ) : null}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <p>{messages.references.table.sourceType}: {humanizeSnakeCase(source.source_type)}</p>
              <p>{messages.references.table.language}: {source.language || "—"}</p>
              <p>{messages.references.table.entryCount}: {source.entry_count == null ? "—" : formatNumber(source.entry_count, locale)}</p>
              <p>{messages.references.table.createdAt}: {formatDate(source.created_at, locale)}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href={href(`${ROUTES.references}/${source.id}`)}>
                <Button size="sm" variant="outline">
                  {messages.references.openDetail}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
