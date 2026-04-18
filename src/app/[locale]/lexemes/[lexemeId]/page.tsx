"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { LexemeDetailCard } from "@/components/lexemes/lexeme-detail-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLexeme } from "@/lib/hooks/use-lexeme";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";

export default function LexemeDetailPage() {
  const params = useParams<{ lexemeId: string }>();
  const { href, messages } = useI18n();
  const lexemeQuery = useLexeme(params.lexemeId);

  return (
    <AuthGuard>
      <AppShell
        actions={
          <Link href={href(ROUTES.lexemes)}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              {messages.lexemeDetail.backToLexemes}
            </Button>
          </Link>
        }
        description={messages.lexemeDetail.description}
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
    </AuthGuard>
  );
}
