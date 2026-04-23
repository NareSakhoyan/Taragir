"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { WordCheckSummary } from "@/components/words/word-check-summary";
import { WordDetailDrawer } from "@/components/words/word-detail-drawer";
import { WordSearchResultsGroup } from "@/components/words/word-search-results-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWordCheck, useWordSearch } from "@/lib/hooks/use-words";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { WordEvidenceSummary, WordSearchCategory, WordSearchMode } from "@/lib/types/api";
import {
  WORD_SEARCH_CATEGORY_ORDER,
  getWordCategoryLabel,
  isWordSearchMode,
  parseWordSearchCategories,
  serializeWordSearchCategories,
} from "@/lib/utils/words";

const ALL_CATEGORIES: WordSearchCategory[] = [...WORD_SEARCH_CATEGORY_ORDER];
const WORD_SEARCH_BATCH_SIZE = 30;

function parseWordSearchLimit(value: string | null | undefined) {
  if (!value) {
    return WORD_SEARCH_BATCH_SIZE;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < WORD_SEARCH_BATCH_SIZE) {
    return WORD_SEARCH_BATCH_SIZE;
  }

  return parsed;
}

export function GlobalWordSearch() {
  const { messages } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const modeParam = searchParams.get("mode");
  const mode: WordSearchMode = isWordSearchMode(modeParam) ? modeParam : "normalized";
  const categories = parseWordSearchCategories(searchParams.get("categories"));
  const limit = parseWordSearchLimit(searchParams.get("limit"));
  const [selectedWord, setSelectedWord] = useState<WordEvidenceSummary | null>(null);

  function updateSearchState(
    updates: Partial<{
      q: string;
      mode: WordSearchMode;
      categories: WordSearchCategory[];
      limit: number;
    }>,
    historyMode: "push" | "replace" = "replace",
  ) {
    const nextParams = new URLSearchParams(searchParams.toString());

    const nextQuery = updates.q ?? query;
    const nextMode = updates.mode ?? mode;
    const nextCategories = updates.categories ?? categories;
    const nextLimit = updates.limit ?? limit;

    nextParams.set("mode", nextMode);
    nextParams.set("categories", serializeWordSearchCategories(nextCategories));

    if (nextQuery) {
      nextParams.set("q", nextQuery);
      nextParams.set("limit", String(nextLimit));
    } else {
      nextParams.delete("q");
      nextParams.delete("limit");
    }

    const nextUrl = `${pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`;
    const historyMethod = historyMode === "push" ? "pushState" : "replaceState";
    window.history[historyMethod](null, "", nextUrl);
  }

  const searchQuery = useWordSearch(
    {
      q: query,
      mode,
      include_lexicon: categories.includes("lexicon"),
      include_documents: categories.includes("documents"),
      include_reference_sources: categories.includes("reference_sources"),
      limit,
      offset: 0,
    },
    Boolean(query),
  );
  const checkQuery = useWordCheck(query, Boolean(query));
  const hasMoreResults = searchQuery.data?.groups.some((group) => group.items.length < group.total) ?? false;

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
        <div className="space-y-1 border-b border-border/70 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">{messages.words.search.title}</h2>
          <p className="text-sm text-muted-foreground">{messages.words.search.description}</p>
        </div>

        <div className="mt-4 space-y-4">
          <form
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const nextQuery = String(formData.get("q") ?? "").trim();
              updateSearchState(
                {
                  q: nextQuery,
                  limit: WORD_SEARCH_BATCH_SIZE,
                },
                "push",
              );
            }}
          >
            <Input
              defaultValue={query}
              key={query}
              name="q"
              placeholder={messages.words.search.placeholder}
            />

            <select
              className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                updateSearchState({
                  mode: event.target.value as WordSearchMode,
                  limit: WORD_SEARCH_BATCH_SIZE,
                })
              }
              value={mode}
            >
              <option value="exact">{messages.words.search.modes.exact}</option>
              <option value="normalized">{messages.words.search.modes.normalized}</option>
              <option value="fuzzy">{messages.words.search.modes.fuzzy}</option>
            </select>

            <Button type="submit">
              <Search className="h-4 w-4" />
              {messages.common.search}
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-sm font-medium">{messages.words.search.categoriesLabel}</p>
            <ToggleGroup
              className="flex flex-wrap justify-start"
              onValueChange={(value) =>
                updateSearchState({
                  categories: (value as WordSearchCategory[]) || [],
                  limit: WORD_SEARCH_BATCH_SIZE,
                })
              }
              type="multiple"
              value={categories}
              variant="outline"
            >
              {ALL_CATEGORIES.map((category) => (
                <ToggleGroupItem key={category} value={category}>
                  {getWordCategoryLabel(category, messages)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </section>

      <WordCheckSummary
        data={checkQuery.data}
        emptyLabel={query ? null : messages.words.check.empty}
        errorMessage={checkQuery.error?.message}
        isLoading={checkQuery.isLoading}
      />

      {!query ? (
        <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center shadow-sm">
          <p className="font-medium">{messages.words.emptyStates.searchPrompt}</p>
          <p className="mt-2 text-sm text-muted-foreground">{messages.words.emptyStates.searchPromptHint}</p>
        </div>
      ) : searchQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      ) : searchQuery.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
          {searchQuery.error.message}
        </div>
      ) : (
        <div className="space-y-4">
          {searchQuery.data?.groups.map((group) => (
            <WordSearchResultsGroup
              category={group.category}
              emptyLabel={messages.words.emptyStates.noResults}
              items={group.items}
              key={group.category}
              onViewDetails={setSelectedWord}
              total={group.total}
            />
          ))}
          {hasMoreResults ? (
            <div className="flex justify-center">
              <Button
                onClick={() =>
                  updateSearchState({
                    limit: limit + WORD_SEARCH_BATCH_SIZE,
                  })
                }
                type="button"
                variant="outline"
              >
                {messages.words.search.loadMore}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <WordDetailDrawer onOpenChange={(open) => !open && setSelectedWord(null)} open={Boolean(selectedWord)} word={selectedWord} />
    </div>
  );
}
