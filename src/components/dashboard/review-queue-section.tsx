"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviewQueue } from "@/lib/hooks/use-review-queue";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { ReviewQueueItem } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import { formatNumber, titleFromDocument } from "@/lib/utils/format";

export function ReviewQueueSection() {
  const { href, locale, messages } = useI18n();
  const reviewQueueQuery = useReviewQueue({ limit: 8, offset: 0 });

  return (
    <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
      <header className="border-b border-border/70 pb-4">
        <h2 className="text-lg font-semibold tracking-tight">{messages.dashboard.reviewQueueTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{messages.dashboard.reviewQueueDescription}</p>
      </header>

      {reviewQueueQuery.isLoading ? (
        <Skeleton className="mt-4 h-40" />
      ) : reviewQueueQuery.error ? (
        <p className="mt-4 text-sm text-destructive">{reviewQueueQuery.error.message}</p>
      ) : !reviewQueueQuery.data?.items.length ? (
        <p className="mt-4 text-sm text-muted-foreground">{messages.dashboard.reviewQueueEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviewQueueQuery.data.items.map((item) => (
            <ReviewQueueRow key={item.document.id} href={href} item={item} locale={locale} messages={messages} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewQueueRow({
  item,
  href,
  locale,
  messages,
}: {
  item: ReviewQueueItem;
  href: (path: string) => string;
  locale: Locale;
  messages: ReturnType<typeof useI18n>["messages"];
}) {
  const lexiconPath =
    item.workflow.review_lexicon_path ?? `${ROUTES.lexicon}?document_id=${item.document.id}&view=candidates`;

  return (
    <li className="flex flex-col gap-3 rounded-md border border-border/70 bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <ReviewQueueItemSummary
        candidateCount={item.workflow.candidate_count}
        documentTitle={titleFromDocument(item.document)}
        linkedCount={item.workflow.linked_count}
        locale={locale}
        messages={messages}
      />
      <Link href={href(lexiconPath)}>
        <Button size="sm" type="button" variant="outline">
          {messages.dashboard.reviewCandidates}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </li>
  );
}

function ReviewQueueItemSummary({
  documentTitle,
  candidateCount,
  linkedCount,
  locale,
  messages,
}: {
  documentTitle: string;
  candidateCount: number;
  linkedCount: number;
  locale: Locale;
  messages: ReturnType<typeof useI18n>["messages"];
}) {
  return (
    <div className="space-y-1">
      <p className="font-medium">{documentTitle}</p>
      <p className="text-sm text-muted-foreground">
        {messages.dashboard.candidateGroups.replace("{count}", formatNumber(candidateCount, locale))}
        {linkedCount > 0 ? ` · ${formatNumber(linkedCount, locale)} linked` : ""}
      </p>
    </div>
  );
}
