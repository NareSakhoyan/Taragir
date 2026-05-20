"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  OffsetPagination,
  ReferenceImportMethod,
  ReferenceMatchType,
  ReferenceStatusFilter,
  WordMorphologySummary,
  WordCandidateFilter,
  WordCandidatesParams,
  WordCheckResponse,
  WordEvidenceDetail,
  WordInternalEvidenceItem,
  WordEvidenceSummary,
  WordLexemeSummary,
  WordReferenceMatchSummary,
  WordSearchCategory,
  WordSearchGroup,
  WordSearchMode,
  WordSearchParams,
  WordTrustedExternalEvidenceItem,
  WordSourceType,
} from "@/lib/types/api";
import { normalizeWordMorphologySummary } from "@/lib/utils/morphology";

type ListEnvelope<T> =
  | T[]
  | {
      items: T[];
      total?: number | null;
      limit?: number | null;
      offset?: number | null;
    };

type RawWordSearchGroupEnvelope<T> = {
  category?: WordSearchCategory | string | null;
  items?: T[];
  total?: number | null;
  limit?: number | null;
  offset?: number | null;
  error_message?: string | null;
};

type RawWordLexemeSummary = Partial<WordLexemeSummary> & {
  lexeme_id?: string | null;
  lexemeId?: string | null;
  canonical?: string | null;
  canonicalForm?: string | null;
  canonical_normalized_form?: string | null;
  canonicalNormalizedForm?: string | null;
};

type RawWordReferenceMatchSummary = Partial<WordReferenceMatchSummary> & {
  has_reference_match?: boolean;
  source_display_name?: string | null;
  matched_surface_form?: string | null;
  best_match_type?: ReferenceMatchType | null;
  best_match_score?: number | null;
  best_matched_form?: string | null;
  best_source_display_name?: string | null;
  source_import_method?: ReferenceImportMethod | null;
  import_method?: ReferenceImportMethod | null;
};

type RawWordEvidenceSummary = Partial<WordEvidenceSummary> & {
  summary?: Record<string, unknown> | null;
  word?: string | null;
  word_form?: string | null;
  surface_form?: string | null;
  normalized_token?: string | null;
  canonical?: string | null;
  canonical_display?: string | null;
  source_name?: string | null;
  source_display_name?: string | null;
  category?: WordSearchCategory | null;
  source_type?: WordSourceType | null;
  source_id?: string | null;
  source_title?: string | null;
  title?: string | null;
  page_number?: number | null;
  context_snippet?: string | null;
  snippet?: string | null;
  reference_link?: string | null;
  reference_url?: string | null;
  url?: string | null;
  provider_display_name?: string | null;
  provider_name?: string | null;
  provider?: string | null;
  matched_form?: string | null;
  matched_surface_form?: string | null;
  match_type?: ReferenceMatchType | null;
  match_score?: number | null;
  occurrence_count?: number | null;
  page_count?: number | null;
  sample_tokens?: string[] | null;
  sample_pages?: number[] | null;
  sample_contexts?: string[] | null;
  extraction_method?: string | null;
  import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
  warning_message?: string | null;
  suspicious?: boolean | null;
  is_suspicious?: boolean | null;
  suspicion_reasons?: string[] | null;
  suspicious_reasons?: string[] | null;
  ignored?: boolean | null;
  is_ignored?: boolean | null;
  linked?: boolean | null;
  is_linked?: boolean | null;
  match_status?: Exclude<ReferenceStatusFilter, "all"> | null;
  linked_lexeme?: RawWordLexemeSummary | null;
  linked_lexeme_id?: string | null;
  linked_lexeme_canonical_form?: string | null;
  lexeme?: RawWordLexemeSummary | null;
  lexeme_id?: string | null;
  lexeme_canonical_form?: string | null;
  reference_match?: RawWordReferenceMatchSummary | null;
  best_reference_match?: RawWordReferenceMatchSummary | null;
  has_reference_match?: boolean | null;
  trusted_external_status?: string | null;
  trusted_external_provider_display_name?: string | null;
  trusted_external_match_count?: number | null;
  trusted_external_matched_form?: string | null;
  trusted_external_source_title?: string | null;
  trusted_external_reference_link?: string | null;
  trusted_external_snippet?: string | null;
  trusted_external_canonicalization_status?: string | null;
  has_reference_match?: boolean | null;
  morphology?: WordMorphologySummary | Record<string, unknown> | null;
  morphology_summary?: WordMorphologySummary | Record<string, unknown> | null;
  word_morphology?: WordMorphologySummary | Record<string, unknown> | null;
  morphology_available?: boolean | null;
  morphology_status?: string | null;
  best_lemma?: string | null;
  lemma_candidates?: unknown[] | null;
  pos_candidates?: unknown[] | null;
};

type RawWordEvidenceItem = {
  id?: string | null;
  category?: WordSearchCategory | string | null;
  source_type?: WordSourceType | string | null;
  page_number?: number | null;
  context_snippet?: string | null;
  snippet?: string | null;
  reference_link?: string | null;
  reference_url?: string | null;
  url?: string | null;
  source_title?: string | null;
  title?: string | null;
  extraction_method?: string | null;
  source_warning?: string | null;
  warning_message?: string | null;
  provider_display_name?: string | null;
  provider_name?: string | null;
  provider?: string | null;
  matched_form?: string | null;
  matched_surface_form?: string | null;
  surface_form?: string | null;
  match_type?: ReferenceMatchType | null;
  match_score?: number | null;
};

type RawWordEvidenceDetail = RawWordEvidenceSummary & {
  evidence_items?: RawWordEvidenceItem[];
  internal_evidence_items?: RawWordEvidenceItem[];
  internal_evidence?: RawWordEvidenceItem[];
  trusted_external_evidence_items?: RawWordEvidenceItem[];
  trusted_external_sources?: RawWordEvidenceItem[];
  trusted_external_matches?: RawWordEvidenceItem[];
  external_evidence_items?: RawWordEvidenceItem[];
  external_sources?: RawWordEvidenceItem[];
  external_matches?: RawWordEvidenceItem[];
};

type RawWordSearchPayload =
  | {
      query?: string;
      mode?: WordSearchMode;
      groups?: RawWordSearchGroupEnvelope<RawWordEvidenceSummary>[];
    }
  | RawWordEvidenceSummary[]
  | {
      items?: RawWordEvidenceSummary[];
      lexicon?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      documents?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      imported_books?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      reference_sources?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      trusted_external?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      trustedExternal?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      external?: ListEnvelope<RawWordEvidenceSummary> | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>;
      trusted_external_error_message?: string | null;
      trustedExternalError?: string | null;
    };

type RawWordCheckResponse = Partial<WordCheckResponse> & {
  q?: string;
  exists?: boolean;
  in_lexicon?: boolean;
  lexeme_count?: number;
  lexemes?: RawWordLexemeSummary[] | null;
  found_in_books?: boolean;
  found_in_documents?: boolean;
  found_in_sources?: boolean;
  found_in_external?: boolean;
  found_in_trusted_external_sources?: boolean;
  document_count?: number | null;
  reference_source_count?: number | null;
  trusted_external_count?: number | null;
  external_count?: number | null;
  external_hit_count?: number | null;
  trusted_external_providers?: string[] | null;
  trusted_external_provider_display_names?: string[] | null;
  external_providers?: string[] | null;
  trusted_external_error_message?: string | null;
  external_error_message?: string | null;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const normalizedEntry = readString(entry);
    return normalizedEntry ? [normalizedEntry] : [];
  });
}

function normalizeWordSearchCategory(
  value: WordSearchCategory | string | null | undefined,
): WordSearchCategory | null {
  switch (value) {
    case "lexicon":
      return "lexicon";
    case "documents":
    case "imported_books":
    case "books":
      return "documents";
    case "reference_sources":
    case "reference_source":
      return "reference_sources";
    case "trusted_external":
    case "external":
    case "external_source":
    case "trusted-external":
      return "trusted_external";
    default:
      return null;
  }
}

function normalizeWordSourceType(
  value: WordSourceType | string | null | undefined,
  category?: WordSearchCategory | string | null,
): WordSourceType {
  switch (value) {
    case "document":
    case "documents":
    case "book":
    case "imported_book":
      return "document";
    case "reference_source":
    case "reference_sources":
      return "reference_source";
    case "trusted_external":
    case "external":
    case "external_source":
    case "trusted-external":
      return "trusted_external";
    case "lexicon":
      return "lexicon";
    default: {
      const normalizedCategory = normalizeWordSearchCategory(category);

      switch (normalizedCategory) {
        case "documents":
          return "document";
        case "reference_sources":
          return "reference_source";
        case "trusted_external":
          return "trusted_external";
        default:
          return "lexicon";
      }
    }
  }
}

function inferCategory(sourceType: WordSourceType | null | undefined): WordSearchCategory {
  switch (sourceType) {
    case "document":
      return "documents";
    case "reference_source":
      return "reference_sources";
    case "trusted_external":
    case "external_source":
      return "trusted_external";
    default:
      return "lexicon";
  }
}

function normalizeProviderDisplayName(
  raw:
    | Pick<RawWordEvidenceSummary, "provider_display_name" | "provider_name" | "provider">
    | Pick<RawWordEvidenceItem, "provider_display_name" | "provider_name" | "provider">
    | null
    | undefined,
) {
  return raw?.provider_display_name ?? raw?.provider_name ?? raw?.provider ?? null;
}

function normalizeReferenceLink(
  raw:
    | Pick<RawWordEvidenceSummary, "reference_link" | "reference_url" | "url">
    | Pick<RawWordEvidenceItem, "reference_link" | "reference_url" | "url">
    | null
    | undefined,
) {
  return raw?.reference_link ?? raw?.reference_url ?? raw?.url ?? null;
}

function normalizeWordLexemeSummary(raw: RawWordLexemeSummary | null | undefined): WordLexemeSummary | null {
  const id = raw?.id ?? raw?.lexeme_id ?? raw?.lexemeId ?? null;

  if (!id) {
    return null;
  }

  return {
    id,
    canonical_form: raw?.canonical_form ?? raw?.canonical ?? raw?.canonicalForm ?? "—",
    canonical_normalized_form:
      raw?.canonical_normalized_form ?? raw?.canonicalNormalizedForm ?? null,
  };
}

function normalizeWordReferenceMatchSummary(
  raw: RawWordReferenceMatchSummary | null | undefined,
): WordReferenceMatchSummary | null {
  if (!raw) {
    return null;
  }

  const hasMatch =
    raw.has_match ??
    raw.has_reference_match ??
    Boolean(raw.match_type ?? raw.best_match_type ?? raw.matched_form ?? raw.best_matched_form);

  if (!hasMatch) {
    return {
      has_match: false,
      source_name: null,
      match_type: null,
      matched_form: null,
      match_score: null,
      source_import_method: raw.source_import_method ?? raw.import_method ?? null,
      source_warning: raw.source_warning ?? null,
    };
  }

  return {
    has_match: true,
    source_name: raw.source_name ?? raw.source_display_name ?? raw.best_source_display_name ?? null,
    match_type: raw.match_type ?? raw.best_match_type ?? null,
    matched_form: raw.matched_form ?? raw.matched_surface_form ?? raw.best_matched_form ?? null,
    match_score: raw.match_score ?? raw.best_match_score ?? null,
    source_import_method: raw.source_import_method ?? raw.import_method ?? null,
    source_warning: raw.source_warning ?? null,
  };
}

function normalizeWordEvidenceSummary(
  raw: RawWordEvidenceSummary,
  index = 0,
): WordEvidenceSummary {
  const summary = asRecord(raw.summary);
  const sourceType = normalizeWordSourceType(raw.source_type, raw.category);
  const linkedLexeme =
    normalizeWordLexemeSummary(raw.linked_lexeme) ??
    normalizeWordLexemeSummary(raw.lexeme) ??
    normalizeWordLexemeSummary({
      id:
        raw.linked_lexeme_id ??
        raw.lexeme_id ??
        readString(summary?.linked_lexeme_id) ??
        undefined,
      canonical_form:
        raw.linked_lexeme_canonical_form ??
        raw.lexeme_canonical_form ??
        readString(summary?.linked_lexeme_canonical_form) ??
        undefined,
    });
  const referenceMatch =
    normalizeWordReferenceMatchSummary(raw.reference_match) ??
    normalizeWordReferenceMatchSummary(raw.best_reference_match) ??
    normalizeWordReferenceMatchSummary({
      has_match: raw.has_reference_match ?? raw.match_status === "matched",
      best_match_type: raw.reference_match?.match_type ?? null,
    });
  const displayWord = raw.display_word ?? raw.word ?? raw.word_form ?? raw.surface_form ?? raw.normalized_form ?? "—";
  const category = normalizeWordSearchCategory(raw.category) ?? inferCategory(sourceType);
  const providerDisplayName = normalizeProviderDisplayName(raw);
  const matchedForm = raw.matched_form ?? raw.matched_surface_form ?? null;
  const morphology =
    normalizeWordMorphologySummary(raw.morphology) ??
    normalizeWordMorphologySummary(raw.morphology_summary) ??
    normalizeWordMorphologySummary(raw.word_morphology) ??
    normalizeWordMorphologySummary({
      available: raw.morphology_available ?? summary?.morphology_available,
      status: raw.morphology_status,
      best_lemma: raw.best_lemma ?? readString(summary?.best_lemma),
      lemma_candidates: raw.lemma_candidates ?? readStringArray(summary?.lemma_candidates),
      pos_candidates: raw.pos_candidates ?? readStringArray(summary?.pos_candidates),
    });
  const totalHits = readNumber(summary?.total_hits);

  return {
    id:
      raw.id ??
      `${sourceType}:${raw.source_id ?? "unknown"}:${raw.normalized_form ?? displayWord}:${raw.page_number ?? index}`,
    display_word: displayWord,
    normalized_form: raw.normalized_form ?? raw.normalized_token ?? null,
    canonical_form: raw.canonical_form ?? raw.canonical ?? raw.canonical_display ?? linkedLexeme?.canonical_form ?? null,
    category,
    source_type: sourceType,
    source_id: raw.source_id ?? null,
    source_title: raw.source_title ?? raw.source_name ?? raw.source_display_name ?? raw.title ?? null,
    page_number: raw.page_number ?? null,
    context_snippet: raw.context_snippet ?? raw.snippet ?? null,
    reference_link: normalizeReferenceLink(raw),
    provider_display_name: providerDisplayName,
    matched_form: matchedForm,
    match_type: raw.match_type ?? null,
    match_score: raw.match_score ?? null,
    occurrence_count: raw.occurrence_count ?? totalHits ?? null,
    page_count: raw.page_count ?? null,
    sample_tokens: raw.sample_tokens ?? [],
    sample_pages: raw.sample_pages ?? [],
    sample_contexts: raw.sample_contexts ?? [],
    extraction_method: raw.extraction_method ?? raw.import_method ?? null,
    import_method: raw.import_method ?? null,
    source_warning: raw.source_warning ?? raw.warning_message ?? null,
    is_suspicious: raw.is_suspicious ?? raw.suspicious ?? false,
    suspicious_reasons: raw.suspicion_reasons ?? raw.suspicious_reasons ?? [],
    is_ignored: raw.is_ignored ?? raw.ignored ?? false,
    is_linked: raw.is_linked ?? raw.linked ?? Boolean(linkedLexeme),
    match_status:
      raw.match_status ??
      (referenceMatch?.has_match || raw.has_reference_match
        ? "matched"
        : raw.has_reference_match === false
          ? "unmatched"
          : null),
    trusted_external_status: raw.trusted_external_status ?? null,
    trusted_external_provider_display_name: raw.trusted_external_provider_display_name ?? null,
    trusted_external_match_count: raw.trusted_external_match_count ?? null,
    trusted_external_matched_form: raw.trusted_external_matched_form ?? null,
    trusted_external_source_title: raw.trusted_external_source_title ?? null,
    trusted_external_reference_link: raw.trusted_external_reference_link ?? null,
    trusted_external_snippet: raw.trusted_external_snippet ?? null,
    trusted_external_canonicalization_status: raw.trusted_external_canonicalization_status ?? null,
    has_reference_match: raw.has_reference_match ?? referenceMatch?.has_match ?? null,
    linked_lexeme: linkedLexeme,
    reference_match: referenceMatch,
    morphology,
  };
}

function isTrustedExternalEvidenceItem(raw: RawWordEvidenceItem) {
  const category = normalizeWordSearchCategory(raw.category);
  const sourceType = normalizeWordSourceType(raw.source_type, category);

  return (
    category === "trusted_external" ||
    sourceType === "trusted_external" ||
    Boolean(normalizeProviderDisplayName(raw))
  );
}

function normalizeInternalEvidenceItem(
  raw: RawWordEvidenceItem,
  index: number,
): WordInternalEvidenceItem {
  return {
    id: raw.id ?? `internal:${raw.source_title ?? "unknown"}:${raw.page_number ?? index}`,
    page_number: raw.page_number ?? null,
    context_snippet: raw.context_snippet ?? raw.snippet ?? null,
    reference_link: normalizeReferenceLink(raw),
    source_title: raw.source_title ?? raw.title ?? null,
    extraction_method: raw.extraction_method ?? null,
    source_warning: raw.source_warning ?? raw.warning_message ?? null,
  };
}

function normalizeTrustedExternalEvidenceItem(
  raw: RawWordEvidenceItem,
  index: number,
): WordTrustedExternalEvidenceItem {
  return {
    id: raw.id ?? `trusted-external:${normalizeProviderDisplayName(raw) ?? "unknown"}:${raw.source_title ?? raw.title ?? index}`,
    provider_display_name: normalizeProviderDisplayName(raw),
    source_title: raw.source_title ?? raw.title ?? null,
    snippet: raw.snippet ?? raw.context_snippet ?? null,
    matched_form: raw.matched_form ?? raw.matched_surface_form ?? raw.surface_form ?? null,
    reference_link: normalizeReferenceLink(raw),
    match_type: raw.match_type ?? null,
    match_score: raw.match_score ?? null,
    source_warning: raw.source_warning ?? null,
    warning_message: raw.warning_message ?? null,
  };
}

function normalizeWordEvidencePage(
  payload: ListEnvelope<RawWordEvidenceSummary>,
): OffsetPagination<WordEvidenceSummary> {
  if (Array.isArray(payload)) {
    return {
      items: payload.map((item, index) => normalizeWordEvidenceSummary(item, index)),
      total: payload.length,
      limit: payload.length,
      offset: 0,
    };
  }

  const items = (payload.items ?? []).map((item, index) => normalizeWordEvidenceSummary(item, index));

  return {
    items,
    total: payload.total ?? items.length,
    limit: payload.limit ?? items.length,
    offset: payload.offset ?? 0,
  };
}

function normalizeWordSearchGroup(
  category: WordSearchCategory,
  payload:
    | ListEnvelope<RawWordEvidenceSummary>
    | RawWordSearchGroupEnvelope<RawWordEvidenceSummary>
    | undefined,
  errorMessage?: string | null,
): WordSearchGroup {
  const page = Array.isArray(payload)
    ? normalizeWordEvidencePage(payload)
    : normalizeWordEvidencePage(
        payload
          ? {
              items: payload.items ?? [],
              total: payload.total,
              limit: payload.limit,
              offset: payload.offset,
            }
          : [],
      );
  const payloadError =
    payload && !Array.isArray(payload) && "error_message" in payload ? payload.error_message ?? null : null;

  return {
    category,
    items: page.items.map((item) => ({
      ...item,
      category: item.category ?? category,
    })),
    total: page.total,
    error_message: errorMessage ?? payloadError ?? null,
  };
}

function completeWordSearchGroups(groups: WordSearchGroup[]) {
  const groupMap = new Map<WordSearchCategory, WordSearchGroup>(
    groups.map((group) => [group.category, group]),
  );

  return ["lexicon", "documents", "reference_sources", "trusted_external"].map((category) => {
    const normalizedCategory = category as WordSearchCategory;
    return (
      groupMap.get(normalizedCategory) ?? {
        category: normalizedCategory,
        items: [],
        total: 0,
        error_message: null,
      }
    );
  });
}

function normalizeWordSearchResponse(
  payload: RawWordSearchPayload,
  query: string,
  mode: WordSearchMode,
) {
  if (Array.isArray(payload)) {
    const grouped = new Map<WordSearchCategory, WordEvidenceSummary[]>();

    for (const [index, item] of payload.entries()) {
      const normalized = normalizeWordEvidenceSummary(item, index);
      const category = normalized.category ?? inferCategory(normalized.source_type);
      grouped.set(category, [...(grouped.get(category) ?? []), { ...normalized, category }]);
    }

    return {
      query,
      mode,
      groups: completeWordSearchGroups(
        ["lexicon", "documents", "reference_sources", "trusted_external"].map((category) => ({
          category: category as WordSearchCategory,
          items: grouped.get(category as WordSearchCategory) ?? [],
          total: grouped.get(category as WordSearchCategory)?.length ?? 0,
          error_message: null,
        })),
      ),
    };
  }

  if ("groups" in payload && Array.isArray(payload.groups)) {
    return {
      query: payload.query ?? query,
      mode: payload.mode ?? mode,
      groups: completeWordSearchGroups(
        payload.groups.flatMap((group) => {
          const category = normalizeWordSearchCategory(group.category);

          return category ? [normalizeWordSearchGroup(category, group)] : [];
        }),
      ),
    };
  }

  if (
    "lexicon" in payload ||
    "documents" in payload ||
    "imported_books" in payload ||
    "reference_sources" in payload ||
    "trusted_external" in payload ||
    "trustedExternal" in payload ||
    "external" in payload
  ) {
    return {
      query,
      mode,
      groups: completeWordSearchGroups([
        normalizeWordSearchGroup("lexicon", payload.lexicon),
        normalizeWordSearchGroup("documents", payload.documents ?? payload.imported_books),
        normalizeWordSearchGroup("reference_sources", payload.reference_sources),
        normalizeWordSearchGroup(
          "trusted_external",
          payload.trusted_external ?? payload.trustedExternal ?? payload.external,
          payload.trusted_external_error_message ?? payload.trustedExternalError ?? null,
        ),
      ]),
    };
  }

  return normalizeWordSearchResponse(("items" in payload ? payload.items : undefined) ?? [], query, mode);
}

function normalizeWordCheckResponse(raw: RawWordCheckResponse, query: string): WordCheckResponse {
  const trustedExternalProviders = Array.from(
    new Set(
      (raw.trusted_external_providers ??
        raw.trusted_external_provider_display_names ??
        raw.external_providers ??
        []
      )
        .map((provider) => provider?.trim())
        .filter((provider): provider is string => Boolean(provider)),
    ),
  );

  return {
    query: raw.query ?? raw.q ?? query,
    exists_in_lexicon: raw.exists_in_lexicon ?? raw.exists ?? raw.in_lexicon ?? false,
    matching_lexeme_count:
      raw.matching_lexeme_count ?? raw.lexeme_count ?? raw.matching_lexemes?.length ?? raw.lexemes?.length ?? 0,
    matching_lexemes: (raw.matching_lexemes ?? raw.lexemes ?? [])
      .map((lexeme) => normalizeWordLexemeSummary(lexeme))
      .filter((lexeme): lexeme is WordLexemeSummary => Boolean(lexeme)),
    found_in_documents: raw.found_in_documents ?? raw.found_in_books ?? false,
    found_in_reference_sources: raw.found_in_reference_sources ?? raw.found_in_sources ?? false,
    found_in_trusted_external:
      raw.found_in_trusted_external ??
      raw.found_in_trusted_external_sources ??
      raw.found_in_external ??
      false,
    document_hit_count: raw.document_hit_count ?? raw.document_count ?? null,
    reference_source_hit_count: raw.reference_source_hit_count ?? raw.reference_source_count ?? null,
    trusted_external_hit_count:
      raw.trusted_external_hit_count ??
      raw.trusted_external_count ??
      raw.external_hit_count ??
      raw.external_count ??
      null,
    trusted_external_providers: trustedExternalProviders,
    trusted_external_error_message: raw.trusted_external_error_message ?? raw.external_error_message ?? null,
  };
}

export async function searchWords(params: WordSearchParams) {
  const query = params.q.trim();
  const mode = params.mode ?? "normalized";
  const payload = await apiFetch<RawWordSearchPayload>("/api/v1/words/search", {
    searchParams: {
      q: query,
      mode,
      include_lexicon: params.include_lexicon ?? true,
      include_documents: params.include_documents ?? true,
      include_reference_sources: params.include_reference_sources ?? true,
      include_trusted_external: params.include_trusted_external ?? true,
      limit: params.limit,
      offset: params.offset,
    },
  });

  return normalizeWordSearchResponse(payload, query, mode);
}

export async function checkWord(query: string) {
  const trimmedQuery = query.trim();
  const payload = await apiFetch<RawWordCheckResponse>("/api/v1/words/check", {
    searchParams: {
      q: trimmedQuery,
    },
  });

  return normalizeWordCheckResponse(payload, trimmedQuery);
}

export async function getWordEvidence(input: {
  id: string;
  sourceType?: string | null;
  sourceId?: string | null;
  normalizedForm?: string | null;
  q?: string | null;
}) {
  const payload = await apiFetch<RawWordEvidenceDetail | RawWordEvidenceDetail[]>("/api/v1/word-evidence", {
    searchParams: {
      id: input.id,
      evidence_id: input.id,
      source_type: input.sourceType ?? undefined,
      source_id: input.sourceId ?? undefined,
      normalized_form: input.normalizedForm ?? undefined,
      q: input.q ?? undefined,
    },
  });

  const detail = Array.isArray(payload) ? payload[0] : payload;
  const sharedEvidenceItems = detail?.evidence_items ?? [];
  const normalizedSharedTrustedExternal = sharedEvidenceItems
    .filter(isTrustedExternalEvidenceItem)
    .map((item, index) => normalizeTrustedExternalEvidenceItem(item, index));
  const normalizedSharedInternal = sharedEvidenceItems
    .filter((item) => !isTrustedExternalEvidenceItem(item))
    .map((item, index) => normalizeInternalEvidenceItem(item, index));
  const internalEvidenceItems =
    detail?.internal_evidence_items ??
    detail?.internal_evidence ??
    (detail?.evidence_items ? undefined : []);
  const trustedExternalEvidenceItems =
    detail?.trusted_external_evidence_items ??
    detail?.trusted_external_sources ??
    detail?.trusted_external_matches ??
    detail?.external_evidence_items ??
    detail?.external_sources ??
    detail?.external_matches ??
    (detail?.evidence_items ? undefined : []);

  return {
    ...normalizeWordEvidenceSummary(detail ?? {}, 0),
    evidence_items:
      internalEvidenceItems?.map((item, index) => normalizeInternalEvidenceItem(item, index)) ??
      normalizedSharedInternal,
    internal_evidence_items:
      internalEvidenceItems?.map((item, index) => normalizeInternalEvidenceItem(item, index)) ??
      normalizedSharedInternal,
    trusted_external_evidence_items:
      trustedExternalEvidenceItems?.map((item, index) => normalizeTrustedExternalEvidenceItem(item, index)) ??
      normalizedSharedTrustedExternal,
  } satisfies WordEvidenceDetail;
}

function buildWordCandidatesSearchParams(params: WordCandidatesParams = {}) {
  return {
    search: params.search?.trim() || undefined,
    filter: (params.filter ?? "all") satisfies WordCandidateFilter,
    limit: params.limit,
    offset: params.offset,
  };
}

export async function getDocumentWordCandidates(documentId: string, params: WordCandidatesParams = {}) {
  const payload = await apiFetch<ListEnvelope<RawWordEvidenceSummary>>(
    `/api/v1/documents/${documentId}/word-candidates`,
    {
      searchParams: buildWordCandidatesSearchParams(params),
    },
  );

  return normalizeWordEvidencePage(payload);
}

export async function getReferenceSourceWordCandidates(sourceId: string, params: WordCandidatesParams = {}) {
  const payload = await apiFetch<ListEnvelope<RawWordEvidenceSummary>>(
    `/api/v1/reference-sources/${sourceId}/word-candidates`,
    {
      searchParams: buildWordCandidatesSearchParams(params),
    },
  );

  return normalizeWordEvidencePage(payload);
}
