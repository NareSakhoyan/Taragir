"use client";

import { CheckCircle2, ChevronDown, CircleDot, Clock3 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { StageEvent } from "@/lib/types/api";
import { cn } from "@/lib/utils/classnames";
import { formatDate, formatNumber, humanizeSnakeCase } from "@/lib/utils/format";

type JobStageTimelineProps = {
  title: string;
  description: string;
  events: StageEvent[];
  emptyMessage?: string;
  className?: string;
  defaultCollapsed?: boolean;
};

function resolveEventLabel(event: StageEvent) {
  return event.stage_label?.trim() || humanizeSnakeCase(event.stage_code ?? "") || "Update";
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
  title,
  description,
  events,
  emptyMessage,
  className,
  defaultCollapsed = true,
}: JobStageTimelineProps) {
  const { locale, messages } = useI18n();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const orderedEvents = [...events].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;

    return leftTime - rightTime;
  });

  if (!orderedEvents.length) {
    return emptyMessage ? (
      <section className={cn("rounded-md border border-border/80 bg-card/80 p-5 shadow-sm", className)}>
        <div className="space-y-1 border-b border-border/70 pb-4">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="pt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      </section>
    ) : null;
  }

  return (
    <section className={cn("rounded-md border border-border/80 bg-card/80 p-5 shadow-sm", className)}>
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Button
          onClick={() => setCollapsed((current) => !current)}
          size="sm"
          type="button"
          variant="ghost"
        >
          {collapsed ? messages.common.showTimeline : messages.common.hideTimeline}
          <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed ? "" : "rotate-180")} />
        </Button>
      </div>

      {!collapsed ? (
      <div className="mt-5 space-y-4">
        {orderedEvents.map((event, index) => {
          const counterText = renderCounterText(event, locale);

          return (
            <div className="relative pl-8" key={event.id ?? `${event.stage_code ?? "event"}-${index}`}>
              {index < orderedEvents.length - 1 ? (
                <span className="absolute left-[11px] top-6 h-[calc(100%+0.75rem)] w-px bg-border/80" />
              ) : null}

              <span className="absolute left-0 top-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground">
                {index === orderedEvents.length - 1 ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <CircleDot className="h-3.5 w-3.5" />
                )}
              </span>

              <div className="space-y-1.5 pb-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{resolveEventLabel(event)}</p>
                    {event.stage_message_user ? (
                      <p className="text-sm text-muted-foreground">{event.stage_message_user}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {event.progress_percent != null ? (
                      <Badge className="border-border/80 bg-muted/40 text-foreground" variant="outline">
                        {formatNumber(event.progress_percent, locale)}%
                      </Badge>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {resolveEventTime(event, locale)}
                    </span>
                  </div>
                </div>

                {counterText ? <p className="text-sm text-muted-foreground">{counterText}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
      ) : null}
    </section>
  );
}
