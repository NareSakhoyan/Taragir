import type {
  ReferenceImportMethod,
  ReferenceSourceDetail,
  ReferenceSourceImportSummary,
} from "@/lib/types/api";
import { isOcrReferenceImportMethod } from "@/lib/utils/format";

export type ReferenceSourceDetailView = {
  latestImport: ReferenceSourceImportSummary | null;
  latestImportState: "summary" | "metadata_only" | "empty";
  lastImportMethod: ReferenceImportMethod | null;
  lastImportWarning: string | null;
  lastImportedAt: string | null;
  hasImportedEntries: boolean;
  hasImportMetadata: boolean;
  hasExactImportCounters: boolean;
  showOcrWarning: boolean;
};

export function deriveReferenceSourceDetailView(
  source: ReferenceSourceDetail | null | undefined,
): ReferenceSourceDetailView {
  const latestImport = source?.most_recent_import ?? null;
  const lastImportMethod = source?.last_import_method ?? latestImport?.import_method ?? null;
  const lastImportWarning = source?.last_import_warning ?? latestImport?.warning_message ?? null;
  const lastImportedAt = source?.last_imported_at ?? latestImport?.created_at ?? null;
  const hasImportedEntries = (source?.entry_count ?? 0) > 0;
  const hasImportMetadata = Boolean(lastImportedAt || lastImportMethod || lastImportWarning);

  return {
    latestImport,
    latestImportState: latestImport ? "summary" : hasImportMetadata || hasImportedEntries ? "metadata_only" : "empty",
    lastImportMethod,
    lastImportWarning,
    lastImportedAt,
    hasImportedEntries,
    hasImportMetadata,
    hasExactImportCounters: Boolean(latestImport),
    showOcrWarning: isOcrReferenceImportMethod(lastImportMethod),
  };
}
