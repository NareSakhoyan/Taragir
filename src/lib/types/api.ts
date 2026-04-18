export type UUID = string;

export type DocumentStatus = "uploaded" | "queued" | "processing" | "completed" | "failed";
export type IngestionJobStatus = "queued" | "running" | "completed" | "failed";
export type ExtractionMethod = "pdf_text" | "ocr";
export type LexemeStatus = string;
export type LexiconView = "candidates" | "linked" | "suspicious" | "ignored" | "all";
export type LexiconGroupState = "unreviewed" | "linked" | "ignored_noise";
export type LexiconScriptType = "armenian" | "latin" | "mixed" | "digit_mixed" | "other";

export type OffsetPagination<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type DocumentRead = {
  id: UUID;
  user_id: UUID;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  sha256: string;
  page_count: number | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
};

export type DocumentPageRead = {
  id: UUID;
  document_id: UUID;
  page_number: number;
  extraction_method: ExtractionMethod;
  page_image_bucket: string | null;
  page_image_path: string | null;
  extracted_text: string;
  char_count: number;
  created_at: string;
};

export type OccurrenceRead = {
  id: UUID;
  document_id: UUID;
  page_id: UUID;
  page_number: number;
  token: string;
  normalized_token: string;
  context_snippet: string;
  char_start: number | null;
  char_end: number | null;
  created_at: string;
};

export type IngestionJobRead = {
  id: UUID;
  document_id: UUID;
  user_id: UUID;
  status: IngestionJobStatus;
  step: string | null;
  progress_percent: number;
  error_message: string | null;
  error_code?: string | null;
  error_message_user?: string | null;
  next_steps?: string[] | null;
  can_retry?: boolean;
  retry_count?: number;
  last_retried_at?: string | null;
  retry_of_job_id?: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type RetryJobResponse = {
  job: IngestionJobRead;
  message?: string | null;
};

export type DocumentUploadResponse = {
  document: DocumentRead;
  job: IngestionJobRead;
};

export type ListParams = {
  limit?: number;
  offset?: number;
};

export type SearchListParams = ListParams & {
  search?: string;
};

export type OccurrenceListParams = ListParams & {
  page_number?: number;
  normalized_token?: string;
};

export type LexiconGroupsListParams = SearchListParams & {
  view?: LexiconView;
  linked_only?: boolean;
  document_id?: UUID;
};

export type LexiconGroupSummary = {
  normalized_form: string;
  occurrence_count: number;
  document_count: number;
  page_count: number;
  sample_tokens: string[];
  sample_contexts: string[];
  sample_document_titles: string[];
  linked_lexeme_id: UUID | null;
  linked_lexeme_canonical_form: string | null;
  group_state: LexiconGroupState;
  dominant_script_type: LexiconScriptType;
  is_suspicious: boolean;
  suspicion_reasons: string[];
};

export type LexiconGroupOccurrence = {
  id: UUID;
  document_id: UUID;
  document_title: string;
  page_id: UUID;
  page_number: number;
  token: string;
  normalized_token: string;
  context_snippet: string;
  created_at: string;
};

export type LexiconGroupDetail = {
  normalized_form: string;
  occurrence_count: number;
  document_count: number;
  page_count: number;
  linked_lexeme_id: UUID | null;
  linked_lexeme_canonical_form: string | null;
  group_state: LexiconGroupState;
  dominant_script_type: LexiconScriptType;
  is_suspicious: boolean;
  suspicion_reasons: string[];
  occurrences: LexiconGroupOccurrence[];
};

export type LexiconGroupMutationRequest = {
  normalized_forms: string[];
};

export type LexemeCreateRequest = {
  canonical_form: string;
  normalized_forms: string[];
  notes?: string;
  status?: LexemeStatus;
};

export type LexemeUpdateRequest = {
  canonical_form?: string;
  notes?: string;
  status?: LexemeStatus;
};

export type LexemeMergeGroupsRequest = {
  normalized_forms: string[];
};

export type LexemeSummary = {
  id: UUID;
  canonical_form: string;
  canonical_normalized_form: string;
  status: LexemeStatus;
  notes: string | null;
  form_count: number;
  occurrence_count: number;
  created_at: string;
  updated_at: string;
};

export type LexemeDetail = {
  id: UUID;
  canonical_form: string;
  canonical_normalized_form: string;
  status: LexemeStatus;
  notes: string | null;
  normalized_forms: string[];
  occurrence_count: number;
  sample_contexts: string[];
  created_at: string;
  updated_at: string;
};

export type LexemeCreateResponse = Pick<LexemeDetail, "id"> &
  Partial<Omit<LexemeDetail, "id">>;

export type ApiErrorResponse = {
  detail?: string | { msg?: string }[] | Record<string, unknown>;
};
