"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  LexiconActionRequest,
  LexiconActionResponse,
  LexiconGroupDetail,
  LexiconGroupLinkRequest,
  LexiconGroupLinkResponse,
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
      reference_status: params.reference_status,
      sort_by: params.sort_by,
      sort_dir: params.sort_dir,
      include_reference_summary: params.include_reference_summary,
      limit: params.limit ?? LEXICON_GROUPS_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}

export async function getLexiconGroup(normalizedForm: string) {
  return apiFetch<LexiconGroupDetail>(`/api/v1/lexicon/groups/${encodeURIComponent(normalizedForm)}`);
}

export async function applyLexiconAction(payload: LexiconActionRequest) {
  return apiFetch<LexiconActionResponse>("/api/v1/lexicon/actions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function linkLexiconGroupsToLexeme(payload: LexiconGroupLinkRequest) {
  const response = await applyLexiconAction({
    action: "merge_into_lexeme",
    lexeme_id: payload.lexeme_id,
    normalized_forms: payload.normalized_forms,
  });
  return {
    lexeme_id: response.lexeme_id ?? payload.lexeme_id,
    lexeme_canonical_form: response.lexeme_canonical_form ?? "",
    normalized_forms: response.normalized_forms,
    group_state: response.group_state ?? "linked",
  } satisfies LexiconGroupLinkResponse;
}
