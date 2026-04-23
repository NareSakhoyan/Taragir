"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";
import { CreateLexemeDialog } from "@/components/lexicon/create-lexeme-dialog";
import { LexiconGroupDetailSheet } from "@/components/lexicon/lexicon-group-detail-sheet";
import { LexiconGroupsTable, type LexiconGroupSortKey, type SortDirection } from "@/components/lexicon/lexicon-groups-table";
import { MergeIntoLexemeDialog } from "@/components/lexicon/merge-into-lexeme-dialog";
import { ReferenceMatchesSheet } from "@/components/lexicon/reference-matches-sheet";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableLoadingState } from "@/components/ui/table-loading-state";
import { TablePagination } from "@/components/ui/table-pagination";
import { useDocumentsSummary } from "@/lib/hooks/use-documents";
import { useIgnoreLexiconGroups, useLexiconGroups, useUnignoreLexiconGroups } from "@/lib/hooks/use-lexicon-groups";
import { useLexiconGroupReferenceMatches } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import type { LexiconView, ReferenceStatusFilter } from "@/lib/types/api";
import { LEXICON_GROUPS_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { titleFromDocument } from "@/lib/utils/format";

export default function LexiconPage() {
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();
  const searchParam = searchParams.get("search") ?? "";
  const detailParam = searchParams.get("detail");
  const documentsQuery = useDocumentsSummary();
  const [draftSearch, setDraftSearch] = useState(searchParam);
  const [search, setSearch] = useState(searchParam);
  const [view, setView] = useState<LexiconView>("candidates");
  const [documentId, setDocumentId] = useState("");
  const [referenceStatus, setReferenceStatus] = useState<ReferenceStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(LEXICON_GROUPS_PAGE_SIZE);
  const [sortKey, setSortKey] = useState<LexiconGroupSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [detailForm, setDetailForm] = useState<string | null>(detailParam);
  const [referenceMatchForm, setReferenceMatchForm] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const ignoreMutation = useIgnoreLexiconGroups();
  const unignoreMutation = useUnignoreLexiconGroups();
  const offset = (currentPage - 1) * pageSize;

  const lexiconQuery = useLexiconGroups({
    search: search || undefined,
    view,
    document_id: documentId || undefined,
    reference_status: referenceStatus,
    limit: pageSize,
    offset,
  });
  const referenceMatchesQuery = useLexiconGroupReferenceMatches(referenceMatchForm, Boolean(referenceMatchForm));
  const isLexiconTableTransitioning = lexiconQuery.isFetching && lexiconQuery.isPlaceholderData;

  const total = lexiconQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedCount = selectedForms.length;
  const pluralSuffix = locale === "hy" ? (selectedCount === 1 ? "" : "եր") : selectedCount === 1 ? "" : "s";

  const documentOptions = useMemo(
    () =>
      (documentsQuery.data ?? []).map((document) => ({
        id: document.id,
        label: titleFromDocument(document),
      })),
    [documentsQuery.data],
  );

  const viewOptions: { value: LexiconView; label: string }[] = [
    { value: "candidates", label: messages.lexicon.views.candidates },
    { value: "linked", label: messages.lexicon.views.linked },
    { value: "suspicious", label: messages.lexicon.views.suspicious },
    { value: "ignored", label: messages.lexicon.views.ignored },
    { value: "all", label: messages.lexicon.views.all },
  ];

  const canCurate = view === "candidates" || view === "suspicious" || view === "all";
  const canUnignore = view === "ignored";

  const selectedDescription = selectedCount
    ? messages.lexicon.selectedGroupsDescription
        .replace("{count}", selectedCount.toLocaleString(locale))
        .replace("{suffix}", pluralSuffix)
    : canUnignore
      ? messages.lexicon.selectedIgnoredEmpty
      : view === "linked"
        ? messages.lexicon.selectedLinkedEmpty
        : messages.lexicon.selectedGroupsEmpty;
  const isBulkMutating = ignoreMutation.isPending || unignoreMutation.isPending;
  const emptyDescription =
    view === "candidates"
      ? messages.lexicon.emptyStates.candidates
      : view === "suspicious"
        ? messages.lexicon.emptyStates.suspicious
        : view === "ignored"
          ? messages.lexicon.emptyStates.ignored
          : view === "linked"
            ? messages.lexicon.emptyStates.linked
            : messages.lexicon.emptyStates.all;

  const sortedGroups = useMemo(() => {
    const items = [...(lexiconQuery.data?.items ?? [])];

    if (!sortKey || !sortDirection) {
      return items;
    }

    const multiplier = sortDirection === "asc" ? 1 : -1;

    return items.sort((left, right) => {
      switch (sortKey) {
        case "normalized_form":
          return left.normalized_form.localeCompare(right.normalized_form, locale) * multiplier;
        case "occurrence_count":
          return (left.occurrence_count - right.occurrence_count) * multiplier;
        case "page_count":
          return (left.page_count - right.page_count) * multiplier;
        case "group_state":
          return left.group_state.localeCompare(right.group_state, locale) * multiplier;
        case "dominant_script_type":
          return left.dominant_script_type.localeCompare(right.dominant_script_type, locale) * multiplier;
        case "is_suspicious":
          return (Number(left.is_suspicious) - Number(right.is_suspicious)) * multiplier;
      }
    });
  }, [lexiconQuery.data?.items, locale, sortDirection, sortKey]);

  function changeSort(nextKey: LexiconGroupSortKey) {
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

  function openReferenceMatches(normalizedForm: string) {
    setDetailForm(null);
    setReferenceMatchForm(normalizedForm);
  }

  async function handleIgnoreSelected() {
    if (!selectedForms.length) {
      return;
    }

    try {
      await ignoreMutation.mutateAsync({ normalized_forms: selectedForms });
      toast.success(messages.lexicon.actions.ignoreSuccessTitle, {
        description: messages.lexicon.actions.ignoreSuccessDescription
          .replace("{count}", selectedForms.length.toLocaleString(locale))
          .replace("{suffix}", pluralSuffix),
      });
      setSelectedForms([]);
    } catch (error) {
      toast.error(messages.lexicon.actions.ignoreFailed, {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function handleUnignoreSelected() {
    if (!selectedForms.length) {
      return;
    }

    try {
      await unignoreMutation.mutateAsync({ normalized_forms: selectedForms });
      toast.success(messages.lexicon.actions.unignoreSuccessTitle, {
        description: messages.lexicon.actions.unignoreSuccessDescription
          .replace("{count}", selectedForms.length.toLocaleString(locale))
          .replace("{suffix}", pluralSuffix),
      });
      setSelectedForms([]);
    } catch (error) {
      toast.error(messages.lexicon.actions.unignoreFailed, {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <AuthGuard>
      <AppShell description={messages.lexicon.description} title={messages.lexicon.title}>
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">{messages.lexicon.discoveryGroupsTitle}</h2>
                <p className="text-sm text-muted-foreground">{messages.lexicon.discoveryGroupsDescription}</p>
              </div>

              <form
                className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSelectedForms([]);
                  setCurrentPage(1);
                  setSearch(draftSearch.trim());
                }}
              >
                <Input
                  onChange={(event) => setDraftSearch(event.target.value)}
                  placeholder={messages.lexicon.searchPlaceholder}
                  value={draftSearch}
                />
                <Button type="submit" variant="outline">
                  <Search className="h-4 w-4" />
                  {messages.common.search}
                </Button>
              </form>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem_14rem]">
              <div className="flex flex-wrap gap-2">
                {viewOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => {
                      setSelectedForms([]);
                      if (
                        option.value !== "suspicious" &&
                        (sortKey === "dominant_script_type" || sortKey === "is_suspicious")
                      ) {
                        setSortKey(null);
                        setSortDirection(null);
                      }
                      setView(option.value);
                      setCurrentPage(1);
                    }}
                    type="button"
                    variant={view === option.value ? "default" : "outline"}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <select
                className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={documentsQuery.isLoading}
                onChange={(event) => {
                  setSelectedForms([]);
                  setDocumentId(event.target.value);
                  setCurrentPage(1);
                }}
                value={documentId}
              >
                <option value="">{messages.lexicon.filters.allDocuments}</option>
                {documentOptions.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.label}
                  </option>
                ))}
              </select>

              <select
                className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  setSelectedForms([]);
                  setReferenceStatus(event.target.value as ReferenceStatusFilter);
                  setCurrentPage(1);
                }}
                value={referenceStatus}
              >
                <option value="all">{messages.lexicon.filters.referenceLabel}: {messages.lexicon.filters.allReferenceStatuses}</option>
                <option value="matched">{messages.lexicon.filters.referenceLabel}: {messages.lexicon.filters.matchedReferenceStatuses}</option>
                <option value="unmatched">{messages.lexicon.filters.referenceLabel}: {messages.lexicon.filters.unmatchedReferenceStatuses}</option>
              </select>
            </div>
          </section>

          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{messages.lexicon.selectedGroupsTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedDescription}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canCurate ? (
                  <>
                    <Button disabled={!selectedCount} onClick={() => setCreateDialogOpen(true)} type="button">
                      {messages.lexicon.createLexeme}
                    </Button>
                    <Button disabled={!selectedCount} onClick={() => setMergeDialogOpen(true)} type="button" variant="outline">
                      {messages.lexicon.mergeIntoExisting}
                    </Button>
                    <Button
                      disabled={!selectedCount || isBulkMutating}
                      onClick={handleIgnoreSelected}
                      type="button"
                      variant="outline"
                    >
                      {messages.lexicon.ignore}
                    </Button>
                  </>
                ) : null}
                {canUnignore ? (
                  <Button
                    disabled={!selectedCount || isBulkMutating}
                    onClick={handleUnignoreSelected}
                    type="button"
                    variant="outline"
                  >
                    {messages.lexicon.unignore}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              {lexiconQuery.isLoading || isLexiconTableTransitioning ? (
                <TableLoadingState />
              ) : lexiconQuery.error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                  {lexiconQuery.error.message}
                </div>
              ) : (
                <LexiconGroupsTable
                  currentView={view}
                  emptyDescription={emptyDescription}
                  emptyTitle={messages.lexicon.table.emptyTitle}
                  groups={sortedGroups}
                  onSelectedFormsChange={setSelectedForms}
                  onSort={changeSort}
                  onViewDetails={setDetailForm}
                  onViewMatches={openReferenceMatches}
                  selectedForms={selectedForms}
                  sortDirection={sortDirection}
                  sortKey={sortKey}
                />
              )}
            </div>

            <TablePagination
              currentPage={currentPage}
              onPageChange={(page) => {
                setSelectedForms([]);
                setCurrentPage(page);
              }}
              onPageSizeChange={(size) => {
                setSelectedForms([]);
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSize={pageSize}
              pageSizeOptions={[...TABLE_PAGE_SIZE_OPTIONS]}
              totalPages={totalPages}
              isBusy={isLexiconTableTransitioning}
            />
          </section>
        </div>

        <LexiconGroupDetailSheet
          normalizedForm={detailForm}
          onOpenChange={(open) => !open && setDetailForm(null)}
          onViewMatches={openReferenceMatches}
          open={Boolean(detailForm)}
        />
        <ReferenceMatchesSheet
          errorMessage={referenceMatchesQuery.error?.message ?? null}
          hasMatch={referenceMatchesQuery.data?.has_match ?? false}
          isLoading={referenceMatchesQuery.isLoading}
          matches={referenceMatchesQuery.data?.matches ?? []}
          onOpenChange={(open) => !open && setReferenceMatchForm(null)}
          open={Boolean(referenceMatchForm)}
          targetLabel={messages.reference.labels.targetNormalizedForm}
          targetValue={referenceMatchesQuery.data?.target_normalized_form ?? referenceMatchForm ?? ""}
          title={messages.reference.actions.viewMatches}
        />
        <CreateLexemeDialog onOpenChange={setCreateDialogOpen} open={createDialogOpen} selectedNormalizedForms={selectedForms} />
        <MergeIntoLexemeDialog onOpenChange={setMergeDialogOpen} open={mergeDialogOpen} selectedNormalizedForms={selectedForms} />
      </AppShell>
    </AuthGuard>
  );
}
