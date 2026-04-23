"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceMatchingRunSummary } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatNumber } from "@/lib/utils/format";

type MatchRunsTableProps = {
  runs: ReferenceMatchingRunSummary[];
};

function getScopeLabel(
  scope: ReferenceMatchingRunSummary["run_scope"],
  messages: ReturnType<typeof useI18n>["messages"],
) {
  return messages.referenceMatching.scope[scope];
}

function getStatusBadgeVariant(status: ReferenceMatchingRunSummary["status"]) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "queued":
    default:
      return "border-border bg-muted/20 text-foreground";
  }
}

export function MatchRunsTable({ runs }: MatchRunsTableProps) {
  const { href, locale, messages } = useI18n();

  if (!runs.length) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
        <p className="font-medium">{messages.referenceMatching.emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{messages.referenceMatching.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-md border border-border/80 shadow-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{messages.referenceMatching.table.createdAt}</TableHead>
              <TableHead>{messages.referenceMatching.table.scope}</TableHead>
              <TableHead>{messages.referenceMatching.table.status}</TableHead>
              <TableHead>{messages.referenceMatching.table.totalItems}</TableHead>
              <TableHead>{messages.referenceMatching.table.matchedItems}</TableHead>
              <TableHead className="text-right">{messages.referenceMatching.table.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>{formatDate(run.created_at, locale)}</TableCell>
                <TableCell>{getScopeLabel(run.run_scope, messages)}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeVariant(run.status)} variant="outline">
                    {messages.status[run.status]}
                  </Badge>
                </TableCell>
                <TableCell>{run.total_items == null ? "—" : formatNumber(run.total_items, locale)}</TableCell>
                <TableCell>{run.matched_items == null ? "—" : formatNumber(run.matched_items, locale)}</TableCell>
                <TableCell className="text-right">
                  <Link href={href(`${ROUTES.referenceMatching}/${run.id}`)}>
                    <Button size="sm" variant="outline">
                      {messages.referenceMatching.openDetail}
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {runs.map((run) => (
          <div className="surface rounded-md border border-border/80 p-4 shadow-sm" key={run.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold">{getScopeLabel(run.run_scope, messages)}</p>
                <p className="text-sm text-muted-foreground">{formatDate(run.created_at, locale)}</p>
              </div>
              <Badge className={getStatusBadgeVariant(run.status)} variant="outline">
                {messages.status[run.status]}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <p>{messages.referenceMatching.table.totalItems}: {run.total_items == null ? "—" : formatNumber(run.total_items, locale)}</p>
              <p>{messages.referenceMatching.table.matchedItems}: {run.matched_items == null ? "—" : formatNumber(run.matched_items, locale)}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href={href(`${ROUTES.referenceMatching}/${run.id}`)}>
                <Button size="sm" variant="outline">
                  {messages.referenceMatching.openDetail}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
