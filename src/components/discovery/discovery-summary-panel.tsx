"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n/config";
import type { DiscoverySummary, DocumentReferenceEvidenceState } from "@/lib/types/api";
import {
  candidateTypeLabel,
  resolutionStatusLabel,
  reviewStatusLabel,
} from "@/lib/utils/discovery";
import { formatNumber } from "@/lib/utils/format";

type DiscoverySummaryCopy = {
  description: string;
  includeSuppressed: string;
  includeSuppressedDescription: string;
  searchPlaceholder: string;
  summary: {
    latestBuild: string;
    notBuilt: string;
    reviewed: string;
    suppressed: string;
    suppressedDescription: string;
    total: string;
    visible: string;
  };
};

type DiscoverySummaryPanelProps = {
  candidateType: string;
  candidateTypeOptions: string[];
  copy: DiscoverySummaryCopy;
  draftSearch: string;
  includeSuppressed: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  locale: Locale;
  onCandidateTypeChange: (value: string) => void;
  onDraftSearchChange: (value: string) => void;
  onIncludeSuppressedChange: (value: boolean) => void;
  onReferenceUpdate: (referenceSourceId: string) => void;
  onResolutionStatusChange: (value: string) => void;
  onReviewStatusChange: (value: string) => void;
  onSearchSubmit: () => void;
  referenceUpdatePending: boolean;
  resolutionOptions: string[];
  resolutionStatus: string;
  reviewOptions: string[];
  reviewStatus: string;
  searchLabel: string;
  staleReferenceStates: DocumentReferenceEvidenceState[];
  summary: DiscoverySummary | undefined;
};

function SummaryStatCard({
  description,
  label,
  value,
}: {
  description?: string;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {description ? <p className="mt-2 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}

export function DiscoverySummaryPanel({
  candidateType,
  candidateTypeOptions,
  copy,
  draftSearch,
  includeSuppressed,
  isAdmin,
  isLoading,
  locale,
  onCandidateTypeChange,
  onDraftSearchChange,
  onIncludeSuppressedChange,
  onReferenceUpdate,
  onResolutionStatusChange,
  onReviewStatusChange,
  onSearchSubmit,
  referenceUpdatePending,
  resolutionOptions,
  resolutionStatus,
  reviewOptions,
  reviewStatus,
  searchLabel,
  staleReferenceStates,
  summary,
}: DiscoverySummaryPanelProps) {
  return (
    <Card className="border-border/80 bg-muted/10 shadow-sm">
      <CardHeader className="space-y-1 pb-0">
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {summary ? (
          <div className="grid gap-3 md:grid-cols-5">
            <SummaryStatCard
              label={copy.summary.visible}
              value={formatNumber(summary.visible_candidates, locale)}
            />
            <SummaryStatCard
              label={copy.summary.total}
              value={formatNumber(summary.total_candidates, locale)}
            />
            <SummaryStatCard
              label={copy.summary.reviewed}
              value={formatNumber(summary.reviewed_candidates, locale)}
            />
            <SummaryStatCard
              description={copy.summary.suppressedDescription}
              label={copy.summary.suppressed}
              value={formatNumber(summary.suppressed_candidates, locale)}
            />
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{copy.summary.latestBuild}</p>
                <p className="mt-1 text-sm font-medium">
                  {summary.latest_build?.status ?? copy.summary.notBuilt}
                </p>
                {summary.latest_build?.current_stage_label ? (
                  <p className="mt-1 text-xs text-muted-foreground">{summary.latest_build.current_stage_label}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : isLoading ? (
          <div className="grid gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-7 w-16" />
                  {index === 3 ? <Skeleton className="h-3 w-32" /> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {staleReferenceStates.length ? (
          <div className="space-y-3">
            {staleReferenceStates.map((state) => (
              <div
                className="flex flex-col gap-3 rounded-md border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-100 md:flex-row md:items-center md:justify-between"
                key={state.reference_source_import_id}
              >
                <div>
                  <p className="font-medium">New reference dataset available.</p>
                  <p className="mt-1">This document has not been checked against {state.source_display_name}.</p>
                  {state.error ? <p className="mt-1 text-xs">{state.error}</p> : null}
                </div>
                <Button
                  disabled={referenceUpdatePending}
                  onClick={() => onReferenceUpdate(state.reference_source_id)}
                  type="button"
                  variant="outline"
                >
                  <RefreshCw className={referenceUpdatePending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                  Update evidence
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <form
          className={
            isAdmin
              ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,12rem))_auto_auto]"
              : "grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_auto]"
          }
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit();
          }}
        >
          <Input
            onChange={(event) => onDraftSearchChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            value={draftSearch}
          />

          {isAdmin ? (
            <>
              <Select
                onValueChange={(value) => onCandidateTypeChange(value === "all" ? "" : value)}
                value={candidateType || "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Candidate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Candidate type</SelectItem>
                  {candidateTypeOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {candidateTypeLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) => onResolutionStatusChange(value === "all" ? "" : value)}
                value={resolutionStatus || "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Research status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Research status</SelectItem>
                  {resolutionOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {resolutionStatusLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : null}

          <Select
            onValueChange={(value) => onReviewStatusChange(value === "all" ? "" : value)}
            value={reviewStatus || "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="All review states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All review states</SelectItem>
              {reviewOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {reviewStatusLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin ? (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={includeSuppressed}
                  id="discovery-include-suppressed"
                  onCheckedChange={(checked) => onIncludeSuppressedChange(checked === true)}
                />
                <Label htmlFor="discovery-include-suppressed">{copy.includeSuppressed}</Label>
              </div>
              <p className="mt-1 text-xs leading-5">{copy.includeSuppressedDescription}</p>
            </div>
          ) : null}

          <Button type="submit" variant="outline">
            {searchLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
