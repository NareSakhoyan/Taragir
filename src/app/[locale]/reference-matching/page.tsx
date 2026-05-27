"use client";

import { AppShell } from "@/components/layout/app-shell";
import { MatchRunsTable } from "@/components/reference-matching/match-runs-table";
import { StartMatchRunCard } from "@/components/reference-matching/start-match-run-card";
import { TableLoadingState } from "@/components/ui/table-loading-state";
import { useReferenceMatchingRuns } from "@/lib/hooks/use-reference-matching";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function ReferenceMatchingPage() {
  const { messages } = useI18n();
  const runsQuery = useReferenceMatchingRuns();

  return (
    <AppShell
      description={messages.referenceMatching.description}
      requiredRole="admin"
      title={messages.referenceMatching.title}
    >
        <div className="flex flex-col gap-8">
          <StartMatchRunCard />

          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            <div className="space-y-1 border-b border-border/70 pb-4">
              <h2 className="text-lg font-semibold tracking-tight">{messages.referenceMatching.previousRunsTitle}</h2>
              <p className="text-sm text-muted-foreground">{messages.referenceMatching.previousRunsDescription}</p>
            </div>

            <div className="mt-4">
              {runsQuery.isLoading ? (
                <TableLoadingState />
              ) : runsQuery.error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                  {runsQuery.error.message}
                </div>
              ) : (
                <MatchRunsTable runs={runsQuery.data ?? []} />
              )}
            </div>
          </section>
        </div>
    </AppShell>
  );
}
