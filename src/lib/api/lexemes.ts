"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  LexemeCreateRequest,
  LexemeCreateResponse,
  LexemeDetail,
  LexemeMergeGroupsRequest,
  LexemePickerItem,
  LexemePickerListParams,
  LexemeSummary,
  LexemesListParams,
  LexemeUpdateRequest,
  OffsetPagination,
} from "@/lib/types/api";
import { LEXEMES_PAGE_SIZE } from "@/lib/utils/constants";

export async function createLexeme(payload: LexemeCreateRequest) {
  return apiFetch<LexemeCreateResponse>("/api/v1/lexemes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLexemes(params: LexemesListParams = {}) {
  return apiFetch<OffsetPagination<LexemeSummary>>("/api/v1/lexemes", {
    searchParams: {
      search: params.search,
      reference_status: params.reference_status,
      include_reference_summary: params.include_reference_summary,
      limit: params.limit ?? LEXEMES_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}

export async function getLexemePicker(params: LexemePickerListParams = {}) {
  return apiFetch<OffsetPagination<LexemePickerItem>>("/api/v1/lexemes/picker", {
    searchParams: {
      search: params.search,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
}

export async function getLexeme(lexemeId: string) {
  return apiFetch<LexemeDetail>(`/api/v1/lexemes/${lexemeId}`);
}

export async function updateLexeme(lexemeId: string, payload: LexemeUpdateRequest) {
  return apiFetch<LexemeDetail>(`/api/v1/lexemes/${lexemeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function mergeLexemeGroups(lexemeId: string, payload: LexemeMergeGroupsRequest) {
  return apiFetch<LexemeDetail>(`/api/v1/lexemes/${lexemeId}/merge-groups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
