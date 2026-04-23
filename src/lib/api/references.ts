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

type ListEnvelope<T> = T[] | { items: T[] };
type ReferenceSourceImportSummaryLike = ReferenceSourceImportSummary | null | undefined;
type RawReferenceSource = ReferenceSourceDetail & {
  latest_import?: ReferenceSourceImportSummaryLike;
  last_import?: ReferenceSourceImportSummaryLike;
  recent_import?: ReferenceSourceImportSummaryLike;
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

  return {
    ...source,
    most_recent_import: mostRecentImport,
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
