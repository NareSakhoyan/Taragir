"use client";

import { apiFetch } from "@/lib/api/client";
import { rememberActiveJob, rememberReferenceSourceJobLink } from "@/lib/supabase/session";
import type {
  LexemeReferenceMatches,
  LexiconGroupReferenceMatches,
  ReferenceSourceImportSummary,
  ReferenceSourceImportResponse,
  ReferenceSourceCreateRequest,
  ReferenceSourceDetail,
  ReferenceSourceSummary,
} from "@/lib/types/api";
import {
  normalizeMorphologySettings,
  normalizeMorphologySummary,
} from "@/lib/utils/morphology";

type ListEnvelope<T> = T[] | { items: T[] };
type ReferenceSourceImportSummaryLike = ReferenceSourceImportSummary | null | undefined;
type RawReferenceSource = ReferenceSourceDetail & {
  latest_import?: ReferenceSourceImportSummaryLike;
  last_import?: ReferenceSourceImportSummaryLike;
  recent_import?: ReferenceSourceImportSummaryLike;
  morphology_settings?: unknown;
  language_stage?: string | null;
  morphology_profile?: string | null;
  morphology_analyzer?: string | null;
  analyzer?: string | null;
  morphology_summary?: unknown;
  morphology?: unknown;
  pie_morphology?: unknown;
  morphology_eligible?: boolean | null;
  pie_morphology_eligible?: boolean | null;
  morphology_supported?: boolean | null;
  supports_morphology?: boolean | null;
  morphology_available?: boolean | null;
  morphology_status?: string | null;
  analyzed_occurrence_count?: number | null;
  completed_count?: number | null;
  skipped_count?: number | null;
  failed_count?: number | null;
  distinct_lemma_count?: number | null;
};

function unwrapList<T>(payload: ListEnvelope<T>) {
  return Array.isArray(payload) ? payload : payload.items;
}

function normalizeImportSummary(
  source: Partial<RawReferenceSource>,
): ReferenceSourceImportSummary | null {
  const importSummary =
    source.most_recent_import ??
    source.latest_import ??
    source.last_import ??
    source.recent_import ??
    null;

  if (!importSummary) {
    return null;
  }

  return {
    id: importSummary.id,
    filename: importSummary.filename ?? null,
    status: importSummary.status,
    rows_read: importSummary.rows_read,
    rows_imported: importSummary.rows_imported,
    rows_skipped: importSummary.rows_skipped,
    import_method: importSummary.import_method ?? null,
    warning_message: importSummary.warning_message ?? null,
    error_message: importSummary.error_message,
    created_at: importSummary.created_at,
  };
}

function normalizeReferenceSource<T extends Partial<RawReferenceSource>>(source: T) {
  const mostRecentImport = normalizeImportSummary(source);
  const morphologySettings =
    normalizeMorphologySettings(source.morphology_settings) ??
    normalizeMorphologySettings(source);

  return {
    ...source,
    most_recent_import: mostRecentImport,
    language_stage: source.language_stage ?? morphologySettings?.language_stage ?? null,
    morphology_profile: source.morphology_profile ?? morphologySettings?.morphology_profile ?? null,
    morphology_analyzer:
      source.morphology_analyzer ?? source.analyzer ?? morphologySettings?.analyzer ?? null,
    morphology_settings: morphologySettings,
    morphology_summary:
      normalizeMorphologySummary(source.morphology_summary, "reference_source") ??
      normalizeMorphologySummary(source.morphology, "reference_source") ??
      normalizeMorphologySummary(source.pie_morphology, "reference_source") ??
      normalizeMorphologySummary(
        {
          is_eligible: source.morphology_eligible ?? source.pie_morphology_eligible,
          is_supported: source.morphology_supported ?? source.supports_morphology,
          is_available: source.morphology_available,
          status: source.morphology_status,
          analyzed_occurrence_count: source.analyzed_occurrence_count,
          completed_count: source.completed_count,
          skipped_count: source.skipped_count,
          failed_count: source.failed_count,
          distinct_lemma_count: source.distinct_lemma_count,
        },
        "reference_source",
      ),
    last_import_method: source.last_import_method ?? mostRecentImport?.import_method ?? null,
    last_import_warning: source.last_import_warning ?? mostRecentImport?.warning_message ?? null,
    last_imported_at: source.last_imported_at ?? mostRecentImport?.created_at ?? null,
  };
}

export async function getReferenceSources() {
  const response = await apiFetch<ListEnvelope<RawReferenceSource>>("/api/v1/reference-sources");
  return unwrapList(response).map((source) => normalizeReferenceSource(source) as ReferenceSourceSummary);
}

export async function getReferenceSource(sourceId: string) {
  const source = await apiFetch<RawReferenceSource>(`/api/v1/reference-sources/${sourceId}`);
  return normalizeReferenceSource(source) as ReferenceSourceDetail;
}

export async function createReferenceSource(payload: ReferenceSourceCreateRequest) {
  const source = await apiFetch<RawReferenceSource>("/api/v1/reference-sources", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeReferenceSource(source) as ReferenceSourceDetail;
}

export async function startReferenceImport(sourceId: string, file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await apiFetch<ReferenceSourceImportResponse>(`/api/v1/reference-sources/${sourceId}/import`, {
    method: "POST",
    body: formData,
  });

  rememberReferenceSourceJobLink(response.source_id, response.job.id);
  rememberActiveJob(response.job.id);

  return {
    ...response,
    source: response.source ? (normalizeReferenceSource(response.source) as ReferenceSourceSummary | ReferenceSourceDetail) : null,
  };
}

export const importReferenceSourceFile = startReferenceImport;

export async function getLexiconGroupReferenceMatches(normalizedForm: string) {
  return apiFetch<LexiconGroupReferenceMatches>(
    `/api/v1/lexicon/groups/${encodeURIComponent(normalizedForm)}/reference-matches`,
  );
}

export async function getLexemeReferenceMatches(lexemeId: string) {
  return apiFetch<LexemeReferenceMatches>(`/api/v1/lexemes/${lexemeId}/reference-matches`);
}
