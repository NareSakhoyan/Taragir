"use client";

import { ApiError, apiFetch } from "@/lib/api/client";
import {
  forgetActiveJob,
  rememberActiveJob,
  rememberDocumentJobLink,
  rememberReferenceSourceJobLink,
} from "@/lib/supabase/session";
import type { JobKind, JobRead, ListParams, RetryJobResponse, StageEvent } from "@/lib/types/api";
import { JOB_ACTIVE_STATUSES } from "@/lib/utils/constants";

type JobListEnvelope<T> = T[] | { items: T[] };

function unwrapJobs<T>(payload: JobListEnvelope<T>) {
  return Array.isArray(payload) ? payload : payload.items;
}

function rememberJobResourceLink(job: JobRead) {
  if (job.document_id) {
    rememberDocumentJobLink(job.document_id, job.id);
  }

  const resourceType = job.result_resource_type ?? job.resource_summary?.resource_type;
  const resourceId = job.result_resource_id ?? job.resource_summary?.id;

  if (resourceType === "reference_source" && resourceId) {
    rememberReferenceSourceJobLink(resourceId, job.id);
  }

  if (JOB_ACTIVE_STATUSES.has(job.status)) {
    rememberActiveJob(job.id);
  } else {
    forgetActiveJob(job.id);
  }
}

export async function getJob(jobId: string) {
  const job = await apiFetch<JobRead>(`/api/v1/jobs/${jobId}`);
  rememberJobResourceLink(job);
  return job;
}

export async function listJobs(params: ListParams = {}) {
  try {
    const response = await apiFetch<JobListEnvelope<JobRead>>("/api/v1/jobs", {
      searchParams: {
        limit: params.limit ?? 12,
        offset: params.offset ?? 0,
      },
    });

    return unwrapJobs(response);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return null;
    }

    throw error;
  }
}

export async function retryJobStart(jobId: string) {
  const response = await apiFetch<RetryJobResponse | JobRead>(`/api/v1/jobs/${jobId}/retry`, {
    method: "POST",
  });

  const normalized =
    "job" in response
      ? response
      : {
          job: response,
          message: null,
        };

  const job = normalized.job;

  rememberJobResourceLink(job);
  rememberActiveJob(job.id);

  return normalized;
}

export const retryJob = retryJobStart;

type JobEventsEnvelope = StageEvent[] | { items: StageEvent[] };

function unwrapJobEvents(payload: JobEventsEnvelope) {
  return Array.isArray(payload) ? payload : payload.items;
}

export async function getJobEvents(jobId: string, jobKind?: JobKind | null) {
  try {
    const response = await apiFetch<JobEventsEnvelope>(`/api/v1/jobs/${jobId}/events`, {
      searchParams: {
        ...(jobKind ? { job_kind: jobKind } : {}),
      },
    });
    return unwrapJobEvents(response);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return [];
    }

    throw error;
  }
}
