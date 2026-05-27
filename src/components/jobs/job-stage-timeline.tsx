"use client";

import {
  Brain,
  CheckCircle2,
  CircleDot,
  FileSearch,
  LoaderCircle,
  SearchCheck,
  ScanText,
  Save,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

import { useI18n } from "@/lib/i18n/use-i18n";
import type { StageEvent } from "@/lib/types/api";
import { cn } from "@/lib/utils/classnames";
import { formatDate, formatNumber, humanizeSnakeCase } from "@/lib/utils/format";

type JobStageTimelineProps = {
  events: StageEvent[];
  className?: string;
};

function resolveEventLabel(event: StageEvent) {
  return event.stage_label?.trim() || humanizeSnakeCase(event.stage_code ?? "") || "Update";
}

function resolveEventIcon(event: StageEvent): LucideIcon {
  const stage = `${event.stage_code ?? ""} ${event.stage_label ?? ""}`.toLowerCase();

  if (stage.includes("upload") || stage.includes("queue")) {
    return UploadCloud;
  }

  if (stage.includes("extract") || stage.includes("ocr") || stage.includes("scan") || stage.includes("ingest")) {
    return ScanText;
  }

  if (stage.includes("morphology") || stage.includes("pie") || stage.includes("analy")) {
    return Brain;
  }

  if (stage.includes("lookup") || stage.includes("nayiri") || stage.includes("discover") || stage.includes("match")) {
    return SearchCheck;
  }

  if (stage.includes("save") || stage.includes("final")) {
    return Save;
  }

  if (stage.includes("complete") || stage.includes("ready")) {
    return CheckCircle2;
  }

  if (stage.includes("load") || stage.includes("document") || stage.includes("page")) {
    return FileSearch;
  }

  return CircleDot;
}

function resolveEventTime(event: StageEvent, locale: ReturnType<typeof useI18n>["locale"]) {
  return formatDate(event.created_at, locale);
}

function renderCounterText(
  event: StageEvent,
  locale: ReturnType<typeof useI18n>["locale"],
) {
  if (event.items_processed == null || event.items_total == null) {
    return null;
  }

  if (event.items_total <= 0) {
    return null;
  }

  // Some event payloads report percentage progress but never advance the item counter.
  // Hide the contradictory "0 / total" text rather than implying no work happened.
  if (event.items_processed === 0 && (event.progress_percent ?? 0) > 0) {
    return null;
  }

  return `${formatNumber(event.items_processed, locale)} / ${formatNumber(event.items_total, locale)}`;
}

export function JobStageTimeline({
  events,
  className,
}: JobStageTimelineProps) {
  const { locale, messages } = useI18n();
  const orderedEvents = [...events].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;

    return leftTime - rightTime;
  });

  if (!orderedEvents.length) {
    return null;
  }

  const visibleEvents = orderedEvents.slice(-4);
  const currentEvent = visibleEvents[visibleEvents.length - 1];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-primary/20 bg-primary/5 p-4 text-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="relative mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="absolute inset-0 rounded-full bg-primary/15 animate-ping" />
            <LoaderCircle className="relative h-5 w-5 animate-spin" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{messages.job.currentStage}</p>
            {currentEvent ? (
              <p className="mt-1 truncate text-muted-foreground">{resolveEventLabel(currentEvent)}</p>
            ) : null}
          </div>
        </div>
        <span className="w-fit rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
          {formatNumber(orderedEvents.length, locale)} {messages.common.updates}
        </span>
      </div>

      <ol className="mt-4 grid gap-2">
        {visibleEvents.map((event, index) => {
          const counterText = renderCounterText(event, locale);
          const progressPercent = Math.max(0, Math.min(event.progress_percent ?? 0, 100));
          const isCurrent = index === visibleEvents.length - 1;
          const EventIcon = resolveEventIcon(event);

          return (
            <li
              className={cn(
                "flex items-center gap-3 rounded-md border border-border/70 bg-background/75 px-3 py-2 transition-colors",
                isCurrent && "border-primary/30 bg-background shadow-sm",
              )}
              key={event.id ?? `${event.stage_code ?? "event"}-${index}`}
            >
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  isCurrent ? "border-primary/30 bg-primary/10 text-primary" : "border-border/80 text-muted-foreground",
                )}
              >
                <EventIcon className={cn("h-4 w-4", isCurrent && "animate-pulse")} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate font-medium">{resolveEventLabel(event)}</p>
                  {counterText ? <span className="text-xs tabular-nums text-muted-foreground">{counterText}</span> : null}
                </div>
                <p className="text-xs text-muted-foreground">{resolveEventTime(event, locale)}</p>
              </div>
              {event.progress_percent != null ? (
                <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {formatNumber(progressPercent, locale)}%
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
