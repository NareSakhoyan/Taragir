import type { Session } from "@supabase/supabase-js";

import { getLocaleFromPathname, localizePath } from "@/lib/i18n/config";
import {
  ACCESS_TOKEN_COOKIE,
  DOCUMENT_JOB_STORAGE_KEY,
  REDIRECT_QUERY_PARAM,
  REFRESH_TOKEN_COOKIE,
  ROUTES,
} from "@/lib/utils/constants";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function persistSessionCookies(session: Session | null) {
  if (!session) {
    clearCookie(ACCESS_TOKEN_COOKIE);
    clearCookie(REFRESH_TOKEN_COOKIE);
    return;
  }

  setCookie(ACCESS_TOKEN_COOKIE, session.access_token, session.expires_in ?? 3600);
  setCookie(REFRESH_TOKEN_COOKIE, session.refresh_token, 60 * 60 * 24 * 30);
}

export function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  const locale = getLocaleFromPathname(window.location.pathname) ?? "en";
  const loginUrl = new URL(localizePath(locale, ROUTES.login), window.location.origin);
  loginUrl.searchParams.set(REDIRECT_QUERY_PARAM, nextPath);
  window.location.assign(loginUrl.toString());
}

function getStoredDocumentJobMap() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DOCUMENT_JOB_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function rememberDocumentJobLink(documentId: string, jobId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = getStoredDocumentJobMap();
  existing[documentId] = jobId;
  window.localStorage.setItem(DOCUMENT_JOB_STORAGE_KEY, JSON.stringify(existing));
}

export function getRememberedDocumentJobLink(documentId: string) {
  const existing = getStoredDocumentJobMap();
  return existing[documentId] ?? null;
}

export function clearRememberedDocumentJobs() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DOCUMENT_JOB_STORAGE_KEY);
}
