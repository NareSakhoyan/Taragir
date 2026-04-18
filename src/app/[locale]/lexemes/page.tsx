"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { LexemesTable, type LexemeSortKey, type SortDirection } from "@/components/lexemes/lexemes-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableLoadingState } from "@/components/ui/table-loading-state";
import { TablePagination } from "@/components/ui/table-pagination";
import { useLexemes } from "@/lib/hooks/use-lexemes";
import { useI18n } from "@/lib/i18n/use-i18n";
import { LEXEMES_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";

export default function LexemesPage() {
  const { locale, messages } = useI18n();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(LEXEMES_PAGE_SIZE);
  const [sortKey, setSortKey] = useState<LexemeSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);
  const offset = (currentPage - 1) * pageSize;
  const lexemesQuery = useLexemes({
    search: search || undefined,
    limit: pageSize,
    offset,
  });

  const total = lexemesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const sortedLexemes = useMemo(() => {
    const items = [...(lexemesQuery.data?.items ?? [])];

    if (!sortKey || !sortDirection) {
      return items;
    }

    const multiplier = sortDirection === "asc" ? 1 : -1;

    return items.sort((left, right) => {
      switch (sortKey) {
        case "canonical_form":
          return left.canonical_form.localeCompare(right.canonical_form, locale) * multiplier;
        case "canonical_normalized_form":
          return left.canonical_normalized_form.localeCompare(right.canonical_normalized_form, locale) * multiplier;
        case "status":
          return left.status.localeCompare(right.status, locale) * multiplier;
        case "form_count":
          return (left.form_count - right.form_count) * multiplier;
        case "occurrence_count":
          return (left.occurrence_count - right.occurrence_count) * multiplier;
        case "created_at":
          return (new Date(left.created_at).getTime() - new Date(right.created_at).getTime()) * multiplier;
      }
    });
  }, [lexemesQuery.data?.items, locale, sortDirection, sortKey]);

  function changeSort(nextKey: LexemeSortKey) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortKey(null);
      setSortDirection(null);
      return;
    }

    setSortDirection("asc");
  }

  return (
    <AuthGuard>
      <AppShell description={messages.lexemes.description} title={messages.lexemes.title}>
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">{messages.lexemes.sectionTitle}</h2>
                <p className="text-sm text-muted-foreground">{messages.lexemes.sectionDescription}</p>
              </div>

              <form
                className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  setCurrentPage(1);
                  setSearch(draftSearch.trim());
                }}
              >
                <Input
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder={messages.lexemes.searchPlaceholder}
                  value={draftSearch}
                />
                <Button type="submit" variant="outline">
                  <Search className="h-4 w-4" />
                  {messages.common.search}
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            {lexemesQuery.isLoading ? (
              <TableLoadingState />
            ) : lexemesQuery.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                {lexemesQuery.error.message}
              </div>
            ) : (
              <LexemesTable
                lexemes={sortedLexemes}
                onSort={changeSort}
                sortDirection={sortDirection}
                sortKey={sortKey}
              />
            )}

            <TablePagination
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSize={pageSize}
              pageSizeOptions={[...TABLE_PAGE_SIZE_OPTIONS]}
              totalPages={totalPages}
            />
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
