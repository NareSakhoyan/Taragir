import type {
  JobRead,
  JobResourceSummary,
  ReferenceMatchingRunDetail,
  StartReferenceMatchingRunResponse,
} from "@/lib/types/api";
import type { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";
import { humanizeSnakeCase } from "@/lib/utils/format";

type I18nMessages = ReturnType<typeof useI18n>["messages"];
type JobMessages = I18nMessages["job"];

export function resolveJobStageLabel(
  job: Pick<JobRead, "current_stage_label" | "step" | "status">,
  messages: I18nMessages,
) {
  if (job.current_stage_label?.trim()) {
    return job.current_stage_label;
  }

  if (job.step?.trim()) {
    return humanizeSnakeCase(job.step);
  }

  switch (job.status) {
    case "queued":
      return messages.status.queued;
    case "running":
      return messages.status.running;
    case "completed":
      return messages.status.completed;
    case "failed":
      return messages.job.failedTitle;
    default:
      return messages.job.pending;
  }
}

export function resolveJobStageMessage(
  job: Pick<JobRead, "stage_message_user" | "status" | "error_message_user">,
  messages: I18nMessages,
) {
  if (job.stage_message_user?.trim()) {
    return job.stage_message_user;
  }

  switch (job.status) {
    case "queued":
      return messages.job.queueMessage;
    case "running":
      return messages.job.processingMessage;
    case "completed":
      return messages.job.completedMessage;
    case "failed":
      return job.error_message_user?.trim() || messages.job.failedFallbackMessage;
    default:
      return messages.job.processingMessage;
  }
}

function normalizeJobKind(jobKind?: string | null) {
  return jobKind?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

export function isMorphologyJobKind(jobKind?: string | null) {
  switch (normalizeJobKind(jobKind)) {
    case "morphology":
    case "morphology_analysis":
    case "pie_morphology":
    case "pie_morphology_analysis":
      return true;
    default:
      return false;
  }
}

function normalizeResourceType(resourceType?: string | null) {
  return resourceType?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

export function formatJobKind(jobKind: string | null | undefined, messages: JobMessages) {
  switch (normalizeJobKind(jobKind)) {
    case "document_ingestion":
    case "document_upload":
    case "ingestion":
      return messages.jobKinds.documentIngestion;
    case "retry_ingestion":
    case "document_retry":
    case "ingestion_retry":
      return messages.jobKinds.retryIngestion;
    case "reference_source_import":
    case "reference_import":
      return messages.jobKinds.referenceImport;
    case "reference_matching_run":
    case "reference_matching":
      return messages.jobKinds.referenceMatching;
    case "morphology":
    case "morphology_analysis":
    case "pie_morphology":
    case "pie_morphology_analysis":
      return messages.jobKinds.morphologyAnalysis;
    default:
      return jobKind?.trim() ? humanizeSnakeCase(jobKind) : messages.jobKinds.background;
  }
}

function resolveResourcePath(resourceType?: string | null, resourceId?: string | null) {
  if (!resourceId) {
    return null;
  }

  switch (normalizeResourceType(resourceType)) {
    case "document":
      return `${ROUTES.documents}/${resourceId}`;
    case "reference_source":
      return `${ROUTES.references}/${resourceId}`;
    case "reference_matching_run":
    case "matching_run":
      return `${ROUTES.referenceMatching}/${resourceId}`;
    default:
      return null;
  }
}

function resolveResourceLabel(resourceType: string | null | undefined, messages: JobMessages) {
  switch (normalizeResourceType(resourceType)) {
    case "document":
      return messages.openDocument;
    case "reference_source":
      return messages.openReferenceSource;
    case "reference_matching_run":
    case "matching_run":
      return messages.openMatchingRun;
    default:
      return messages.openResult;
  }
}

export function isIngestionJobKind(jobKind?: string | null) {
  switch (normalizeJobKind(jobKind)) {
    case "document_ingestion":
    case "document_upload":
    case "ingestion":
    case "retry_ingestion":
    case "document_retry":
    case "ingestion_retry":
      return true;
    default:
      return false;
  }
}

export function resolveJobResultAction(job: JobRead, messages: JobMessages) {
  const documentId = job.document_id ?? (job.result_resource_type === "document" ? job.result_resource_id : null);

  if (isIngestionJobKind(job.job_kind) && documentId) {
    return {
      href: `${ROUTES.lexicon}?document_id=${documentId}&view=candidates`,
      label: messages.reviewCandidates,
      secondaryHref: `${ROUTES.documents}/${documentId}`,
      secondaryLabel: messages.openDocument,
    };
  }

  const resourcePath =
    resolveResourcePath(job.result_resource_type, job.result_resource_id) ??
    resolveResourcePath(job.resource_summary?.resource_type, job.resource_summary?.id) ??
    (documentId ? `${ROUTES.documents}/${documentId}?jobId=${job.id}` : null);

  const resourceType =
    job.result_resource_type ??
    job.resource_summary?.resource_type ??
    (documentId ? "document" : null);

  if (!resourcePath) {
    return null;
  }

  return {
    href: resourcePath,
    label: resolveResourceLabel(resourceType, messages),
  };
}

export function resolveReferenceMatchingTrackingPath(
  response: StartReferenceMatchingRunResponse | ReferenceMatchingRunDetail,
  sourceId?: string | null,
) {
  const appendSourceQuery = (path: string | null) => {
    if (!path || !sourceId) {
      return path;
    }

    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}source=${encodeURIComponent(sourceId)}`;
  };

  const directRunId = "id" in response ? response.id : response.run?.id;

  if (directRunId) {
    return appendSourceQuery(`${ROUTES.referenceMatching}/${directRunId}`);
  }

  const resourceSummary = "resource_summary" in response ? response.resource_summary : null;
  const resourcePath = resolveResourcePath(resourceSummary?.resource_type, resourceSummary?.id);

  if (resourcePath) {
    return appendSourceQuery(resourcePath);
  }

  if ("job" in response && response.job?.id) {
    return `${ROUTES.jobs}/${response.job.id}`;
  }

  return null;
}

export function resolveJobTrackingPath(jobId: string) {
  return `${ROUTES.jobs}/${jobId}`;
}

export function getJobResourceSummary(job: JobRead): JobResourceSummary | null {
  if (job.resource_summary?.id || job.resource_summary?.resource_type) {
    return job.resource_summary;
  }

  if (job.result_resource_id || job.result_resource_type) {
    return {
      id: job.result_resource_id ?? null,
      resource_type: job.result_resource_type ?? null,
    };
  }

  if (job.document_id) {
    return {
      id: job.document_id,
      resource_type: "document",
    };
  }

  return null;
}
