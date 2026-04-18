"use client";

import { apiFetch } from "@/lib/api/client";
import { rememberDocumentJobLink } from "@/lib/supabase/session";
import type { IngestionJobRead, RetryJobResponse } from "@/lib/types/api";

export async function getJob(jobId: string) {
  const job = await apiFetch<IngestionJobRead>(`/api/v1/jobs/${jobId}`);
  rememberDocumentJobLink(job.document_id, job.id);
  return job;
}

export async function retryJob(jobId: string) {
  const response = await apiFetch<RetryJobResponse | IngestionJobRead>(`/api/v1/jobs/${jobId}/retry`, {
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

  if (job.document_id) {
    rememberDocumentJobLink(job.document_id, job.id);
  }

  return normalized;
}
