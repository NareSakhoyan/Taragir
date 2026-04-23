import type { Session } from "@supabase/supabase-js";

import { getLocaleFromPathname, localizePath } from "@/lib/i18n/config";
import {
  ACTIVE_JOB_STORAGE_KEY,
  ACCESS_TOKEN_COOKIE,
  DOCUMENT_JOB_STORAGE_KEY,
  JOB_TRACKER_EVENT,
  REFERENCE_SOURCE_JOB_STORAGE_KEY,
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
  return getStoredJobMap(DOCUMENT_JOB_STORAGE_KEY);
}

function getStoredReferenceSourceJobMap() {
  return getStoredJobMap(REFERENCE_SOURCE_JOB_STORAGE_KEY);
}

function emitJobTrackerChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(JOB_TRACKER_EVENT));
}

function getStoredJobMap(storageKey: string) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function rememberDocumentJobLink(documentId: string, jobId: string) {
  rememberJobLink(DOCUMENT_JOB_STORAGE_KEY, documentId, jobId);
}

export function rememberReferenceSourceJobLink(sourceId: string, jobId: string) {
  rememberJobLink(REFERENCE_SOURCE_JOB_STORAGE_KEY, sourceId, jobId);
}

function rememberJobLink(storageKey: string, resourceId: string, jobId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = getStoredJobMap(storageKey);
  existing[resourceId] = jobId;
  window.localStorage.setItem(storageKey, JSON.stringify(existing));
  emitJobTrackerChanged();
}

export function getRememberedDocumentJobLink(documentId: string) {
  const existing = getStoredDocumentJobMap();
  return existing[documentId] ?? null;
}

export function getRememberedReferenceSourceJobLink(sourceId: string) {
  const existing = getStoredReferenceSourceJobMap();
  return existing[sourceId] ?? null;
}

export function clearRememberedDocumentJobs() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DOCUMENT_JOB_STORAGE_KEY);
  emitJobTrackerChanged();
}

export function clearRememberedReferenceSourceJobs() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(REFERENCE_SOURCE_JOB_STORAGE_KEY);
  emitJobTrackerChanged();
}

export function getRememberedActiveJobIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_JOB_STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.from(new Set(ids.filter(Boolean)));
  } catch {
    return [];
  }
}

export function rememberActiveJob(jobId: string) {
  if (typeof window === "undefined" || !jobId) {
    return;
  }

  const ids = new Set(getRememberedActiveJobIds());
  ids.add(jobId);
  window.localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  emitJobTrackerChanged();
}

export function forgetActiveJob(jobId: string) {
  if (typeof window === "undefined" || !jobId) {
    return;
  }

  const ids = getRememberedActiveJobIds().filter((id) => id !== jobId);
  window.localStorage.setItem(ACTIVE_JOB_STORAGE_KEY, JSON.stringify(ids));
  emitJobTrackerChanged();
}

export function clearRememberedActiveJobs() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_JOB_STORAGE_KEY);
  emitJobTrackerChanged();
}
