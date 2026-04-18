"use client";

import { apiFetch } from "@/lib/api/client";
import type { OccurrenceListParams, OccurrenceRead, OffsetPagination } from "@/lib/types/api";
import { OCCURRENCES_PAGE_SIZE } from "@/lib/utils/constants";

export async function listDocumentOccurrences(documentId: string, params: OccurrenceListParams = {}) {
  return apiFetch<OffsetPagination<OccurrenceRead>>(`/api/v1/documents/${documentId}/occurrences`, {
    searchParams: {
      page_number: params.page_number,
      normalized_token: params.normalized_token,
      limit: params.limit ?? OCCURRENCES_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}
