import { ROUTES } from "@/lib/utils/constants";

type SearchParamsLike = {
  toString(): string;
};

export const DOCUMENT_PAGE_QUERY_PARAM = "page";

function cloneSearchParams(searchParams?: SearchParamsLike | string | null) {
  if (typeof searchParams === "string") {
    return new URLSearchParams(searchParams);
  }

  return new URLSearchParams(searchParams?.toString() ?? "");
}

export function parseDocumentEvidencePage(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const pageNumber = Number.parseInt(value, 10);

  if (!Number.isFinite(pageNumber) || pageNumber < 1) {
    return null;
  }

  return pageNumber;
}

export function buildDocumentEvidenceHref(
  documentId: string | null | undefined,
  pageNumber?: number | null,
) {
  if (!documentId) {
    return null;
  }

  const params = new URLSearchParams();

  if (pageNumber != null) {
    params.set(DOCUMENT_PAGE_QUERY_PARAM, String(pageNumber));
  }

  const query = params.toString();
  return `${ROUTES.documents}/${documentId}${query ? `?${query}` : ""}`;
}

export function buildPathWithDocumentPage(
  pathname: string,
  searchParams?: SearchParamsLike | string | null,
  pageNumber?: number | null,
) {
  const nextParams = cloneSearchParams(searchParams);

  if (pageNumber != null) {
    nextParams.set(DOCUMENT_PAGE_QUERY_PARAM, String(pageNumber));
  } else {
    nextParams.delete(DOCUMENT_PAGE_QUERY_PARAM);
  }

  const query = nextParams.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
