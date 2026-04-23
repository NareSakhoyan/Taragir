"use client";

import { ApiError, apiFetch } from "@/lib/api/client";
import { rememberActiveJob } from "@/lib/supabase/session";
import type {
  OffsetPagination,
  ReferenceMatchingRunResultDetail,
  ReferenceMatchingRunResultsParams,
  ReferenceMatchingRunResultSummary,
  ReferenceMatchingRunDetail,
  ReferenceMatchingRunSummary,
  StartReferenceMatchingRunResponse,
  StageEvent,
  StartReferenceMatchingRunRequest,
} from "@/lib/types/api";

type ListEnvelope<T> = T[] | { items: T[] };

function unwrapList<T>(payload: ListEnvelope<T>) {
  return Array.isArray(payload) ? payload : payload.items;
}

function normalizeOffsetPagination<T>(
  payload: OffsetPagination<T> | ListEnvelope<T>,
  params: ReferenceMatchingRunResultsParams,
): OffsetPagination<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      limit: params.limit ?? payload.length,
      offset: params.offset ?? 0,
    };
  }

  if ("total" in payload && "limit" in payload && "offset" in payload) {
    return payload;
  }

  return {
    items: payload.items,
    total: payload.items.length,
    limit: params.limit ?? payload.items.length,
    offset: params.offset ?? 0,
  };
}

export async function startReferenceMatchingRun(payload: StartReferenceMatchingRunRequest) {
  const response = await apiFetch<StartReferenceMatchingRunResponse | ReferenceMatchingRunDetail>(
    "/api/v1/reference-matching/runs",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if ("id" in response) {
    return {
      run: response,
      job: null,
      message: null,
      resource_summary: {
        id: response.id,
        resource_type: "reference_matching_run",
      },
    } satisfies StartReferenceMatchingRunResponse;
  }

  if (response.job?.id) {
    rememberActiveJob(response.job.id);
  }

  return response;
}

export async function getReferenceMatchingRuns() {
  const response = await apiFetch<ListEnvelope<ReferenceMatchingRunSummary>>("/api/v1/reference-matching/runs");
  return unwrapList(response);
}

export async function getReferenceMatchingRun(runId: string) {
  return apiFetch<ReferenceMatchingRunDetail>(`/api/v1/reference-matching/runs/${runId}`);
}

export async function getReferenceMatchingRunResults(
  runId: string,
  params: ReferenceMatchingRunResultsParams = {},
) {
  const response = await apiFetch<OffsetPagination<ReferenceMatchingRunResultSummary> | ListEnvelope<ReferenceMatchingRunResultSummary>>(
    `/api/v1/reference-matching/runs/${runId}/results`,
    {
      searchParams: {
        match_status: params.match_status ?? "all",
        target_scope: params.target_scope ?? "any",
        search: params.search ?? "",
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );

  return normalizeOffsetPagination(response, params);
}

export async function getReferenceMatchingRunResultDetail(runId: string, resultId: string) {
  return apiFetch<ReferenceMatchingRunResultDetail>(
    `/api/v1/reference-matching/runs/${runId}/results/${resultId}`,
  );
}

export async function getReferenceMatchingRunEvents(runId: string) {
  try {
    return await apiFetch<ListEnvelope<StageEvent>>(`/api/v1/reference-matching/runs/${runId}/events`).then(
      unwrapList,
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return [];
    }

    throw error;
  }
}
