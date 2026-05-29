"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { persistSessionCookies } from "@/lib/supabase/session";
import type { JobRead } from "@/lib/types/api";
import { isAbortError } from "@/lib/utils/abort";

export async function getActiveJobsCount() {
  const token = await getAccessToken();
  if (!token) {
    return { count: 0 };
  }

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });
  applyTunnelHeaders(headers);

  const response = await fetch(`${getApiBaseUrl()}/api/v1/me/active-jobs/count`, {
    headers,
  });

  if (!response.ok) {
    return { count: 0 };
  }

  return (await response.json()) as { count: number };
}

export type ActiveJobsStreamHandlers = {
  onSnapshot?: (jobs: JobRead[]) => void;
  onJobs?: (jobs: JobRead[]) => void;
  onJob?: (job: JobRead) => void;
  onError?: (message: string) => void;
};

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is missing.");
  }
  return baseUrl.replace(/\/+$/, "");
}

function isNgrokUrl(baseUrl: string) {
  try {
    return new URL(baseUrl).hostname.includes("ngrok");
  } catch {
    return false;
  }
}

function applyTunnelHeaders(headers: Headers) {
  if (isNgrokUrl(getApiBaseUrl())) {
    headers.set("ngrok-skip-browser-warning", "true");
  }
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const sessionResult = await supabase.auth.getSession();
  persistSessionCookies(sessionResult.data.session);
  if (sessionResult.data.session?.access_token) {
    return sessionResult.data.session.access_token;
  }

  const refreshed = await supabase.auth.refreshSession();
  persistSessionCookies(refreshed.data.session);
  return refreshed.data.session?.access_token ?? null;
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return { event, data: dataLines.join("\n") };
}

export async function streamActiveJobs(
  handlers: ActiveJobsStreamHandlers,
  signal?: AbortSignal,
) {
  const token = await getAccessToken();
  if (!token) {
    handlers.onError?.("Authentication required.");
    return;
  }

  try {
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    });
    applyTunnelHeaders(headers);

    const response = await fetch(`${getApiBaseUrl()}/api/v1/me/active-jobs/stream`, {
      headers,
      signal,
    });

    if (!response.ok) {
      handlers.onError?.(`Stream failed (${response.status}).`);
      return;
    }

    if (!response.body) {
      handlers.onError?.("Stream body unavailable.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const parsed = parseSseBlock(block.trim());
        if (!parsed) {
          continue;
        }

        if (parsed.event === "ping") {
          continue;
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(parsed.data) as Record<string, unknown>;
        } catch {
          continue;
        }

        if (parsed.event === "snapshot" || parsed.event === "jobs") {
          const jobs = (payload.jobs as JobRead[]) ?? [];
          if (parsed.event === "snapshot") {
            handlers.onSnapshot?.(jobs);
          } else {
            handlers.onJobs?.(jobs);
          }
          continue;
        }
        if (parsed.event === "job") {
          handlers.onJob?.(payload.job as JobRead);
          continue;
        }
        if (parsed.event === "error") {
          handlers.onError?.((payload.detail as string) ?? "Stream error.");
          continue;
        }
      }
    }
  } catch (error) {
    if (isAbortError(error)) {
      return;
    }
    throw error;
  }
}
