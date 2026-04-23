"use client";

import { apiFetch } from "@/lib/api/client";
import { rememberActiveJob, rememberDocumentJobLink } from "@/lib/supabase/session";
import type {
  DocumentPageRead,
  DocumentRead,
  DocumentUploadResponse,
  JobRead,
  ListParams,
  OffsetPagination,
} from "@/lib/types/api";
import { BATCH_PAGE_SIZE } from "@/lib/utils/constants";

export async function listDocuments(params: ListParams = {}) {
  return apiFetch<OffsetPagination<DocumentRead>>("/api/v1/documents", {
    searchParams: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
}

export async function listAllDocuments() {
  const items: DocumentRead[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const page = await listDocuments({ limit: BATCH_PAGE_SIZE, offset });
    items.push(...page.items);
    total = page.total;
    offset += page.limit;

    if (!page.items.length) {
      break;
    }
  }

  return items;
}

export async function getDocument(documentId: string) {
  return apiFetch<DocumentRead>(`/api/v1/documents/${documentId}`);
}

async function listDocumentPagesPage(documentId: string, params: ListParams = {}) {
  return apiFetch<OffsetPagination<DocumentPageRead>>(`/api/v1/documents/${documentId}/pages`, {
    searchParams: {
      limit: params.limit ?? BATCH_PAGE_SIZE,
      offset: params.offset ?? 0,
    },
  });
}

export async function listDocumentPages(documentId: string) {
  const items: DocumentPageRead[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const page = await listDocumentPagesPage(documentId, {
      limit: BATCH_PAGE_SIZE,
      offset,
    });

    items.push(...page.items);
    total = page.total;
    offset += page.limit;

    if (!page.items.length) {
      break;
    }
  }

  return items;
}

type RawDocumentUploadResponse = DocumentUploadResponse | { document: DocumentRead; job: JobRead };

function normalizeDocumentUploadResponse(response: RawDocumentUploadResponse): DocumentUploadResponse {
  return {
    document: response.document ?? null,
    job: response.job,
    message: "message" in response ? response.message ?? null : null,
    resource_summary: "resource_summary" in response ? response.resource_summary ?? null : null,
  };
}

export async function startDocumentUpload(input: { file: File; title?: string }) {
  const formData = new FormData();
  formData.set("file", input.file);

  if (input.title?.trim()) {
    formData.set("title", input.title.trim());
  }

  const response = normalizeDocumentUploadResponse(
    await apiFetch<RawDocumentUploadResponse>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    }),
  );

  const linkedDocumentId = response.document?.id ?? response.job.document_id;

  if (linkedDocumentId) {
    rememberDocumentJobLink(linkedDocumentId, response.job.id);
  }

  rememberActiveJob(response.job.id);

  return response;
}

export const uploadDocument = startDocumentUpload;
