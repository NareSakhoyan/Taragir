"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Locale } from "@/lib/i18n/config";
import type { DiscoveryCandidate } from "@/lib/types/api";
import { TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import {
  candidateTypeLabel,
  evidenceLabel,
  resolutionStatusLabel,
  reviewStatusLabel,
} from "@/lib/utils/discovery";
import { cn } from "@/lib/utils/classnames";
import { formatNumber } from "@/lib/utils/format";

type DiscoveryCopy = {
  actions: { view: string };
  columns: {
    actions: string;
    evidence: string;
    occurrences: string;
    ocrRisk: string;
    pages: string;
    resolution: string;
    review: string;
    score: string;
    type: string;
    word: string;
  };
  emptyDescription: string;
  emptyTitle: string;
};

type DiscoveryCandidatesTableProps = {
  candidates: DiscoveryCandidate[];
  copy: DiscoveryCopy;
  currentPage: number;
  errorMessage?: string | null;
  isAdmin: boolean;
  isFetching: boolean;
  locale: Locale;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSort: (key: DiscoveryCandidateSortKey) => void;
  onViewCandidate: (candidate: DiscoveryCandidate) => void;
  pageSize: number;
  sortDirection: SortDirection;
  sortKey: DiscoveryCandidateSortKey;
  totalPages: number;
};

export type DiscoveryCandidateSortKey =
  | "normalized_form"
  | "occurrence_count"
  | "page_count"
  | "candidate_type"
  | "resolution_status"
  | "ocr_risk_score"
  | "interest_score"
  | "review_status";

export type SortDirection = "asc" | "desc";

function SortableHead({
  activeSortKey,
  className,
  direction,
  label,
  onSort,
  sortKey,
}: {
  activeSortKey: DiscoveryCandidateSortKey;
  className?: string;
  direction: SortDirection;
  label: string;
  onSort: (key: DiscoveryCandidateSortKey) => void;
  sortKey: DiscoveryCandidateSortKey;
}) {
  const active = activeSortKey === sortKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => onSort(sortKey)}
        type="button"
      >
        <span>{label}</span>
        <Icon className={cn("h-3.5 w-3.5", active ? "text-foreground" : "text-muted-foreground")} />
      </button>
    </TableHead>
  );
}

export function DiscoveryCandidatesTable({
  candidates,
  copy,
  currentPage,
  errorMessage,
  isAdmin,
  isFetching,
  locale,
  onPageChange,
  onPageSizeChange,
  onSort,
  onViewCandidate,
  pageSize,
  sortDirection,
  sortKey,
  totalPages,
}: DiscoveryCandidatesTableProps) {
  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (!candidates.length) {
    if (isFetching) {
      return (
        <Card className="border-dashed bg-muted/10 px-6 py-12 text-center shadow-sm">
          <p className="font-medium">Loading discovery queue...</p>
          <p className="mt-2 text-sm text-muted-foreground">Candidate rows are being pulled from the discovery data.</p>
        </Card>
      );
    }

    return (
      <Card className="border-dashed bg-muted/10 px-6 py-12 text-center shadow-sm">
        <p className="font-medium">{copy.emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{copy.emptyDescription}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                activeSortKey={sortKey}
                direction={sortDirection}
                label={copy.columns.word}
                onSort={onSort}
                sortKey="normalized_form"
              />
              {!isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label="Why shown"
                  onSort={onSort}
                  sortKey="resolution_status"
                />
              ) : null}
              {!isAdmin ? <TableHead>Best evidence</TableHead> : null}
              <SortableHead
                activeSortKey={sortKey}
                direction={sortDirection}
                label={copy.columns.occurrences}
                onSort={onSort}
                sortKey="occurrence_count"
              />
              {isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label={copy.columns.pages}
                  onSort={onSort}
                  sortKey="page_count"
                />
              ) : null}
              {isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label={copy.columns.type}
                  onSort={onSort}
                  sortKey="candidate_type"
                />
              ) : null}
              {isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label={copy.columns.resolution}
                  onSort={onSort}
                  sortKey="resolution_status"
                />
              ) : null}
              {isAdmin ? <TableHead>{copy.columns.evidence}</TableHead> : null}
              {isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label={copy.columns.ocrRisk}
                  onSort={onSort}
                  sortKey="ocr_risk_score"
                />
              ) : null}
              {isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label={copy.columns.score}
                  onSort={onSort}
                  sortKey="interest_score"
                />
              ) : null}
              {isAdmin ? (
                <SortableHead
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label={copy.columns.review}
                  onSort={onSort}
                  sortKey="review_status"
                />
              ) : null}
              <TableHead className="text-right">{copy.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium [overflow-wrap:anywhere]">{candidate.normalized_form}</p>
                    {candidate.sample_tokens.length ? (
                      <p className="text-xs text-muted-foreground">{candidate.sample_tokens.slice(0, 3).join(", ")}</p>
                    ) : null}
                  </div>
                </TableCell>
                {!isAdmin ? (
                  <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                    {resolutionStatusLabel(candidate.resolution_status)}
                  </TableCell>
                ) : null}
                {!isAdmin ? (
                  <TableCell className="max-w-[18rem] text-xs text-muted-foreground">
                    {evidenceLabel(candidate)}
                  </TableCell>
                ) : null}
                <TableCell>{formatNumber(candidate.occurrence_count, locale)}</TableCell>
                {isAdmin ? <TableCell>{formatNumber(candidate.page_count, locale)}</TableCell> : null}
                {isAdmin ? (
                  <TableCell>
                    <Badge variant="outline">{candidateTypeLabel(candidate.candidate_type)}</Badge>
                  </TableCell>
                ) : null}
                {isAdmin ? <TableCell>{resolutionStatusLabel(candidate.resolution_status)}</TableCell> : null}
                {isAdmin ? (
                  <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                    {evidenceLabel(candidate)}
                  </TableCell>
                ) : null}
                {isAdmin ? <TableCell>{candidate.ocr_risk_score ?? "—"}</TableCell> : null}
                {isAdmin ? <TableCell>{Math.round(candidate.interest_score)}</TableCell> : null}
                {isAdmin ? <TableCell>{reviewStatusLabel(candidate.review_status)}</TableCell> : null}
                <TableCell className="text-right">
                  <Button onClick={() => onViewCandidate(candidate)} size="sm" type="button" variant="outline">
                    {copy.actions.view}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <TablePagination
        currentPage={currentPage}
        isBusy={isFetching}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSize={pageSize}
        pageSizeOptions={[...TABLE_PAGE_SIZE_OPTIONS]}
        totalPages={totalPages}
      />
    </div>
  );
}
