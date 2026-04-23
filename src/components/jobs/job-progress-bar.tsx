"use client";

import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cn } from "@/lib/utils/classnames";

type JobProgressBarProps = {
  label: string;
  percent?: number | null;
  counterText?: string | null;
  className?: string;
};

export function normalizeProgressPercent(value: number | null | undefined, fallback = 0) {
  if (value == null || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, value));
}

export function JobProgressBar({
  label,
  percent,
  counterText,
  className,
}: JobProgressBarProps) {
  const { locale } = useI18n();
  const progressValue = normalizeProgressPercent(percent);

  const percentLabel = new Intl.NumberFormat(locale === "hy" ? "hy-AM" : "en-US", {
    maximumFractionDigits: progressValue % 1 === 0 ? 0 : 1,
  }).format(progressValue);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{percentLabel}%</span>
      </div>
      <Progress value={progressValue} />
      {counterText ? <p className="text-sm text-muted-foreground">{counterText}</p> : null}
    </div>
  );
}
