"use client";

import { useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { CreateReferenceSourceDialog } from "@/components/references/create-reference-source-dialog";
import { ReferenceSourcesTable } from "@/components/references/reference-sources-table";
import { Button } from "@/components/ui/button";
import { TableLoadingState } from "@/components/ui/table-loading-state";
import { useReferenceSources } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function ReferenceSourcesPage() {
  const { messages } = useI18n();
  const referenceSourcesQuery = useReferenceSources();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AuthGuard>
      <AppShell
        actions={
          <Button onClick={() => setCreateDialogOpen(true)} type="button">
            {messages.references.createSource}
          </Button>
        }
        description={messages.references.description}
        title={messages.references.title}
      >
        <div className="flex flex-col gap-8">
          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{messages.references.sectionTitle}</h2>
              <p className="text-sm text-muted-foreground">{messages.references.sectionDescription}</p>
            </div>
          </section>

          <section className="rounded-md border border-border/80 bg-card/80 p-5 shadow-sm">
            {referenceSourcesQuery.isLoading ? (
              <TableLoadingState />
            ) : referenceSourcesQuery.error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                {referenceSourcesQuery.error.message}
              </div>
            ) : (
              <ReferenceSourcesTable sources={referenceSourcesQuery.data ?? []} />
            )}
          </section>
        </div>

        <CreateReferenceSourceDialog
          onOpenChange={setCreateDialogOpen}
          open={createDialogOpen}
          openDetailOnSuccess
        />
      </AppShell>
    </AuthGuard>
  );
}
