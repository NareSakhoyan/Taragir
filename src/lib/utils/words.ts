import type { Messages } from "@/lib/i18n/messages";
import type {
  WordCandidateFilter,
  WordEvidenceSummary,
  WordSearchCategory,
  WordSearchMode,
} from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { buildDocumentEvidenceHref } from "@/lib/utils/evidence-links";
import { humanizeSnakeCase } from "@/lib/utils/format";

export const WORD_SEARCH_CATEGORY_ORDER: WordSearchCategory[] = [
  "lexicon",
  "documents",
  "reference_sources",
];

export const WORD_CANDIDATE_FILTERS: WordCandidateFilter[] = [
  "all",
  "unlinked",
  "linked",
  "suspicious",
  "ignored",
  "matched",
  "unmatched",
];

export function getWordCategoryLabel(category: WordSearchCategory, messages: Messages) {
  switch (category) {
    case "lexicon":
      return messages.words.categories.lexicon;
    case "documents":
      return messages.words.categories.documents;
    case "reference_sources":
      return messages.words.categories.referenceSources;
    default:
      return humanizeSnakeCase(category);
  }
}

export function getWordCandidateFilterLabel(filter: WordCandidateFilter, messages: Messages) {
  switch (filter) {
    case "all":
      return messages.words.filters.all;
    case "linked":
      return messages.words.filters.linked;
    case "unlinked":
      return messages.words.filters.unlinked;
    case "suspicious":
      return messages.words.filters.suspicious;
    case "ignored":
      return messages.words.filters.ignored;
    case "matched":
      return messages.words.filters.matched;
    case "unmatched":
      return messages.words.filters.unmatched;
    default:
      return humanizeSnakeCase(filter);
  }
}

export function getWordSourceTypeLabel(sourceType: string, messages: Messages) {
  switch (sourceType) {
    case "document":
      return messages.words.sourceTypes.document;
    case "reference_source":
      return messages.words.sourceTypes.referenceSource;
    case "lexicon":
      return messages.words.sourceTypes.lexicon;
    default:
      return humanizeSnakeCase(sourceType);
  }
}

export function getWordSearchResultHref(item: WordEvidenceSummary) {
  if (item.reference_link?.startsWith("/") && item.source_type !== "document") {
    return item.reference_link;
  }

  switch (item.source_type) {
    case "document":
      return buildDocumentEvidenceHref(
        item.source_id ? String(item.source_id) : null,
        item.page_number,
      );
    case "reference_source":
      return item.source_id ? `${ROUTES.references}/${item.source_id}` : null;
    case "lexicon":
      return item.normalized_form
        ? `${ROUTES.lexicon}?search=${encodeURIComponent(item.normalized_form)}`
        : ROUTES.lexicon;
    default:
      return null;
  }
}

export function getWordLexemeHref(item: WordEvidenceSummary) {
  return item.linked_lexeme?.id ? `${ROUTES.lexemes}/${item.linked_lexeme.id}` : null;
}

export function isWordResultExternalLink(item: WordEvidenceSummary) {
  return Boolean(item.reference_link && /^https?:\/\//.test(item.reference_link));
}

export function isWordSearchMode(value: string | null | undefined): value is WordSearchMode {
  return value === "exact" || value === "normalized" || value === "fuzzy";
}

export function parseWordSearchCategories(value: string | null | undefined) {
  if (value == null) {
    return [...WORD_SEARCH_CATEGORY_ORDER];
  }

  if (!value.trim()) {
    return [];
  }

  const categories = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is WordSearchCategory => WORD_SEARCH_CATEGORY_ORDER.includes(item as WordSearchCategory));

  return categories.length ? categories : [...WORD_SEARCH_CATEGORY_ORDER];
}

export function serializeWordSearchCategories(categories: WordSearchCategory[]) {
  return categories.join(",");
}
