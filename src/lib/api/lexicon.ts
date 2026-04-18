"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  LexiconGroupDetail,
  LexiconGroupMutationRequest,
  LexiconGroupsListParams,
  LexiconGroupSummary,
  OffsetPagination,
} from "@/lib/types/api";
import { LEXICON_GROUPS_PAGE_SIZE } from "@/lib/utils/constants";

export async function getLexiconGroups(params: LexiconGroupsListParams = {}) {
  return apiFetch<OffsetPagination<LexiconGroupSummary>>("/api/v1/lexicon/groups", {
    searchParams: {
      search: params.search,
      view: params.view,
      linked_only: params.linked_only,
      document_id: params.document_id,
      limit: params.limit ?? LEXICON_GROUPS_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}

export async function getLexiconGroup(normalizedForm: string) {
  return apiFetch<LexiconGroupDetail>(`/api/v1/lexicon/groups/${encodeURIComponent(normalizedForm)}`);
}

export async function ignoreLexiconGroups(payload: LexiconGroupMutationRequest) {
  return apiFetch<void>("/api/v1/lexicon/groups/ignore", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unignoreLexiconGroups(payload: LexiconGroupMutationRequest) {
  return apiFetch<void>("/api/v1/lexicon/groups/unignore", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
