"use client";

import { AlertTriangle, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cn } from "@/lib/utils/classnames";
import { formatDate, formatNumber } from "@/lib/utils/format";

type JobErrorCardProps = {
  errorMessageUser?: string | null;
  nextSteps?: string[] | null;
  canRetry?: boolean;
  canResume?: boolean;
  onRetry?: () => void;
  onResume?: () => void;
  isRetrying?: boolean;
  isResuming?: boolean;
  resumeFromPage?: number | null;
  retryCount?: number | null;
  lastRetriedAt?: string | null;
  className?: string;
};

export function JobErrorCard({
  errorMessageUser,
  nextSteps,
  canRetry = false,
  canResume = false,
  onRetry,
  onResume,
  isRetrying = false,
  isResuming = false,
  resumeFromPage,
  retryCount,
  lastRetriedAt,
  className,
}: JobErrorCardProps) {
  const { locale, messages } = useI18n();
  const resumeLabel =
    resumeFromPage != null
      ? messages.job.resumeFromPage.replace("{page}", formatNumber(resumeFromPage, locale))
      : messages.job.resumeProcessing;

  const resolvedSteps =
    nextSteps?.length
      ? nextSteps
      : canRetry
        ? [messages.job.fallbackRetryStep, messages.job.fallbackRetryAgain]
        : [messages.job.fallbackReuploadStep, messages.job.fallbackContactStep];

  return (
    <section
      className={cn(
        "rounded-md border border-destructive/30 bg-destructive/5 p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">{messages.job.failedTitle}</h3>
            <p className="text-sm leading-6 text-foreground/90">
              {errorMessageUser?.trim() || messages.job.failedFallbackMessage}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{messages.job.whatNext}</p>
            <ul className="space-y-1.5 pl-5 text-sm text-muted-foreground">
              {resolvedSteps.map((step) => (
                <li key={step} className="list-disc leading-6">
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {retryCount != null || lastRetriedAt ? (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {retryCount != null ? (
                <span>
                  {messages.job.retryCount}: {formatNumber(retryCount, locale)}
                </span>
              ) : null}
              {lastRetriedAt ? (
                <span>
                  {messages.job.lastRetried}: {formatDate(lastRetriedAt, locale)}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {canRetry && onRetry ? (
              <Button disabled={isRetrying} onClick={onRetry} type="button">
                <RotateCcw className="h-4 w-4" />
                {isRetrying ? messages.job.retrying : messages.job.retryProcessing}
              </Button>
            ) : null}
            {canResume && onResume ? (
              <Button disabled={isResuming} onClick={onResume} type="button" variant="outline">
                <Play className="h-4 w-4" />
                {isResuming ? messages.job.resuming : resumeLabel}
              </Button>
            ) : null}
            {!canRetry && !canResume ? (
              <p className="text-sm text-muted-foreground">{messages.job.reuploadOrContact}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
