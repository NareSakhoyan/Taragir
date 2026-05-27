"use client";

import { useParams } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { HeaderActionLink } from "@/components/layout/header-actions";
import { LexemeDetailCard } from "@/components/lexemes/lexeme-detail-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLexeme } from "@/lib/hooks/use-lexeme";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

export default function LexemeDetailPage() {
  const params = useParams<{ lexemeId: string }>();
  const { href, messages } = useI18n();
  const lexemeQuery = useLexeme(params.lexemeId);

  return (
    <AppShell
      actions={
        <HeaderActionLink direction="back" href={href(ROUTES.lexemes)}>
          {messages.lexemeDetail.backToLexemes}
        </HeaderActionLink>
      }
      description={messages.lexemeDetail.description}
      requiredRole="admin"
      title={lexemeQuery.data?.canonical_form ?? messages.lexemeDetail.fallbackTitle}
    >
        {lexemeQuery.isLoading ? (
          <Skeleton className="h-[34rem]" />
        ) : lexemeQuery.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
            {lexemeQuery.error.message}
          </div>
        ) : lexemeQuery.data ? (
          <LexemeDetailCard lexeme={lexemeQuery.data} />
        ) : null}
    </AppShell>
  );
}
