import type { useI18n } from "@/lib/i18n/use-i18n";
import type { Locale } from "@/lib/i18n/config";
import type {
  ReferenceMatchingResultStatusFilter,
  ReferenceMatchingRunResultsScopeFilter,
  ReferenceMatchingRunResultSummary,
  WordEvidenceSummary,
} from "@/lib/types/api";
import { buildDocumentEvidenceHref } from "@/lib/utils/evidence-links";
import { ROUTES } from "@/lib/utils/constants";
import { humanizeSnakeCase } from "@/lib/utils/format";

type I18nMessages = ReturnType<typeof useI18n>["messages"];

export function formatReferenceMatchingScopeFilter(
  value: ReferenceMatchingRunResultsScopeFilter | string,
  messages: I18nMessages,
) {
  switch (value) {
    case "lexicon_only":
      return messages.referenceMatching.results.scopeFilters.lexicon_only;
    case "books_only":
      return messages.referenceMatching.results.scopeFilters.books_only;
    case "any":
      return messages.referenceMatching.results.scopeFilters.any;
    default:
      return humanizeSnakeCase(value);
  }
}

export function formatReferenceMatchingStatus(
  value: ReferenceMatchingResultStatusFilter | string,
  messages: I18nMessages,
) {
  switch (value) {
    case "matched":
      return messages.referenceMatching.results.matchStatuses.matched;
    case "unmatched":
      return messages.referenceMatching.results.matchStatuses.unmatched;
    case "all":
      return messages.referenceMatching.results.matchStatuses.all;
    default:
      return humanizeSnakeCase(value);
  }
}

export function getReferenceMatchingResultSourceHref(sourceId: string | null | undefined) {
  if (!sourceId) {
    return null;
  }

  return `${ROUTES.references}/${sourceId}`;
}

export function getReferenceMatchingLexemeHref(lexemeId: string | null | undefined) {
  if (!lexemeId) {
    return null;
  }

  return `${ROUTES.lexemes}/${lexemeId}`;
}

export function getReferenceMatchingDocumentHref(
  documentId: string | null | undefined,
  pageNumber?: number | null,
) {
  return buildDocumentEvidenceHref(documentId, pageNumber);
}

export function formatReferenceMatchingCountLabel(
  template: string,
  count: number,
  locale: Locale,
  pluralSuffix: string,
  singularSuffix = "",
) {
  const suffix = locale === "hy" ? "" : count === 1 ? singularSuffix : pluralSuffix;

  return template
    .replace("{count}", count.toLocaleString(locale))
    .replace("{suffix}", suffix);
}

export function toReferenceMatchingWordSummary(
  result: ReferenceMatchingRunResultSummary,
  sourceTitle?: string | null,
): WordEvidenceSummary {
  return {
    id: result.reference_entry_id,
    display_word: result.target_label,
    normalized_form: result.normalized_form,
    canonical_form: result.best_lexeme_canonical_form,
    category: "reference_sources",
    source_type: "reference_source",
    source_id: result.source_id,
    source_title: sourceTitle ?? null,
    page_number: null,
    context_snippet: result.best_context_snippet,
    reference_link: null,
    provider_display_name: null,
    matched_form: null,
    match_type: null,
    match_score: null,
    occurrence_count: result.match_count,
    page_count: null,
    sample_tokens: [],
    sample_pages: result.best_page_number != null ? [result.best_page_number] : [],
    sample_contexts: result.best_context_snippet ? [result.best_context_snippet] : [],
    extraction_method: result.source_import_method ?? null,
    import_method: result.source_import_method ?? null,
    source_warning: result.source_warning ?? null,
    is_suspicious: false,
    suspicious_reasons: [],
    is_ignored: false,
    is_linked: Boolean(result.best_lexeme_id),
    match_status: result.match_status,
    linked_lexeme: result.best_lexeme_id
      ? {
          id: result.best_lexeme_id,
          canonical_form: result.best_lexeme_canonical_form ?? "—",
        }
      : null,
    reference_match: null,
    morphology: null,
  };
}
