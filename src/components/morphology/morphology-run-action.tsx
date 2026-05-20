"use client";

import { LoaderCircle, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useStartMorphologyRun } from "@/lib/hooks/use-morphology";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { MorphologySourceType, MorphologySummary } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";

type MorphologyRunActionProps = {
  sourceType: MorphologySourceType;
  sourceId: string;
  summary?: MorphologySummary | null;
  enabled?: boolean;
};

export function MorphologyRunAction({
  sourceType,
  sourceId,
  summary,
  enabled,
}: MorphologyRunActionProps) {
  const { handleAcceptedStart, handleStartError } = useStartAndRedirect();
  const { messages } = useI18n();
  const mutation = useStartMorphologyRun();
  const canRun =
    enabled ??
    Boolean(summary?.is_eligible || summary?.is_supported || summary?.status || summary?.is_available);

  if (!canRun) {
    return null;
  }

  async function handleRun() {
    try {
      const result = await mutation.mutateAsync({ sourceType, sourceId });
      handleAcceptedStart({
        title: messages.morphology.startedTitle,
        description: result.message || messages.morphology.startedDescription,
        path: `${ROUTES.jobs}/${result.job.id}`,
      });
    } catch (error) {
      handleStartError(messages.morphology.startFailedTitle, error);
    }
  }

  return (
    <Button disabled={mutation.isPending} onClick={handleRun} type="button" variant="outline">
      {mutation.isPending ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      {summary?.status === "completed" ? messages.morphology.actions.runAgain : messages.morphology.actions.run}
    </Button>
  );
}
