"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";

import { GroupClassificationBadges } from "@/components/lexicon/group-classification-badges";
import { GroupLinkedBadge } from "@/components/lexicon/group-linked-badge";
import { GroupStateBadge } from "@/components/lexicon/group-state-badge";
import { ReferenceMatchBadge } from "@/components/lexicon/reference-match-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { LexiconGroupSummary, LexiconView } from "@/lib/types/api";
import { cn } from "@/lib/utils/classnames";
import { formatNumber, truncateText } from "@/lib/utils/format";
import { highlightTermsInText } from "@/lib/utils/highlight-snippet";

type LexiconGroupsTableProps = {
  groups: LexiconGroupSummary[];
  selectedForms: string[];
  onSelectedFormsChange: (forms: string[]) => void;
  onViewDetails: (normalizedForm: string) => void;
  onViewMatches: (normalizedForm: string) => void;
  sortKey: LexiconGroupSortKey | null;
  sortDirection: SortDirection | null;
  onSort: (key: LexiconGroupSortKey) => void;
  emptyTitle: string;
  emptyDescription: string;
  currentView: LexiconView;
  showReferenceSummary?: boolean;
};

export type LexiconGroupSortKey =
  | "normalized_form"
  | "occurrence_count"
  | "page_count"
  | "group_state"
  | "dominant_script_type"
  | "is_suspicious";

export type SortDirection = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: LexiconGroupSortKey;
  activeSortKey: LexiconGroupSortKey | null;
  direction: SortDirection | null;
  onSort: (key: LexiconGroupSortKey) => void;
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

function SampleTokens({ tokens }: { tokens: string[] }) {
  const { messages } = useI18n();

  if (!tokens.length) {
    return <span className="text-muted-foreground">{messages.lexicon.table.noSamples}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.slice(0, 4).map((token) => (
        <Badge
          className="max-w-full whitespace-normal px-3 py-1 text-center leading-snug [overflow-wrap:anywhere]"
          key={token}
          variant="outline"
        >
          {token}
        </Badge>
      ))}
    </div>
  );
}

function SampleDocuments({ titles }: { titles: string[] }) {
  const { messages } = useI18n();

  if (!titles.length) {
    return <span className="text-muted-foreground">{messages.lexicon.table.noDocuments}</span>;
  }

  return (
    <div className="space-y-1.5">
      {titles.slice(0, 3).map((title) => (
        <p className="text-sm text-foreground/90 [overflow-wrap:anywhere]" key={title}>
          {title}
        </p>
      ))}
    </div>
  );
}

export function LexiconGroupsTable({
  groups,
  selectedForms,
  onSelectedFormsChange,
  onViewDetails,
  onViewMatches,
  sortKey,
  sortDirection,
  onSort,
  emptyTitle,
  emptyDescription,
  currentView,
  showReferenceSummary = false,
}: LexiconGroupsTableProps) {
  const { locale, messages } = useI18n();
  const showReviewerSignals = currentView === "suspicious";

  const selectedSet = new Set(selectedForms);
  const allSelected = groups.length > 0 && groups.every((group) => selectedSet.has(group.normalized_form));

  function toggleAll(nextChecked: boolean) {
    onSelectedFormsChange(nextChecked ? groups.map((group) => group.normalized_form) : []);
  }

  function toggleOne(normalizedForm: string, nextChecked: boolean) {
    const next = new Set(selectedForms);

    if (nextChecked) {
      next.add(normalizedForm);
    } else {
      next.delete(normalizedForm);
    }

    onSelectedFormsChange([...next]);
  }

  if (!groups.length) {
    return (
      <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
        <p className="font-medium">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-md border border-border/80 shadow-sm lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <input
                  aria-label={messages.lexicon.table.selectAll}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  onChange={(event) => toggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                  type="checkbox"
                />
              </TableHead>
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexicon.table.normalizedForm} onSort={onSort} sortKey="normalized_form" />
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexicon.table.occurrences} onSort={onSort} sortKey="occurrence_count" />
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexicon.table.pages} onSort={onSort} sortKey="page_count" />
              <TableHead>{messages.lexicon.table.sampleTokens}</TableHead>
              <TableHead>{messages.lexicon.table.sourceDocuments}</TableHead>
              <TableHead>{messages.lexicon.table.reference}</TableHead>
              <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexicon.table.state} onSort={onSort} sortKey="group_state" />
              {showReviewerSignals ? (
                <>
                  <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexicon.table.classification} onSort={onSort} sortKey="dominant_script_type" />
                  <SortableHead activeSortKey={sortKey} direction={sortDirection} label={messages.lexicon.table.suspicious} onSort={onSort} sortKey="is_suspicious" />
                </>
              ) : null}
              <TableHead className="text-right">{messages.lexicon.table.action}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow
                className={cn(
                  "cursor-pointer",
                  selectedSet.has(group.normalized_form) && "bg-secondary/40",
                )}
                key={group.normalized_form}
                onClick={() => onViewDetails(group.normalized_form)}
              >
                <TableCell>
                  <input
                    aria-label={messages.lexicon.table.selectOne.replace("{normalizedForm}", group.normalized_form)}
                    checked={selectedSet.has(group.normalized_form)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    onChange={(event) => toggleOne(group.normalized_form, event.target.checked)}
                    onClick={(event) => event.stopPropagation()}
                    type="checkbox"
                  />
                </TableCell>
                <TableCell>
                  <div className="min-w-[12rem] space-y-1">
                    <p className="font-semibold tracking-tight [overflow-wrap:anywhere]">{group.normalized_form}</p>
                    {group.sample_contexts[0] ? (
                      <p className="max-w-md text-xs text-muted-foreground [overflow-wrap:anywhere]">
                        {highlightTermsInText(truncateText(group.sample_contexts[0], 96), [
                          group.normalized_form,
                          ...group.sample_tokens,
                        ])}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatNumber(group.occurrence_count, locale)}</TableCell>
                <TableCell>{formatNumber(group.page_count, locale)}</TableCell>
                <TableCell className="min-w-[12rem]">
                  <SampleTokens tokens={group.sample_tokens} />
                </TableCell>
                <TableCell className="min-w-[14rem]">
                  <SampleDocuments titles={group.sample_document_titles} />
                </TableCell>
                <TableCell className="min-w-[14rem]">
                  {showReferenceSummary ? (
                    <ReferenceMatchBadge
                      bestMatch={group.best_reference_match}
                      compact
                      hasMatch={group.has_reference_match}
                      matchCount={group.reference_match_count}
                      showUnmatched
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{messages.lexicon.referenceOnDetail}</span>
                  )}
                </TableCell>
                <TableCell>
                  <GroupStateBadge state={group.group_state} />
                </TableCell>
                {showReviewerSignals ? (
                  <>
                    <TableCell>
                      <GroupClassificationBadges scriptType={group.dominant_script_type} />
                    </TableCell>
                    <TableCell>
                      {group.is_suspicious ? (
                        <Badge variant="destructive">{messages.lexicon.badges.suspicious}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </>
                ) : null}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewMatches(group.normalized_form);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      {messages.reference.actions.viewMatches}
                    </Button>
                    {group.linked_lexeme_id ? (
                      <div onClick={(event) => event.stopPropagation()}>
                        <GroupLinkedBadge
                          linkedLexemeCanonicalForm={group.linked_lexeme_canonical_form}
                          linkedLexemeId={group.linked_lexeme_id}
                        />
                      </div>
                    ) : null}
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewDetails(group.normalized_form);
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">{messages.lexicon.table.viewDetails}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {groups.map((group) => (
          <div
            className="surface cursor-pointer rounded-md border border-border/80 p-4 shadow-sm"
            key={group.normalized_form}
            onClick={() => onViewDetails(group.normalized_form)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <input
                  aria-label={messages.lexicon.table.selectOne.replace("{normalizedForm}", group.normalized_form)}
                  checked={selectedSet.has(group.normalized_form)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  onChange={(event) => toggleOne(group.normalized_form, event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                  type="checkbox"
                />
                <div className="space-y-2">
                  <p className="font-semibold tracking-tight [overflow-wrap:anywhere]">{group.normalized_form}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{formatNumber(group.occurrence_count, locale)} {messages.lexicon.table.sampleLabelOccurrences}</span>
                    <span>{formatNumber(group.page_count, locale)} {messages.lexicon.table.sampleLabelPages}</span>
                  </div>
                  <SampleTokens tokens={group.sample_tokens} />
                  <SampleDocuments titles={group.sample_document_titles} />
                  <div className="flex flex-wrap gap-2">
                    {showReferenceSummary ? (
                      <ReferenceMatchBadge
                        bestMatch={group.best_reference_match}
                        compact
                        hasMatch={group.has_reference_match}
                        matchCount={group.reference_match_count}
                        showUnmatched
                      />
                    ) : null}
                    <GroupStateBadge state={group.group_state} />
                    {showReviewerSignals ? (
                      <>
                        <GroupClassificationBadges scriptType={group.dominant_script_type} />
                        {group.is_suspicious ? (
                          <Badge variant="destructive">{messages.lexicon.badges.suspicious}</Badge>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
              {group.linked_lexeme_id ? (
                <div onClick={(event) => event.stopPropagation()}>
                  <GroupLinkedBadge
                    linkedLexemeCanonicalForm={group.linked_lexeme_canonical_form}
                    linkedLexemeId={group.linked_lexeme_id}
                  />
                </div>
              ) : null}
            </div>

            {group.sample_contexts[0] ? (
              <p className="mt-4 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {highlightTermsInText(truncateText(group.sample_contexts[0], 140), [
                  group.normalized_form,
                  ...group.sample_tokens,
                ])}
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <div className="flex gap-2">
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewMatches(group.normalized_form);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {messages.reference.actions.viewMatches}
                </Button>
                <Button
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewDetails(group.normalized_form);
                  }}
                  size="icon"
                  variant="outline"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{messages.lexicon.table.viewDetails}</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
