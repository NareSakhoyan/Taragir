"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReferenceMatch } from "@/lib/types/api";
import {
  formatPercent,
  formatReferenceImportMethod,
  humanizeSnakeCase,
  isOcrReferenceImportMethod,
} from "@/lib/utils/format";

type ReferenceMatchesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  targetLabel: string;
  targetValue: string;
  targetSecondaryValue?: string | null;
  hasMatch: boolean;
  matches: ReferenceMatch[];
  isLoading?: boolean;
  errorMessage?: string | null;
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

function getRowClassName(match: ReferenceMatch) {
  if (isOcrReferenceImportMethod(match.source_import_method) && match.match_type === "fuzzy") {
    return "bg-amber-50/70";
  }

  if (isOcrReferenceImportMethod(match.source_import_method)) {
    return "bg-amber-50/40";
  }

  return "";
}

export function ReferenceMatchesSheet({
  open,
  onOpenChange,
  title,
  description,
  targetLabel,
  targetValue,
  targetSecondaryValue,
  hasMatch,
  matches,
  isLoading = false,
  errorMessage,
}: ReferenceMatchesSheetProps) {
  const { locale, messages } = useI18n();

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description ?? messages.reference.messages.assistiveOnly}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-md border border-border/80 bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">{targetLabel}</p>
            <p className="mt-2 font-semibold [overflow-wrap:anywhere]">{targetValue}</p>
            {targetSecondaryValue ? (
              <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{targetSecondaryValue}</p>
            ) : null}
            <div className="mt-3">
              <Badge
                className={
                  hasMatch
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-border/80 bg-background text-muted-foreground"
                }
                variant="outline"
              >
                {hasMatch ? messages.reference.badges.matched : messages.reference.badges.unmatched}
              </Badge>
            </div>
          </div>

          <div className="rounded-md border border-border/80 bg-card/80 p-4 shadow-sm">
            <div className="space-y-1 border-b border-border/70 pb-4">
              <h3 className="font-semibold tracking-tight">{messages.reference.actions.viewMatches}</h3>
              <p className="text-sm text-muted-foreground">{messages.reference.messages.assistiveOnly}</p>
            </div>

            {isLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : errorMessage ? (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : matches.length ? (
              <div className="mt-4 space-y-4">
                <div className="hidden overflow-hidden rounded-md border border-border/80 lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{messages.reference.labels.source}</TableHead>
                        <TableHead>{messages.reference.labels.matchedForm}</TableHead>
                        <TableHead>{messages.reference.labels.normalizedForm}</TableHead>
                        <TableHead>{messages.reference.labels.importMethod}</TableHead>
                        <TableHead>{messages.reference.labels.matchType}</TableHead>
                        <TableHead>{messages.reference.labels.matchScore}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match, index) => (
                        <TableRow className={getRowClassName(match)} key={`${match.source_display_name}-${match.matched_form}-${index}`}>
                          <TableCell className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium [overflow-wrap:anywhere]">{match.source_display_name}</span>
                              {isOcrReferenceImportMethod(match.source_import_method) ? (
                                <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                                  {messages.reference.badges.ocrSource}
                                </Badge>
                              ) : null}
                            </div>
                            {match.source_warning ? (
                              <p className="text-xs text-muted-foreground">{match.source_warning}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="[overflow-wrap:anywhere]">{match.matched_form}</TableCell>
                          <TableCell className="[overflow-wrap:anywhere]">{match.normalized_form || "—"}</TableCell>
                          <TableCell>{formatReferenceImportMethod(match.source_import_method)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                className={
                                  isOcrReferenceImportMethod(match.source_import_method) && match.match_type === "fuzzy"
                                    ? "border-amber-300 bg-amber-100 text-amber-950"
                                    : getTypeClassName(match.match_type)
                                }
                                variant="outline"
                              >
                                {getTypeLabel(match.match_type, messages)}
                              </Badge>
                              {isOcrReferenceImportMethod(match.source_import_method) && match.match_type === "fuzzy" ? (
                                <Badge className="border-amber-300 bg-amber-50 text-amber-900" variant="outline">
                                  {messages.reference.badges.caution}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {match.match_type === "fuzzy" ? formatPercent(match.match_score, locale) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 lg:hidden">
                  {matches.map((match, index) => (
                    <div
                      className={
                        isOcrReferenceImportMethod(match.source_import_method) && match.match_type === "fuzzy"
                          ? "rounded-md border border-amber-200 bg-amber-50 p-4"
                          : isOcrReferenceImportMethod(match.source_import_method)
                            ? "rounded-md border border-amber-200/80 bg-amber-50/60 p-4"
                            : "rounded-md border border-border/80 bg-muted/10 p-4"
                      }
                      key={`${match.source_display_name}-${match.matched_form}-${index}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold [overflow-wrap:anywhere]">{match.source_display_name}</p>
                            {isOcrReferenceImportMethod(match.source_import_method) ? (
                              <Badge className="border-amber-300 bg-amber-100 text-amber-900" variant="outline">
                                {messages.reference.badges.ocrSource}
                              </Badge>
                            ) : null}
                          </div>
                          {match.source_warning ? (
                            <p className="text-xs text-muted-foreground">{match.source_warning}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            className={
                              isOcrReferenceImportMethod(match.source_import_method) && match.match_type === "fuzzy"
                                ? "border-amber-300 bg-amber-100 text-amber-950"
                                : getTypeClassName(match.match_type)
                            }
                            variant="outline"
                          >
                            {getTypeLabel(match.match_type, messages)}
                          </Badge>
                          {isOcrReferenceImportMethod(match.source_import_method) && match.match_type === "fuzzy" ? (
                            <Badge className="border-amber-300 bg-amber-50 text-amber-900" variant="outline">
                              {messages.reference.badges.caution}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <p className="[overflow-wrap:anywhere]">
                          <span className="text-muted-foreground">{messages.reference.labels.matchedForm}: </span>
                          {match.matched_form}
                        </p>
                        <p className="[overflow-wrap:anywhere]">
                          <span className="text-muted-foreground">{messages.reference.labels.normalizedForm}: </span>
                          {match.normalized_form || "—"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">{messages.reference.labels.importMethod}: </span>
                          {formatReferenceImportMethod(match.source_import_method)}
                        </p>
                        {match.match_type === "fuzzy" ? (
                          <p>
                            <span className="text-muted-foreground">{messages.reference.labels.matchScore}: </span>
                            {formatPercent(match.match_score, locale)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {matches.some((match) => isOcrReferenceImportMethod(match.source_import_method)) ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                    {messages.reference.messages.ocrAssistive}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-border/80 bg-muted/10 px-5 py-10 text-center">
                <p className="font-medium">{messages.reference.messages.noMatchesTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{messages.reference.messages.noMatchesDescription}</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
