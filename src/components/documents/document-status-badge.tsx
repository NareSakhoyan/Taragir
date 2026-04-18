"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { DocumentStatus, IngestionJobStatus } from "@/lib/types/api";

type DocumentStatusBadgeProps = {
  status: DocumentStatus | IngestionJobStatus;
};

const statusClasses: Record<DocumentStatus | IngestionJobStatus, string> = {
  uploaded: "bg-secondary text-secondary-foreground",
  queued: "bg-chart-3/15 text-chart-3",
  processing: "bg-chart-4/15 text-chart-4",
  running: "bg-chart-4/15 text-chart-4",
  completed: "bg-primary/15 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const { messages } = useI18n();

  return <Badge className={statusClasses[status]}>{messages.status[status]}</Badge>;
}
