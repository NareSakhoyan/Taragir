"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { AppShell } from "@/components/layout/app-shell";
import { HeaderActionLink } from "@/components/layout/header-actions";
import { SectionCards } from "@/components/section-cards";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

import data from "../../dashboard/data.json";

export default function DashboardPage() {
  const { href, messages } = useI18n();

  return (
    <AppShell
      title={messages.dashboard.title}
      description={messages.dashboard.description}
      requiredRole="admin"
      actions={
        <HeaderActionLink direction="forward" href={href(ROUTES.documents)}>
          {messages.dashboard.allDocuments}
        </HeaderActionLink>
      }
    >
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </AppShell>
  );
}
