"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  LexemeCreateRequest,
  LexemeCreateResponse,
  LexemeDetail,
  LexemeMergeGroupsRequest,
  LexemeSummary,
  LexemeUpdateRequest,
  OffsetPagination,
  SearchListParams,
} from "@/lib/types/api";
import { LEXEMES_PAGE_SIZE } from "@/lib/utils/constants";

export async function createLexeme(payload: LexemeCreateRequest) {
  return apiFetch<LexemeCreateResponse>("/api/v1/lexemes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLexemes(params: SearchListParams = {}) {
  return apiFetch<OffsetPagination<LexemeSummary>>("/api/v1/lexemes", {
    searchParams: {
      search: params.search,
      limit: params.limit ?? LEXEMES_PAGE_SIZE,
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
