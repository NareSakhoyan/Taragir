"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  OffsetPagination,
  ReferenceImportMethod,
  ReferenceMatchType,
  ReferenceStatusFilter,
  WordCandidateFilter,
  WordCandidatesParams,
  WordCheckResponse,
  WordEvidenceDetail,
  WordEvidenceSummary,
  WordLexemeSummary,
  WordReferenceMatchSummary,
  WordSearchCategory,
  WordSearchMode,
  WordSearchParams,
  WordSearchResponse,
  WordSourceType,
} from "@/lib/types/api";

type ListEnvelope<T> =
  | T[]
  | {
      items: T[];
      total?: number | null;
      limit?: number | null;
      offset?: number | null;
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
  page_number?: number | null;
  context_snippet?: string | null;
  reference_link?: string | null;
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
};

type RawWordEvidenceDetail = RawWordEvidenceSummary & {
  evidence_items?: WordEvidenceDetail["evidence_items"];
};

type RawWordSearchPayload =
  | WordSearchResponse
  | RawWordEvidenceSummary[]
  | {
      items?: RawWordEvidenceSummary[];
      lexicon?: ListEnvelope<RawWordEvidenceSummary>;
      documents?: ListEnvelope<RawWordEvidenceSummary>;
      imported_books?: ListEnvelope<RawWordEvidenceSummary>;
      reference_sources?: ListEnvelope<RawWordEvidenceSummary>;
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
  document_count?: number | null;
  reference_source_count?: number | null;
};

function inferCategory(sourceType: WordSourceType | null | undefined): WordSearchCategory {
  switch (sourceType) {
    case "document":
      return "documents";
    case "reference_source":
      return "reference_sources";
    default:
      return "lexicon";
  }
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
  const sourceType = raw.source_type ?? "lexicon";
  const linkedLexeme =
    normalizeWordLexemeSummary(raw.linked_lexeme) ??
    normalizeWordLexemeSummary(raw.lexeme) ??
    normalizeWordLexemeSummary({
      id: raw.linked_lexeme_id ?? raw.lexeme_id ?? undefined,
      canonical_form: raw.linked_lexeme_canonical_form ?? raw.lexeme_canonical_form ?? undefined,
    });
  const referenceMatch =
    normalizeWordReferenceMatchSummary(raw.reference_match) ??
    normalizeWordReferenceMatchSummary(raw.best_reference_match) ??
    normalizeWordReferenceMatchSummary({
      has_match: raw.has_reference_match ?? raw.match_status === "matched",
      best_match_type: raw.reference_match?.match_type ?? null,
    });
  const displayWord = raw.display_word ?? raw.word ?? raw.word_form ?? raw.surface_form ?? raw.normalized_form ?? "—";
  const category = raw.category ?? inferCategory(sourceType);

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
    source_title: raw.source_title ?? raw.source_name ?? raw.source_display_name ?? null,
    page_number: raw.page_number ?? null,
    context_snippet: raw.context_snippet ?? null,
    reference_link: raw.reference_link ?? null,
    occurrence_count: raw.occurrence_count ?? null,
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
      (referenceMatch?.has_match ? "matched" : raw.has_reference_match === false ? "unmatched" : null),
    linked_lexeme: linkedLexeme,
    reference_match: referenceMatch,
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
  payload: ListEnvelope<RawWordEvidenceSummary> | undefined,
): { category: WordSearchCategory; items: WordEvidenceSummary[]; total: number } {
  const page = normalizeWordEvidencePage(payload ?? []);

  return {
    category,
    items: page.items.map((item) => ({
      ...item,
      category: item.category ?? category,
    })),
    total: page.total,
  };
}

function normalizeWordSearchResponse(
  payload: RawWordSearchPayload,
  query: string,
  mode: WordSearchMode,
): WordSearchResponse {
  if (Array.isArray(payload)) {
    const grouped = new Map<WordSearchCategory, WordEvidenceSummary[]>();
    const categories: WordSearchCategory[] = ["lexicon", "documents", "reference_sources"];

    for (const [index, item] of payload.entries()) {
      const normalized = normalizeWordEvidenceSummary(item, index);
      const category = normalized.category ?? inferCategory(normalized.source_type);
      grouped.set(category, [...(grouped.get(category) ?? []), { ...normalized, category }]);
    }

    return {
      query,
      mode,
      groups: categories.map((category) => ({
        category,
        items: grouped.get(category) ?? [],
        total: grouped.get(category)?.length ?? 0,
      })),
    };
  }

  if ("groups" in payload && Array.isArray(payload.groups)) {
    return {
      query: payload.query ?? query,
      mode: payload.mode ?? mode,
      groups: payload.groups.map((group) => ({
        category: group.category,
        items: (group.items ?? []).map((item, index) =>
          normalizeWordEvidenceSummary(item as RawWordEvidenceSummary, index),
        ),
        total: group.total ?? group.items?.length ?? 0,
      })),
    };
  }

  if (
    "lexicon" in payload ||
    "documents" in payload ||
    "imported_books" in payload ||
    "reference_sources" in payload
  ) {
    return {
      query,
      mode,
      groups: [
        normalizeWordSearchGroup("lexicon", payload.lexicon),
        normalizeWordSearchGroup("documents", payload.documents ?? payload.imported_books),
        normalizeWordSearchGroup("reference_sources", payload.reference_sources),
      ],
    };
  }

  return normalizeWordSearchResponse(("items" in payload ? payload.items : undefined) ?? [], query, mode);
}

function normalizeWordCheckResponse(raw: RawWordCheckResponse, query: string): WordCheckResponse {
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
    document_hit_count: raw.document_hit_count ?? raw.document_count ?? null,
    reference_source_hit_count: raw.reference_source_hit_count ?? raw.reference_source_count ?? null,
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

  return {
    ...normalizeWordEvidenceSummary(detail ?? {}, 0),
    evidence_items: detail?.evidence_items ?? [],
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
