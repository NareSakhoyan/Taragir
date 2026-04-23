"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceMatchSummary } from "@/lib/types/api";
import { cn } from "@/lib/utils/classnames";
import { humanizeSnakeCase, isOcrReferenceImportMethod } from "@/lib/utils/format";

type ReferenceMatchBadgeProps = {
  hasMatch: boolean;
  matchCount: number;
  bestMatch: ReferenceMatchSummary | null;
  showUnmatched?: boolean;
  compact?: boolean;
  className?: string;
};

function getTypeLabel(
  value: string,
  messages: ReturnType<typeof useI18n>["messages"],
) {
  switch (value) {
    case "exact":
      return messages.reference.types.exact;
    case "normalized":
      return messages.reference.types.normalized;
    case "fuzzy":
      return messages.reference.types.fuzzy;
    default:
      return humanizeSnakeCase(value);
  }
}

function getTypeClassName(value: string) {
  switch (value) {
    case "exact":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "normalized":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "fuzzy":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-border bg-background text-foreground";
  }
}

export function ReferenceMatchBadge({
  hasMatch,
  matchCount,
  bestMatch,
  showUnmatched = true,
  compact = false,
  className,
}: ReferenceMatchBadgeProps) {
  const { locale, messages } = useI18n();
  const pluralSuffix = locale === "hy" ? "" : matchCount === 1 ? "" : "es";

  if (!hasMatch && !showUnmatched) {
    return null;
  }

  if (!hasMatch) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Badge className="border-border/80 bg-muted/20 text-muted-foreground" variant="outline">
          {messages.reference.badges.unmatched}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
          {messages.reference.badges.matched}
        </Badge>
        {bestMatch ? (
          <Badge className={getTypeClassName(bestMatch.match_type)} variant="outline">
            {getTypeLabel(bestMatch.match_type, messages)}
          </Badge>
        ) : null}
        {bestMatch && isOcrReferenceImportMethod(bestMatch.source_import_method) ? (
          <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
            {messages.reference.badges.ocrSource}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          {messages.reference.messages.matchCount
            .replace("{count}", matchCount.toLocaleString(locale))
            .replace("{suffix}", pluralSuffix)}
        </p>
        {bestMatch ? (
          <p className="[overflow-wrap:anywhere]">
            <span className="font-medium text-foreground">{bestMatch.source_display_name}</span>
            {": "}
            {bestMatch.matched_form}
          </p>
        ) : null}
      </div>
    </div>
  );
}
