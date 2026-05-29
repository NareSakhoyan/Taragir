"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { persistSessionCookies } from "@/lib/supabase/session";
import type { JobRead, StageEvent } from "@/lib/types/api";
import { isAbortError } from "@/lib/utils/abort";

export type JobStreamHandlers = {
  onSnapshot?: (payload: { job: JobRead; events: StageEvent[] }) => void;
  onJob?: (job: JobRead) => void;
  onEvent?: (event: StageEvent) => void;
  onDone?: (status: string) => void;
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

export async function streamJobProgress(
  jobId: string,
  handlers: JobStreamHandlers,
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

    const response = await fetch(`${getApiBaseUrl()}/api/v1/jobs/${jobId}/stream`, {
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

        if (parsed.event === "snapshot") {
          handlers.onSnapshot?.({
            job: payload.job as JobRead,
            events: (payload.events as StageEvent[]) ?? [],
          });
          continue;
        }
        if (parsed.event === "job") {
          handlers.onJob?.(payload.job as JobRead);
          continue;
        }
        if (parsed.event === "event") {
          handlers.onEvent?.(payload.event as StageEvent);
          continue;
        }
        if (parsed.event === "done") {
          handlers.onDone?.((payload.status as string) ?? "completed");
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
