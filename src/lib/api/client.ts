"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { persistSessionCookies, redirectToLogin } from "@/lib/supabase/session";
import type { ApiErrorResponse } from "@/lib/types/api";

type Primitive = string | number | boolean;

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  searchParams?: Record<string, Primitive | null | undefined>;
  skipUnauthorizedRedirect?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is missing.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function buildUrl(path: string, searchParams?: Record<string, Primitive | null | undefined>) {
  const url = new URL(path.replace(/^\//, ""), `${getApiBaseUrl()}/`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value != null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function getAccessToken(forceRefresh = false) {
  const supabase = getSupabaseBrowserClient();
  const result = forceRefresh ? await supabase.auth.refreshSession() : await supabase.auth.getSession();
  const session = result.data.session;

  persistSessionCookies(session);

  if (session?.access_token) {
    return session.access_token;
  }

  if (!forceRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    persistSessionCookies(refreshed.data.session);
    return refreshed.data.session?.access_token ?? null;
  }

  return null;
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as ApiErrorResponse;

    if (typeof payload.detail === "string") {
      return { message: payload.detail, payload };
    }

    if (Array.isArray(payload.detail)) {
      const message = payload.detail
        .map((item) => item.msg)
        .filter(Boolean)
        .join(", ");

      return { message: message || "Request failed.", payload };
    }

    return { message: "Request failed.", payload };
  }

  const text = await response.text();
  return { message: text || "Request failed.", payload: text };
}

async function handleUnauthorized(skipUnauthorizedRedirect = false): Promise<never> {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  persistSessionCookies(null);

  if (!skipUnauthorizedRedirect) {
    redirectToLogin();
  }

  throw new ApiError("Your session has expired. Please sign in again.", 401);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}, attempt = 0): Promise<T> {
  const { searchParams, skipUnauthorizedRedirect = false, headers, body, ...rest } = options;
  const token = await getAccessToken(attempt > 0);
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (body && !(body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, searchParams), {
    ...rest,
    headers: requestHeaders,
    body,
  });

  if (response.status === 401) {
    if (attempt === 0) {
      return apiFetch<T>(path, options, 1);
    }

    return handleUnauthorized(skipUnauthorizedRedirect);
  }

  if (!response.ok) {
    const { message, payload } = await parseError(response);
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export async function apiFetchBlob(path: string, options: ApiFetchOptions = {}, attempt = 0): Promise<Blob> {
  const { searchParams, skipUnauthorizedRedirect = false, headers, body, ...rest } = options;
  const token = await getAccessToken(attempt > 0);
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, searchParams), {
    ...rest,
    headers: requestHeaders,
    body,
  });

  if (response.status === 401) {
    if (attempt === 0) {
      return apiFetchBlob(path, options, 1);
    }

    return handleUnauthorized(skipUnauthorizedRedirect);
  }

  if (!response.ok) {
    const { message, payload } = await parseError(response);
    throw new ApiError(message, response.status, payload);
  }

  return response.blob();
}
