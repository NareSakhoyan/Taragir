"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Files } from "lucide-react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DocumentsTable } from "@/components/documents/documents-table";
import { AppShell } from "@/components/layout/app-shell";
import { UploadForm } from "@/components/upload/upload-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments, useDocumentsSummary } from "@/lib/hooks/use-documents";
import { useI18n } from "@/lib/i18n/use-i18n";
import { RECENT_DOCUMENTS_LIMIT, ROUTES } from "@/lib/utils/constants";
import { formatNumber } from "@/lib/utils/format";

function StatBlock({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Files;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-8 last:border-b-0 lg:border-b-0 lg:border-r lg:border-border/70 lg:py-10 lg:last:border-r-0">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-serif text-4xl font-semibold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-md bg-secondary/80 p-3 text-secondary-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { href, locale, messages } = useI18n();
  const summaryQuery = useDocumentsSummary();
  const recentDocumentsQuery = useDocuments({
    limit: RECENT_DOCUMENTS_LIMIT,
    offset: 0,
  });

  const summaryDocuments = summaryQuery.data ?? [];
  const totalDocuments = summaryDocuments.length;
  const completedDocuments = summaryDocuments.filter((document) => document.status === "completed").length;
  const processingDocuments = summaryDocuments.filter((document) => document.status === "processing").length;
  const queuedDocuments = summaryDocuments.filter((document) => document.status === "queued").length;

  return (
    <AuthGuard>
      <AppShell
        title={messages.dashboard.title}
        description={messages.dashboard.description}
        actions={
          <Link href={href(ROUTES.documents)}>
            <Button variant="outline">
              {messages.dashboard.allDocuments}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      >
        <div className="flex flex-col">
          <section className="grid border-b border-border/80 lg:grid-cols-3 lg:divide-x lg:divide-border/70">
            {summaryQuery.isLoading ? (
              <>
                <Skeleton className="h-36 border-b border-border/70 lg:border-b-0" />
                <Skeleton className="h-36 border-b border-border/70 lg:border-b-0" />
                <Skeleton className="h-36" />
              </>
            ) : (
              <>
                <div className="px-1 lg:px-8">
                  <StatBlock
                    description={messages.dashboard.totalDocumentsDescription}
                    icon={Files}
                    label={messages.dashboard.totalDocuments}
                    value={formatNumber(totalDocuments, locale)}
                  />
                </div>
                <div className="px-1 lg:px-8">
                  <StatBlock
                    description={messages.dashboard.completedDescription}
                    icon={CheckCircle2}
                    label={messages.dashboard.completed}
                    value={formatNumber(completedDocuments, locale)}
                  />
                </div>
                <div className="px-1 lg:px-8">
                  <StatBlock
                    description={messages.dashboard.processingDescription
                      .replace("{processing}", formatNumber(processingDocuments, locale))
                      .replace("{queued}", formatNumber(queuedDocuments, locale))}
                    icon={Clock3}
                    label={messages.dashboard.processing}
                    value={formatNumber(processingDocuments, locale)}
                  />
                </div>
              </>
            )}
          </section>

          <section className="grid gap-0 py-10 xl:grid-cols-[1.35fr_1fr] xl:divide-x xl:divide-border/70">
            <div className="min-w-0 pb-10 xl:pb-0 xl:pr-10">
              {recentDocumentsQuery.isLoading ? (
                <Skeleton className="h-[26rem]" />
              ) : (
                <DocumentsTable
                  description={messages.dashboard.recentDocumentsDescription}
                  documents={recentDocumentsQuery.data?.items ?? []}
                  emptyMessage={messages.dashboard.recentDocumentsEmpty}
                  title={messages.dashboard.recentDocumentsTitle}
                />
              )}
            </div>
            <div className="min-w-0 border-t border-border/70 pt-10 xl:border-t-0 xl:pt-0 xl:pl-10">
              <UploadForm />
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
