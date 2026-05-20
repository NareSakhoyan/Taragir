"use client";

import { apiFetch } from "@/lib/api/client";
import type { DocumentWorkflowRead, ListParams, OffsetPagination, ReviewQueueItem } from "@/lib/types/api";

export async function getDocumentWorkflow(documentId: string) {
  return apiFetch<DocumentWorkflowRead>(`/api/v1/documents/${documentId}/workflow`);
}

export async function getReviewQueue(params: ListParams = {}) {
  return apiFetch<OffsetPagination<ReviewQueueItem>>("/api/v1/me/review-queue", {
    searchParams: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
}
