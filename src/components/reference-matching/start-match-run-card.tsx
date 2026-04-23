"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useStartReferenceMatchingRun } from "@/lib/hooks/use-reference-matching";
import { useReferenceSources } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { StartReferenceMatchingRunResponse } from "@/lib/types/api";
import { resolveReferenceMatchingTrackingPath } from "@/lib/utils/jobs";

type StartMatchRunCardProps = {
  onStarted?: (response: StartReferenceMatchingRunResponse) => void;
};

export function StartMatchRunCard({ onStarted }: StartMatchRunCardProps) {
  const { handleAcceptedStart, handleStartError } = useStartAndRedirect();
  const { messages } = useI18n();
  const startRunMutation = useStartReferenceMatchingRun();
  const referenceSourcesQuery = useReferenceSources();
  const [sourceId, setSourceId] = useState("");
  const [includeFuzzy, setIncludeFuzzy] = useState(true);
  const referenceSources = referenceSourcesQuery.data ?? [];
  const canStart = Boolean(sourceId) && !startRunMutation.isPending;

  async function handleStartRun() {
    if (!sourceId) {
      handleStartError(messages.referenceMatching.sourceRequired, new Error(messages.referenceMatching.sourceRequired));
      return;
    }

    try {
      const response = await startRunMutation.mutateAsync({
        matching_direction: "source_to_internal",
        source_id: sourceId,
        target_scope: "all_internal",
        include_fuzzy: includeFuzzy,
      });

      handleAcceptedStart({
        title: messages.referenceMatching.successTitle,
        description: response.message || messages.referenceMatching.successDescription,
        path: resolveReferenceMatchingTrackingPath(response, sourceId),
        redirect: false,
        actionLabel: messages.referenceMatching.openDetail,
      });

      onStarted?.(response);
    } catch (error) {
      handleStartError(messages.referenceMatching.runFailed, error);
    }
  }

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <div className="space-y-1 border-b border-border/70 pb-4">
        <h2 className="text-lg font-semibold tracking-tight">{messages.referenceMatching.startTitle}</h2>
        <p className="text-sm text-muted-foreground">{messages.referenceMatching.startDescription}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reference-run-source">
              {messages.referenceMatching.sourceLabel}
            </label>
            {referenceSourcesQuery.isLoading ? (
              <div className="flex h-11 w-full items-center rounded-md border border-input bg-background/80 px-4 text-sm text-muted-foreground">
                {messages.common.loading}
              </div>
            ) : referenceSourcesQuery.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {referenceSourcesQuery.error.message}
              </div>
            ) : referenceSources.length ? (
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                id="reference-run-source"
                onChange={(event) => setSourceId(event.target.value)}
                value={sourceId}
              >
                <option value="">{messages.referenceMatching.sourcePlaceholder}</option>
                {referenceSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.display_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-4 py-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{messages.referenceMatching.noSourcesTitle}</p>
                <p className="mt-1">{messages.referenceMatching.noSourcesDescription}</p>
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-3 text-sm text-foreground">
            <input
              checked={includeFuzzy}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              onChange={(event) => setIncludeFuzzy(event.target.checked)}
              type="checkbox"
            />
            <span>{messages.referenceMatching.includeFuzzy}</span>
          </label>
        </div>

        <div className="flex justify-end">
          <Button disabled={!canStart} onClick={() => void handleStartRun()} type="button">
            {startRunMutation.isPending ? messages.referenceMatching.submitting : messages.referenceMatching.submit}
          </Button>
        </div>
      </div>
    </section>
  );
}
