"use client";

import { apiFetch } from "@/lib/api/client";
import { rememberActiveJob, rememberDocumentJobLink } from "@/lib/supabase/session";
import type {
  DocumentTrustedExternalLookupRunStartResponse,
  DocumentTrustedExternalLookupSummary,
  DocumentPageRead,
  DocumentRead,
  DiscoveryBuildStartResponse,
  DiscoveryCandidate,
  DiscoveryCandidateDetailResponse,
  DiscoveryCandidateParams,
  DiscoverySummary,
  DiscoveryDecisionRequest,
  DiscoveryDecisionResponse,
  DocumentUploadResponse,
  JobRead,
  ListParams,
  MorphologyAnalyzer,
  MorphologyLanguageStage,
  MorphologyProfile,
  OffsetPagination,
} from "@/lib/types/api";
import { BATCH_PAGE_SIZE } from "@/lib/utils/constants";
import {
  normalizeMorphologySettings,
  normalizeMorphologySummary,
} from "@/lib/utils/morphology";

type RawDocumentRead = DocumentRead & {
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

function normalizeDocument(document: RawDocumentRead): DocumentRead {
  const morphologySettings =
    normalizeMorphologySettings(document.morphology_settings) ??
    normalizeMorphologySettings(document);

  return {
    ...document,
    language_stage: document.language_stage ?? morphologySettings?.language_stage ?? null,
    morphology_profile: document.morphology_profile ?? morphologySettings?.morphology_profile ?? null,
    morphology_analyzer:
      document.morphology_analyzer ?? document.analyzer ?? morphologySettings?.analyzer ?? null,
    morphology_settings: morphologySettings,
    morphology_summary:
      normalizeMorphologySummary(document.morphology_summary, "document") ??
      normalizeMorphologySummary(document.morphology, "document") ??
      normalizeMorphologySummary(document.pie_morphology, "document") ??
      normalizeMorphologySummary(
        {
          is_eligible: document.morphology_eligible ?? document.pie_morphology_eligible,
          is_supported: document.morphology_supported ?? document.supports_morphology,
          is_available: document.morphology_available,
          status: document.morphology_status,
          analyzed_occurrence_count: document.analyzed_occurrence_count,
          completed_count: document.completed_count,
          skipped_count: document.skipped_count,
          failed_count: document.failed_count,
          distinct_lemma_count: document.distinct_lemma_count,
        },
        "document",
      ),
  };
}

export async function listDocuments(params: ListParams & { include_workspace_summary?: boolean } = {}) {
  const response = await apiFetch<OffsetPagination<RawDocumentRead>>("/api/v1/documents", {
    searchParams: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      include_workspace_summary: params.include_workspace_summary,
    },
  });

  return {
    ...response,
    items: response.items.map((document) => normalizeDocument(document)),
  };
}

export type DocumentOptionRead = {
  id: string;
  title: string;
  original_filename: string;
};

export type DocumentStatusStats = {
  total: number;
  completed: number;
  processing: number;
  queued: number;
  failed: number;
};

export async function getDocumentStats() {
  return apiFetch<DocumentStatusStats>("/api/v1/documents/stats");
}

export async function listDocumentOptions(params: ListParams & { search?: string } = {}) {
  return apiFetch<OffsetPagination<DocumentOptionRead>>("/api/v1/documents/options", {
    searchParams: {
      search: params.search,
      limit: params.limit ?? BATCH_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}

export async function listAllDocumentOptions() {
  const items: DocumentOptionRead[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const page = await listDocumentOptions({ limit: BATCH_PAGE_SIZE, offset });
    items.push(...page.items);
    total = page.total;
    offset += page.limit;

    if (!page.items.length) {
      break;
    }
  }

  return items;
}

export async function getDocument(documentId: string) {
  return normalizeDocument(await apiFetch<RawDocumentRead>(`/api/v1/documents/${documentId}`));
}

async function listDocumentPagesPage(documentId: string, params: ListParams = {}) {
  return apiFetch<OffsetPagination<DocumentPageRead>>(`/api/v1/documents/${documentId}/pages`, {
    searchParams: {
      limit: params.limit ?? BATCH_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}

export async function listDocumentPages(documentId: string, params: ListParams = {}) {
  return listDocumentPagesPage(documentId, {
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}

type RawDocumentUploadResponse = DocumentUploadResponse | { document: DocumentRead; job: JobRead };

function normalizeDocumentUploadResponse(response: RawDocumentUploadResponse): DocumentUploadResponse {
  return {
    document: response.document ?? null,
    job: response.job,
    message: "message" in response ? response.message ?? null : null,
    resource_summary: "resource_summary" in response ? response.resource_summary ?? null : null,
  };
}

export async function startDocumentUpload(input: {
  file: File;
  title?: string;
  language_stage?: MorphologyLanguageStage | null;
  morphology_profile?: MorphologyProfile | null;
  analyzer?: MorphologyAnalyzer | null;
}) {
  const formData = new FormData();
  formData.set("file", input.file);

  if (input.title?.trim()) {
    formData.set("title", input.title.trim());
  }

  if (input.language_stage?.trim()) {
    formData.set("language_stage", input.language_stage.trim());
  }

  if (input.morphology_profile?.trim()) {
    formData.set("morphology_profile", input.morphology_profile.trim());
  }

  if (input.analyzer?.trim()) {
    formData.set("analyzer", input.analyzer.trim());
  }

  const response = normalizeDocumentUploadResponse(
    await apiFetch<RawDocumentUploadResponse>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    }),
  );

  const linkedDocumentId = response.document?.id ?? response.job.document_id;

  if (linkedDocumentId) {
    rememberDocumentJobLink(linkedDocumentId, response.job.id);
  }

  rememberActiveJob(response.job.id);

  return response;
}

export const uploadDocument = startDocumentUpload;

export async function getDocumentTrustedExternalLookupSummary(documentId: string) {
  return apiFetch<DocumentTrustedExternalLookupSummary>(
    `/api/v1/documents/${documentId}/trusted-lookups/external/summary`,
  );
}

export async function startDocumentTrustedExternalLookupRun(documentId: string) {
  const response = await apiFetch<DocumentTrustedExternalLookupRunStartResponse>(
    `/api/v1/documents/${documentId}/trusted-lookups/external/run`,
    { method: "POST" },
  );
  rememberActiveJob(response.job_id);
  rememberDocumentJobLink(documentId, response.job_id);
  return response;
}


export async function startDocumentDiscoveryBuild(documentId: string) {
  const response = await apiFetch<DiscoveryBuildStartResponse>(
    `/api/v1/documents/${documentId}/discovery/build`,
    { method: "POST" },
  );
  rememberActiveJob(response.job_id);
  rememberDocumentJobLink(documentId, response.job_id);
  return response;
}

export async function startDocumentReferenceEvidenceUpdate(
  documentId: string,
  referenceSourceId?: string,
) {
  const response = await apiFetch<DiscoveryBuildStartResponse>(
    `/api/v1/documents/${documentId}/discovery/reference-evidence/update`,
    {
      method: "POST",
      searchParams: {
        reference_source_id: referenceSourceId,
      },
    },
  );
  rememberActiveJob(response.job_id);
  rememberDocumentJobLink(documentId, response.job_id);
  return response;
}

export async function listDocumentDiscoveryCandidates(
  documentId: string,
  params: DiscoveryCandidateParams = {},
) {
  return apiFetch<OffsetPagination<DiscoveryCandidate>>(
    `/api/v1/documents/${documentId}/discovery/candidates`,
    {
      searchParams: {
        search: params.search,
        candidate_type: params.candidate_type,
        resolution_status: params.resolution_status,
        review_status: params.review_status,
        min_interest_score: params.min_interest_score,
        include_suppressed: params.include_suppressed,
        sort: params.sort,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
}

export async function getDocumentDiscoverySummary(documentId: string) {
  return apiFetch<DiscoverySummary>(`/api/v1/documents/${documentId}/discovery/summary`);
}

export async function getDocumentDiscoveryCandidate(
  documentId: string,
  candidateId: string,
  options: { include_technical?: boolean; include_raw_payload?: boolean } = {},
) {
  return apiFetch<DiscoveryCandidateDetailResponse>(
    `/api/v1/documents/${documentId}/discovery/candidates/${candidateId}`,
    {
      searchParams: {
        include_technical: options.include_technical,
        include_raw_payload: options.include_raw_payload,
      },
    },
  );
}

export async function decideDocumentDiscoveryCandidate(
  documentId: string,
  candidateId: string,
  request: DiscoveryDecisionRequest,
) {
  return apiFetch<DiscoveryDecisionResponse>(
    `/api/v1/documents/${documentId}/discovery/candidates/${candidateId}/decision`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}
