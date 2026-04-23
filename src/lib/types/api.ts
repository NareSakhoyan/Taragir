export type UUID = string;

export type DocumentStatus = "uploaded" | "queued" | "processing" | "completed" | "failed";
export type JobStatus = "queued" | "running" | "completed" | "failed";
export type IngestionJobStatus = JobStatus;
export type ExtractionMethod = "pdf_text" | "ocr";
export type LexemeStatus = string;
export type LexiconView = "candidates" | "linked" | "suspicious" | "ignored" | "all";
export type LexiconGroupState = "unreviewed" | "linked" | "ignored_noise";
export type LexiconScriptType = "armenian" | "latin" | "mixed" | "digit_mixed" | "other";
export type ReferenceStatusFilter = "matched" | "unmatched" | "all";
export type ReferenceMatchType = "exact" | "normalized" | "fuzzy" | string;
export type ReferenceMatchingRunScope = "lexicon_groups" | "lexemes" | "all";
export type ReferenceMatchingRunStatus = "queued" | "running" | "completed" | "failed";
export type ReferenceMatchingDirection = "source_to_internal" | "internal_to_reference";
export type ReferenceMatchingTargetScope = "all_internal" | string;
export type ReferenceImportMethod = "txt" | "csv" | "docx" | "pdf_text" | "pdf_ocr" | "xlsx" | string;
export type JobKind = string;
export type ResultResourceType = "document" | "reference_source" | "reference_matching_run" | string;
export type ReferenceMatchingResultStatusFilter = "matched" | "unmatched" | "all";
export type ReferenceMatchingResultTargetType = "lexicon_group" | "lexeme" | "all";
export type ReferenceMatchingRunResultsScopeFilter = "lexicon_only" | "books_only" | "any";
export type WordSearchMode = "exact" | "normalized" | "fuzzy";
export type WordSearchCategory = "lexicon" | "documents" | "reference_sources" | "trusted_external";
export type WordSourceType =
  | "lexicon"
  | "document"
  | "reference_source"
  | "trusted_external"
  | string;
export type WordCandidateFilter =
  | "all"
  | "unlinked"
  | "linked"
  | "suspicious"
  | "ignored"
  | "matched"
  | "unmatched";

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

export type JobResourceSummary = {
  id?: UUID | null;
  resource_type?: ResultResourceType | null;
  display_name?: string | null;
  title?: string | null;
  status?: string | null;
};

export type JobRead = {
  id: UUID;
  document_id?: UUID | null;
  user_id?: UUID;
  job_kind?: JobKind | null;
  status: JobStatus;
  step: string | null;
  current_stage_code?: string | null;
  current_stage_label?: string | null;
  stage_message_user?: string | null;
  progress_percent?: number | null;
  items_processed?: number | null;
  items_total?: number | null;
  error_message: string | null;
  error_code?: string | null;
  error_message_user?: string | null;
  next_steps?: string[] | null;
  can_retry?: boolean;
  retry_count?: number;
  last_retried_at?: string | null;
  retry_of_job_id?: string | null;
  result_resource_type?: ResultResourceType | null;
  result_resource_id?: UUID | null;
  resource_summary?: JobResourceSummary | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type IngestionJobRead = JobRead;

export type RetryJobResponse = {
  job: JobRead;
  message?: string | null;
  resource_summary?: JobResourceSummary | null;
};

export type DocumentUploadResponse = {
  document?: DocumentRead | null;
  job: JobRead;
  message?: string | null;
  resource_summary?: JobResourceSummary | null;
};

export type ListParams = {
  limit?: number;
  offset?: number;
};

export type SearchListParams = ListParams & {
  search?: string;
};

export type WordSearchParams = ListParams & {
  q: string;
  mode?: WordSearchMode;
  include_lexicon?: boolean;
  include_documents?: boolean;
  include_reference_sources?: boolean;
  include_trusted_external?: boolean;
};

export type WordCandidatesParams = SearchListParams & {
  filter?: WordCandidateFilter;
};

export type OccurrenceListParams = ListParams & {
  page_number?: number;
  normalized_token?: string;
};

export type LexiconGroupsListParams = SearchListParams & {
  view?: LexiconView;
  linked_only?: boolean;
  document_id?: UUID;
  reference_status?: ReferenceStatusFilter;
};

export type LexemesListParams = SearchListParams & {
  reference_status?: ReferenceStatusFilter;
};

export type ReferenceMatchSummary = {
  source_display_name: string;
  matched_form: string;
  match_type: ReferenceMatchType;
  match_score: number | null;
  source_import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
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
  has_reference_match: boolean;
  reference_match_count: number;
  best_reference_match: ReferenceMatchSummary | null;
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
  has_reference_match: boolean;
  reference_match_count: number;
  best_reference_match: ReferenceMatchSummary | null;
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
  has_reference_match: boolean;
  reference_match_count: number;
  best_reference_match: ReferenceMatchSummary | null;
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
  has_reference_match: boolean;
  reference_match_count: number;
  best_reference_match: ReferenceMatchSummary | null;
};

export type LexemeCreateResponse = Pick<LexemeDetail, "id"> &
  Partial<Omit<LexemeDetail, "id">>;

export type ReferenceSourceImportSummary = {
  id: UUID;
  filename: string | null;
  status: string;
  rows_read: number;
  rows_imported: number;
  rows_skipped: number;
  import_method?: ReferenceImportMethod | null;
  warning_message?: string | null;
  error_message: string | null;
  created_at: string;
};

export type ReferenceSourceSummary = {
  id: UUID;
  display_name: string;
  description: string | null;
  source_type: string;
  language: string | null;
  entry_count: number | null;
  created_at: string;
  updated_at: string;
  most_recent_import: ReferenceSourceImportSummary | null;
};

export type ReferenceSourceDetail = ReferenceSourceSummary & {
  entry_count?: number | null;
  last_import_method?: ReferenceImportMethod | null;
  last_import_warning?: string | null;
  last_imported_at?: string | null;
};

export type ReferenceSourceCreateRequest = {
  display_name: string;
  description?: string;
  source_type?: string;
  language?: string;
};

export type ReferenceSourceImportResponse = {
  job: JobRead;
  source_id: UUID;
  source?: ReferenceSourceSummary | ReferenceSourceDetail | null;
  message?: string | null;
  resource_summary?: JobResourceSummary | null;
};

export type ReferenceMatch = {
  source_display_name: string;
  matched_form: string;
  normalized_form: string | null;
  match_type: ReferenceMatchType;
  match_score: number | null;
  source_import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
};

export type LexiconGroupReferenceMatches = {
  target_normalized_form: string;
  has_match: boolean;
  matches: ReferenceMatch[];
};

export type LexemeReferenceMatches = {
  lexeme_id: UUID;
  canonical_form: string;
  canonical_normalized_form: string;
  has_match: boolean;
  matches: ReferenceMatch[];
};

export type ReferenceMatchingRunSummary = {
  id: UUID;
  run_scope: ReferenceMatchingRunScope;
  include_fuzzy: boolean;
  status: ReferenceMatchingRunStatus;
  current_stage_code?: string | null;
  current_stage_label?: string | null;
  stage_message_user?: string | null;
  progress_percent?: number | null;
  items_processed?: number | null;
  items_total?: number | null;
  total_items: number | null;
  matched_items: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
};

export type ReferenceMatchingRunDetail = ReferenceMatchingRunSummary & {
  processed_items: number | null;
  unmatched_items: number | null;
  source_id?: UUID | null;
  source_title?: string | null;
  source_display_name?: string | null;
  source_import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
};

export type ReferenceMatchingRunResultsParams = ListParams & {
  match_status?: ReferenceMatchingResultStatusFilter;
  target_scope?: ReferenceMatchingRunResultsScopeFilter;
  search?: string;
};

export type ReferenceMatchingRunResultSummary = {
  id: UUID;
  run_id: UUID;
  reference_entry_id: UUID;
  source_id: UUID;
  target_label: string;
  normalized_form: string;
  match_status: Exclude<ReferenceMatchingResultStatusFilter, "all">;
  match_count: number;
  source_import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
  exists_in_lexicon: boolean;
  best_lexeme_id: UUID | null;
  best_lexeme_canonical_form: string | null;
  matching_lexeme_count: number;
  found_in_books: boolean;
  matching_book_occurrence_count: number;
  best_document_id: UUID | null;
  best_document_title: string | null;
  best_page_number: number | null;
  best_context_snippet: string | null;
  created_at: string;
  updated_at: string;
};

export type ReferenceMatchingRunResultSourceEntry = {
  reference_entry_id: UUID;
  surface_form: string;
  normalized_form: string;
  source_id: UUID;
  source_display_name: string;
  source_description: string | null;
  source_import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
  source_metadata: Record<string, unknown> | null;
};

export type ReferenceMatchingLexemeSummary = {
  lexeme_id: UUID;
  canonical_form: string;
  canonical_normalized_form: string;
};

export type ReferenceMatchingBookContext = {
  document_id: UUID;
  document_title: string;
  page_number: number | null;
  context_snippet: string | null;
  occurrence_id: UUID | null;
  reference_link: string | null;
};

export type ReferenceMatchingRunResultDetail = ReferenceMatchingRunResultSummary & {
  source_entry: ReferenceMatchingRunResultSourceEntry;
  matching_lexemes: ReferenceMatchingLexemeSummary[];
  book_evidence: ReferenceMatchingBookContext[];
};

export type WordLexemeSummary = {
  id: UUID;
  canonical_form: string;
  canonical_normalized_form?: string | null;
};

export type WordReferenceMatchSummary = {
  has_match: boolean;
  source_name: string | null;
  match_type: ReferenceMatchType | null;
  matched_form: string | null;
  match_score: number | null;
  source_import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
};

export type WordEvidenceSummary = {
  id: UUID | string;
  display_word: string;
  normalized_form: string | null;
  canonical_form: string | null;
  category: WordSearchCategory | null;
  source_type: WordSourceType;
  source_id: UUID | string | null;
  source_title: string | null;
  page_number: number | null;
  context_snippet: string | null;
  reference_link: string | null;
  provider_display_name: string | null;
  matched_form: string | null;
  match_type: ReferenceMatchType | null;
  match_score: number | null;
  occurrence_count: number | null;
  page_count: number | null;
  sample_tokens: string[];
  sample_pages: number[];
  sample_contexts: string[];
  extraction_method: string | null;
  import_method?: ReferenceImportMethod | null;
  source_warning?: string | null;
  is_suspicious: boolean;
  suspicious_reasons: string[];
  is_ignored: boolean;
  is_linked: boolean;
  match_status: Exclude<ReferenceStatusFilter, "all"> | null;
  linked_lexeme: WordLexemeSummary | null;
  reference_match: WordReferenceMatchSummary | null;
};

export type WordInternalEvidenceItem = {
  id?: UUID | string | null;
  page_number: number | null;
  context_snippet: string | null;
  reference_link: string | null;
  source_title: string | null;
  extraction_method?: string | null;
  source_warning?: string | null;
};

export type WordTrustedExternalEvidenceItem = {
  id?: UUID | string | null;
  provider_display_name: string | null;
  source_title: string | null;
  snippet: string | null;
  matched_form: string | null;
  reference_link: string | null;
  match_type: ReferenceMatchType | null;
  match_score: number | null;
  source_warning?: string | null;
  warning_message?: string | null;
};

export type WordEvidenceDetail = WordEvidenceSummary & {
  evidence_items?: WordInternalEvidenceItem[];
  internal_evidence_items?: WordInternalEvidenceItem[];
  trusted_external_evidence_items?: WordTrustedExternalEvidenceItem[];
};

export type WordSearchGroup = {
  category: WordSearchCategory;
  items: WordEvidenceSummary[];
  total: number;
  error_message?: string | null;
};

export type WordSearchResponse = {
  query: string;
  mode: WordSearchMode;
  groups: WordSearchGroup[];
};

export type WordCheckResponse = {
  query: string;
  exists_in_lexicon: boolean;
  matching_lexeme_count: number;
  matching_lexemes: WordLexemeSummary[];
  found_in_documents: boolean;
  found_in_reference_sources: boolean;
  found_in_trusted_external: boolean;
  document_hit_count: number | null;
  reference_source_hit_count: number | null;
  trusted_external_hit_count: number | null;
  trusted_external_providers: string[];
  trusted_external_error_message?: string | null;
};

export type StageEvent = {
  id?: UUID | string;
  stage_code?: string | null;
  stage_label?: string | null;
  stage_message_user?: string | null;
  progress_percent?: number | null;
  items_processed?: number | null;
  items_total?: number | null;
  created_at?: string | null;
};

export type StartReferenceMatchingRunRequest = {
  matching_direction: ReferenceMatchingDirection;
  source_id?: UUID;
  target_scope?: ReferenceMatchingTargetScope;
  run_scope?: ReferenceMatchingRunScope;
  include_fuzzy?: boolean;
};

export type StartReferenceMatchingRunResponse = {
  run?: ReferenceMatchingRunDetail | null;
  job?: JobRead | null;
  message?: string | null;
  resource_summary?: JobResourceSummary | null;
};

export type ApiErrorResponse = {
  detail?: string | { msg?: string }[] | Record<string, unknown>;
};
