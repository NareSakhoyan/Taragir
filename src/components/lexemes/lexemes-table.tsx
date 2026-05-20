"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { ReferenceMatchBadge } from "@/components/lexicon/reference-match-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { LexemeSummary } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatDate, formatNumber } from "@/lib/utils/format";

type LexemesTableProps = {
  lexemes: LexemeSummary[];
  sortKey: LexemeSortKey | null;
  sortDirection: SortDirection | null;
  onSort: (key: LexemeSortKey) => void;
  showReferenceSummary?: boolean;
};

export type LexemeSortKey =
  | "canonical_form"
  | "canonical_normalized_form"
  | "status"
  | "form_count"
  | "occurrence_count"
  | "created_at";

export type SortDirection = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: LexemeSortKey;
  activeSortKey: LexemeSortKey | null;
  direction: SortDirection | null;
  onSort: (key: LexemeSortKey) => void;
}) {
  const active = activeSortKey === sortKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead>
      <button
        className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onSort(sortKey)}
        type="button"
      >
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

export function LexemesTable({
  lexemes,
  sortKey,
  sortDirection,
  onSort,
  showReferenceSummary = false,
}: LexemesTableProps) {
  const router = useRouter();
  const { href, locale, messages } = useI18n();

  if (!lexemes.length) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
        <p className="font-medium">{messages.lexemes.emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{messages.lexemes.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-md border border-border/80 shadow-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexemes.table.canonicalForm} onSort={onSort} sortKey="canonical_form" />
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexemes.table.canonicalNormalizedForm} onSort={onSort} sortKey="canonical_normalized_form" />
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexemes.table.status} onSort={onSort} sortKey="status" />
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexemes.table.formCount} onSort={onSort} sortKey="form_count" />
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexemes.table.occurrenceCount} onSort={onSort} sortKey="occurrence_count" />
              <TableHead>{messages.lexemes.table.reference}</TableHead>
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexemes.table.createdAt} onSort={onSort} sortKey="created_at" />
              <TableHead className="text-right">{messages.lexemes.table.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lexemes.map((lexeme) => (
              <TableRow
                className="cursor-pointer"
                key={lexeme.id}
                onClick={() => router.push(href(`${ROUTES.lexemes}/${lexeme.id}`))}
              >
                <TableCell className="font-semibold [overflow-wrap:anywhere]">{lexeme.canonical_form}</TableCell>
                <TableCell className="text-xs [overflow-wrap:anywhere]">{lexeme.canonical_normalized_form}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{lexeme.status}</Badge>
                </TableCell>
                <TableCell>{formatNumber(lexeme.form_count, locale)}</TableCell>
                <TableCell>{formatNumber(lexeme.occurrence_count, locale)}</TableCell>
                <TableCell className="min-w-[14rem]">
                  {showReferenceSummary ? (
                    <ReferenceMatchBadge
                      bestMatch={lexeme.best_reference_match}
                      compact
                      hasMatch={lexeme.has_reference_match}
                      matchCount={lexeme.reference_match_count}
                      showUnmatched
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{messages.lexemes.referenceOnDetail}</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(lexeme.created_at, locale)}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={href(`${ROUTES.lexemes}/${lexeme.id}`)}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button size="sm" variant="outline">
                      {messages.lexemes.openDetail}
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {lexemes.map((lexeme) => (
          <div
            className="surface cursor-pointer rounded-md border border-border/80 p-4 shadow-sm"
            key={lexeme.id}
            onClick={() => router.push(href(`${ROUTES.lexemes}/${lexeme.id}`))}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold [overflow-wrap:anywhere]">{lexeme.canonical_form}</p>
                <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{lexeme.canonical_normalized_form}</p>
              </div>
              <Badge variant="secondary">{lexeme.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{formatNumber(lexeme.form_count, locale)} {messages.lexemes.counts.forms}</span>
              <span>{formatNumber(lexeme.occurrence_count, locale)} {messages.lexemes.counts.occurrences}</span>
              <span>{formatDate(lexeme.created_at, locale)}</span>
            </div>
            {showReferenceSummary ? (
              <div className="mt-4">
                <ReferenceMatchBadge
                  bestMatch={lexeme.best_reference_match}
                  compact
                  hasMatch={lexeme.has_reference_match}
                  matchCount={lexeme.reference_match_count}
                  showUnmatched
                />
              </div>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Link href={href(`${ROUTES.lexemes}/${lexeme.id}`)} onClick={(event) => event.stopPropagation()}>
                <Button size="sm" variant="outline">
                  {messages.lexemes.openDetail}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
