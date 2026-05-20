"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/notifications";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useUpdateMorphologySettings } from "@/lib/hooks/use-morphology";
import { useI18n } from "@/lib/i18n/use-i18n";
import type {
  MorphologySettings,
  MorphologySourceType,
  MorphologySummary,
} from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatMorphologyStatus } from "@/lib/utils/morphology";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const EMPTY_OPTION = "__none__";
const DEFAULT_LANGUAGE_STAGE = "classical";
const DEFAULT_MORPHOLOGY_PROFILE = "xcl_pie";

function isSettingsUnavailableError(error: unknown) {
  if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("migration") ||
    message.includes("does not exist") ||
    message.includes("undefined column") ||
    message.includes("undefined table")
  );
}

type MorphologySettingsCardProps = {
  sourceType: MorphologySourceType;
  sourceId: string;
  settings?: MorphologySettings | null;
  summary?: MorphologySummary | null;
};

export function MorphologySettingsCard({
  sourceType,
  sourceId,
  settings,
  summary,
}: MorphologySettingsCardProps) {
  const { handleAcceptedStart, handleStartError } = useStartAndRedirect();
  const { messages } = useI18n();
  const mutation = useUpdateMorphologySettings();
  const [languageStage, setLanguageStage] = useState(settings?.language_stage ?? DEFAULT_LANGUAGE_STAGE);
  const [runNow, setRunNow] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const result = await mutation.mutateAsync({
        sourceType,
        sourceId,
        settings: {
          language_stage: languageStage === EMPTY_OPTION ? DEFAULT_LANGUAGE_STAGE : languageStage,
          morphology_profile: DEFAULT_MORPHOLOGY_PROFILE,
          run_morphology: runNow,
          analyzer: "pie",
        },
      });

      setRunNow(false);

      if (result.job) {
        handleAcceptedStart({
          title: messages.morphology.settings.savedTitle,
          description: result.message || messages.morphology.settings.savedAndStartedDescription,
          path: `${ROUTES.jobs}/${result.job.id}`,
        });
        return;
      }

      toast.success(messages.morphology.settings.savedTitle, {
        description: result.message || messages.morphology.settings.savedDescription,
      });
    } catch (error) {
      if (isSettingsUnavailableError(error)) {
        toast.error(messages.morphology.settings.unavailableTitle, {
          description: messages.morphology.settings.unavailableDescription,
        });
        return;
      }

      handleStartError(messages.morphology.settings.saveFailedTitle, error);
    }
  }

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <div className="space-y-1 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{messages.morphology.settings.title}</h3>
          {summary?.status ? (
            <Badge variant="outline">{formatMorphologyStatus(summary.status, messages)}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{messages.morphology.settings.description}</p>
      </div>

      <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${sourceType}-${sourceId}-language-stage`}>
              {messages.morphology.settings.languageStage}
            </Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background/80 px-4 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              id={`${sourceType}-${sourceId}-language-stage`}
              onChange={(event) => setLanguageStage(event.target.value)}
              value={languageStage}
            >
              <option value={EMPTY_OPTION}>{messages.morphology.settings.languageStageOptions.unknown}</option>
              <option value="classical">{messages.morphology.settings.languageStageOptions.classical}</option>
              <option value="modern">{messages.morphology.settings.languageStageOptions.modern}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${sourceType}-${sourceId}-morphology-profile`}>
              {messages.morphology.settings.morphologyProfile}
            </Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-muted/40 px-4 py-2 text-sm text-muted-foreground outline-none transition-colors"
              disabled
              id={`${sourceType}-${sourceId}-morphology-profile`}
              value={DEFAULT_MORPHOLOGY_PROFILE}
            >
              <option value="xcl_pie">{messages.morphology.settings.profileOptions.xclPie}</option>
            </select>
            {/* TODO: Re-enable profile selection when more morphology tools are available. */}
          </div>
        </div>

        <div className="rounded-md border border-border/70 bg-muted/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={runNow}
              id={`${sourceType}-${sourceId}-run-morphology`}
              onCheckedChange={(checked) => setRunNow(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor={`${sourceType}-${sourceId}-run-morphology`}>
                {messages.morphology.settings.runNow}
              </Label>
              <p className="text-sm text-muted-foreground">{messages.morphology.settings.runNowHelp}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{messages.morphology.settings.eligibilityHint}</p>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {messages.morphology.settings.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
