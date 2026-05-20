"use client";

import { ApiError, apiFetch } from "@/lib/api/client";
import {
  rememberActiveJob,
  rememberDocumentJobLink,
  rememberReferenceSourceJobLink,
} from "@/lib/supabase/session";
import type {
  JobRead,
  JobResourceSummary,
  MorphologyAnalyzer,
  MorphologySourceType,
  MorphologySummary,
  StartMorphologyRunResponse,
  UpdateMorphologySettingsRequest,
  UpdateMorphologySettingsResponse,
  WordMorphologyDetail,
} from "@/lib/types/api";
import {
  normalizeMorphologySettings,
  normalizeMorphologySummary,
  normalizeWordMorphologyDetail,
} from "@/lib/utils/morphology";

type RawMorphologySummary = Partial<MorphologySummary> & Record<string, unknown>;
type RawWordMorphology = Partial<WordMorphologyDetail> & Record<string, unknown>;
type RawStartMorphologyRunResponse = StartMorphologyRunResponse | JobRead;
type RawUpdateMorphologySettingsResponse =
  | UpdateMorphologySettingsResponse
  | JobRead
  | (Record<string, unknown> & {
      job?: JobRead | null;
      message?: string | null;
      resource_summary?: JobResourceSummary | null;
      settings?: unknown;
    });

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

async function apiFetchWithFallback<T>(
  paths: string[],
  options?: Parameters<typeof apiFetch<T>>[1],
) {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      return await apiFetch<T>(path, options);
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
}

function rememberMorphologyJobLink(sourceType: MorphologySourceType, sourceId: string, jobId: string) {
  if (sourceType === "document") {
    rememberDocumentJobLink(sourceId, jobId);
  } else {
    rememberReferenceSourceJobLink(sourceId, jobId);
  }

  rememberActiveJob(jobId);
}

function isJobRead(value: unknown): value is JobRead {
  const record = asRecord(value);
  return Boolean(record && typeof record.id === "string" && typeof record.status === "string");
}

function normalizeStartMorphologyRunResponse(
  response: RawStartMorphologyRunResponse,
): StartMorphologyRunResponse {
  return "job" in response
    ? {
        job: response.job,
        message: response.message ?? null,
        resource_summary: response.resource_summary ?? null,
      }
    : {
        job: response,
        message: null,
        resource_summary: null,
      };
}

function normalizeUpdateMorphologySettingsResponse(
  response: RawUpdateMorphologySettingsResponse,
): UpdateMorphologySettingsResponse {
  if (isJobRead(response)) {
    return {
      job: response,
      message: null,
      resource_summary: null,
      settings: null,
    };
  }

  const record = asRecord(response);
  const settings =
    normalizeMorphologySettings(record?.settings) ??
    normalizeMorphologySettings(record);

  return {
    job: isJobRead(record?.job) ? record.job : null,
    message: typeof record?.message === "string" ? record.message : null,
    resource_summary: (record?.resource_summary as JobResourceSummary | null | undefined) ?? null,
    settings,
  };
}

function getLegacyMorphologyRunPath(sourceType: MorphologySourceType, sourceId: string) {
  return sourceType === "document"
    ? [`/api/v1/documents/${sourceId}/morphology/run`, `/api/v1/documents/${sourceId}/morphology/start`]
    : [
        `/api/v1/reference-sources/${sourceId}/morphology/run`,
        `/api/v1/reference-sources/${sourceId}/morphology/start`,
      ];
}

function getMorphologySettingsPath(sourceType: MorphologySourceType, sourceId: string) {
  return sourceType === "document"
    ? [`/api/v1/documents/${sourceId}/morphology-settings`]
    : [`/api/v1/reference-sources/${sourceId}/morphology-settings`];
}

function getMorphologySummaryPath(sourceType: MorphologySourceType, sourceId: string) {
  return sourceType === "document"
    ? [
        `/api/v1/documents/${sourceId}/morphology-summary`,
        `/api/v1/documents/${sourceId}/morphology/summary`,
      ]
    : [
        `/api/v1/reference-sources/${sourceId}/morphology-summary`,
        `/api/v1/reference-sources/${sourceId}/morphology/summary`,
      ];
}

export async function startMorphologyRun(input: {
  sourceType: MorphologySourceType;
  sourceId: string;
  analyzer?: MorphologyAnalyzer | null;
}) {
  let response: StartMorphologyRunResponse;

  try {
    response = normalizeStartMorphologyRunResponse(
      await apiFetch<RawStartMorphologyRunResponse>("/api/v1/morphology/runs", {
        method: "POST",
        body: JSON.stringify(
          input.sourceType === "document"
            ? {
                document_id: input.sourceId,
                analyzer: input.analyzer ?? "pie",
              }
            : {
                reference_source_id: input.sourceId,
                analyzer: input.analyzer ?? "pie",
              },
        ),
      }),
    );
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }

    response = normalizeStartMorphologyRunResponse(
      await apiFetchWithFallback<RawStartMorphologyRunResponse>(
        getLegacyMorphologyRunPath(input.sourceType, input.sourceId),
        {
          method: "POST",
        },
      ),
    );
  }

  rememberMorphologyJobLink(input.sourceType, input.sourceId, response.job.id);

  return response;
}

export async function updateMorphologySettings(input: {
  sourceType: MorphologySourceType;
  sourceId: string;
  settings: UpdateMorphologySettingsRequest;
}) {
  const response = normalizeUpdateMorphologySettingsResponse(
    await apiFetchWithFallback<RawUpdateMorphologySettingsResponse>(getMorphologySettingsPath(input.sourceType, input.sourceId), {
      method: "PATCH",
      body: JSON.stringify({
        language_stage: input.settings.language_stage ?? null,
        morphology_profile: input.settings.morphology_profile ?? null,
        run_morphology: input.settings.run_morphology ?? false,
        analyzer: input.settings.analyzer ?? null,
      }),
    }),
  );

  if (response.job?.id) {
    rememberMorphologyJobLink(input.sourceType, input.sourceId, response.job.id);
  }

  return response;
}

async function getMorphologySummary(sourceType: MorphologySourceType, sourceId: string) {
  try {
    const payload = await apiFetchWithFallback<RawMorphologySummary>(getMorphologySummaryPath(sourceType, sourceId));
    return normalizeMorphologySummary(payload, sourceType);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return null;
    }

    throw error;
  }
}

export function getDocumentMorphologySummary(documentId: string) {
  return getMorphologySummary("document", documentId);
}

export function getReferenceSourceMorphologySummary(sourceId: string) {
  return getMorphologySummary("reference_source", sourceId);
}

export async function getWordMorphology(input: {
  id?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  normalizedForm?: string | null;
  q?: string | null;
}) {
  const normalizedForm = input.normalizedForm?.trim() ?? "";

  if (!normalizedForm) {
    return null;
  }

  try {
    const payload = await apiFetch<RawWordMorphology>(
      `/api/v1/words/${encodeURIComponent(normalizedForm)}/morphology`,
    );

    return normalizeWordMorphologyDetail(payload);
  } catch (error) {
    if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
      throw error;
    }

    try {
      const payload = await apiFetchWithFallback<RawWordMorphology>(
        ["/api/v1/word-morphology", "/api/v1/words/morphology"],
        {
          searchParams: {
            id: input.id ?? undefined,
            evidence_id: input.id ?? undefined,
            source_type: input.sourceType ?? undefined,
            source_id: input.sourceId ?? undefined,
            normalized_form: normalizedForm,
            q: input.q ?? undefined,
          },
        },
      );

      return normalizeWordMorphologyDetail(payload);
    } catch (fallbackError) {
      if (fallbackError instanceof ApiError && (fallbackError.status === 404 || fallbackError.status === 405)) {
        return null;
      }

      throw fallbackError;
    }
  }
}
