"use client";

import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { OccurrenceRead, OffsetPagination } from "@/lib/types/api";
import { OCCURRENCES_PAGE_SIZE } from "@/lib/utils/constants";
import { formatNumber } from "@/lib/utils/format";

type OccurrenceFilterValues = {
  pageNumber: string;
  normalizedToken: string;
};

type OccurrencesTableProps = {
  data: OffsetPagination<OccurrenceRead> | undefined;
  filters: OccurrenceFilterValues;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage?: string;
  onApplyFilters: (filters: OccurrenceFilterValues) => void;
  onPageChange: (nextOffset: number) => void;
  onResetFilters: () => void;
};

export function OccurrencesTable({
  data,
  filters,
  isLoading,
  isFetching,
  errorMessage,
  onApplyFilters,
  onPageChange,
  onResetFilters,
}: OccurrencesTableProps) {
  const { locale, messages } = useI18n();
  const [draftFilters, setDraftFilters] = useState(filters);

  const total = data?.total ?? 0;
  const offset = data?.offset ?? 0;
  const canGoBack = offset > 0;
  const canGoNext = offset + OCCURRENCES_PAGE_SIZE < total;

  return (
    <section className="w-full border-t border-border/70 pt-10">
      <div className="mb-8 flex flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{messages.occurrences.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{messages.occurrences.description}</p>
        </div>

        <form
          className="grid w-full gap-3 md:grid-cols-[160px_minmax(0,1fr)_auto_auto] lg:max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            onApplyFilters(draftFilters);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="page-number-filter">{messages.occurrences.pageNumber}</Label>
            <Input
              id="page-number-filter"
              inputMode="numeric"
              placeholder={messages.occurrences.anyPage}
              value={draftFilters.pageNumber}
              onChange={(event) => setDraftFilters((current) => ({ ...current, pageNumber: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="normalized-token-filter">{messages.occurrences.normalizedToken}</Label>
            <Input
              id="normalized-token-filter"
              placeholder="օրինակ"
              value={draftFilters.normalizedToken}
              onChange={(event) => setDraftFilters((current) => ({ ...current, normalizedToken: event.target.value }))}
            />
          </div>

          <Button className="self-end" type="submit" variant="outline">
            <Search className="h-4 w-4" />
            {messages.occurrences.apply}
          </Button>

          <Button
            className="self-end"
            onClick={() => {
              const cleared = { pageNumber: "", normalizedToken: "" };
              setDraftFilters(cleared);
              onResetFilters();
            }}
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
            {messages.occurrences.reset}
          </Button>
        </form>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center text-sm text-muted-foreground shadow-sm">
            {messages.occurrences.loading}
          </div>
        ) : errorMessage ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm text-destructive shadow-sm">
            {errorMessage}
          </div>
        ) : data?.items.length ? (
          <>
            <div className="overflow-hidden rounded-md border border-border/80 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{messages.occurrences.columns.page}</TableHead>
                    <TableHead>{messages.occurrences.columns.token}</TableHead>
                    <TableHead>{messages.occurrences.columns.normalized}</TableHead>
                    <TableHead>{messages.occurrences.columns.context}</TableHead>
                    <TableHead>{messages.occurrences.columns.range}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((occurrence) => (
                    <TableRow key={occurrence.id}>
                      <TableCell>{occurrence.page_number}</TableCell>
                      <TableCell className="font-semibold">{occurrence.token}</TableCell>
                      <TableCell className="font-mono text-xs">{occurrence.normalized_token}</TableCell>
                      <TableCell className="max-w-xl text-muted-foreground">{occurrence.context_snippet}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {occurrence.char_start ?? "?"} - {occurrence.char_end ?? "?"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {messages.occurrences.showing
                  .replace("{start}", formatNumber(offset + 1, locale))
                  .replace("{end}", formatNumber(Math.min(offset + OCCURRENCES_PAGE_SIZE, total), locale))
                  .replace("{total}", formatNumber(total, locale))}
                {isFetching ? ` • ${messages.occurrences.refreshing}` : null}
              </div>

              <div className="flex gap-2">
                <Button disabled={!canGoBack} onClick={() => onPageChange(Math.max(offset - OCCURRENCES_PAGE_SIZE, 0))} variant="outline">
                  {messages.common.previous}
                </Button>
                <Button disabled={!canGoNext} onClick={() => onPageChange(offset + OCCURRENCES_PAGE_SIZE)} variant="outline">
                  {messages.common.next}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
            <p className="font-medium">{messages.occurrences.noOccurrences}</p>
            <p className="mt-2 text-sm text-muted-foreground">{messages.occurrences.noOccurrencesDescription}</p>
          </div>
        )}
      </div>
    </section>
  );
}
