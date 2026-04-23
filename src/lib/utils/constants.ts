export const ACCESS_TOKEN_COOKIE = "baghramyan-access-token";
export const REFRESH_TOKEN_COOKIE = "baghramyan-refresh-token";
export const REDIRECT_QUERY_PARAM = "next";
export const DOCUMENT_JOB_STORAGE_KEY = "baghramyan-document-job-map";
export const REFERENCE_SOURCE_JOB_STORAGE_KEY = "baghramyan-reference-source-job-map";
export const ACTIVE_JOB_STORAGE_KEY = "baghramyan-active-job-ids";
export const JOB_TRACKER_EVENT = "baghramyan:job-tracker-changed";

export const ROUTES = {
  root: "/",
  login: "/login",
  dashboard: "/dashboard",
  documents: "/documents",
  lexicon: "/lexicon",
  lexemes: "/lexemes",
  references: "/references",
  referenceMatching: "/reference-matching",
  words: "/words",
  jobs: "/jobs",
} as const;

export const DOCUMENT_PAGE_SIZE = 20;
export const RECENT_DOCUMENTS_LIMIT = 8;
export const OCCURRENCES_PAGE_SIZE = 25;
export const LEXICON_GROUPS_PAGE_SIZE = 25;
export const LEXEMES_PAGE_SIZE = 20;
export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100] as const;
export const BATCH_PAGE_SIZE = 200;
export const JOB_POLL_INTERVAL_MS = 3_000;
export const MATCH_RUN_POLL_INTERVAL_MS = 3_000;
export const DEFAULT_LEXEME_STATUS = "draft";
export const DEFAULT_REFERENCE_SOURCE_TYPE = "imported_wordlist";
export const ACCEPTED_REFERENCE_SOURCE_FILE_INPUT = ".txt,.csv,.docx,.pdf,.xlsx,text/plain,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const ACTIVE_REFERENCE_MATCHING_RUN_STATUSES = new Set(["queued", "running"]);

export const DOCUMENT_STATUSES = [
  "uploaded",
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export const JOB_ACTIVE_STATUSES = new Set(["queued", "running"]);

export const ACCEPTED_FILE_INPUT = "application/pdf,image/*";
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff",
  "image/webp",
  "image/gif",
] as const;
