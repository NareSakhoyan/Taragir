"use client";

import { RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Locale } from "@/lib/i18n/config";
import { formatNumber } from "@/lib/utils/format";

type DiscoveryLoadingStateProps = {
  boundedProgress: number | null;
  description: string;
  locale: Locale;
  progressLabel: string;
  stageLabel: string | null;
  title: string;
};

export function DiscoveryLoadingState({
  boundedProgress,
  description,
  locale,
  progressLabel,
  stageLabel,
  title,
}: DiscoveryLoadingStateProps) {
  return (
    <Card className="border-dashed bg-muted/10 shadow-sm">
      <CardContent className="px-6 py-10 text-center">
        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">{stageLabel}</p>
        <p className="mt-2 text-xl font-semibold tracking-tight">{title}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
        {boundedProgress !== null ? (
          <div className="mx-auto mt-6 max-w-md space-y-2">
            <Progress value={boundedProgress} />
            <p className="text-xs text-muted-foreground">
              {progressLabel.replace("{percent}", formatNumber(boundedProgress, locale))}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
