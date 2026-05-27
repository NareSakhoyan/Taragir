"use client";

import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { HeaderActionButton } from "@/components/layout/header-actions";
import { CreateReferenceSourceDialog } from "@/components/references/create-reference-source-dialog";
import { ReferenceSourcesTable } from "@/components/references/reference-sources-table";
import { TableLoadingState } from "@/components/ui/table-loading-state";
import { useReferenceSources } from "@/lib/hooks/use-references";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function ReferenceSourcesPage() {
  const { messages } = useI18n();
  const referenceSourcesQuery = useReferenceSources();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <AppShell
      actions={
        <HeaderActionButton onClick={() => setCreateDialogOpen(true)} type="button">
          {messages.references.createSource}
        </HeaderActionButton>
      }
      description={messages.references.description}
      requiredRole="admin"
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
  );
}
