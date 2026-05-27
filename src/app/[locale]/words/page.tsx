"use client";

import { AppShell } from "@/components/layout/app-shell";
import { GlobalWordSearch } from "@/components/words/global-word-search";
import { useI18n } from "@/lib/i18n/use-i18n";

export default function WordsPage() {
  const { messages } = useI18n();

  return (
    <AppShell description={messages.words.pageDescription} requiredRole="admin" title={messages.words.pageTitle}>
      <GlobalWordSearch />
    </AppShell>
  );
}
