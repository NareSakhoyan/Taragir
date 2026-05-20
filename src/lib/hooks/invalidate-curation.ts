"use client";

import type { QueryClient } from "@tanstack/react-query";

import { documentKeys } from "@/lib/hooks/use-documents";
import { singleDocumentKeys } from "@/lib/hooks/use-document";
import { lexemeKeys } from "@/lib/hooks/use-lexemes";
import { lexiconKeys } from "@/lib/hooks/use-lexicon-groups";
import { reviewQueueKeys } from "@/lib/hooks/use-review-queue";

type InvalidateCurationOptions = {
  documentId?: string | null;
  lexemeId?: string | null;
};

export async function invalidateWorkflowQueries(
  queryClient: QueryClient,
  options: Pick<InvalidateCurationOptions, "documentId"> = {},
) {
  const tasks: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
    queryClient.invalidateQueries({ queryKey: documentKeys.stats() }),
    queryClient.invalidateQueries({ queryKey: documentKeys.lists() }),
  ];

  if (options.documentId) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: singleDocumentKeys.detail(options.documentId) }),
      queryClient.invalidateQueries({ queryKey: ["documents", options.documentId] }),
    );
  }

  await Promise.all(tasks);
}

export async function invalidateCurationQueries(
  queryClient: QueryClient,
  options: InvalidateCurationOptions = {},
) {
  const tasks: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: lexiconKeys.groups() }),
    queryClient.invalidateQueries({ queryKey: lexemeKeys.all }),
    queryClient.invalidateQueries({ queryKey: reviewQueueKeys.all }),
    queryClient.invalidateQueries({ queryKey: documentKeys.stats() }),
    queryClient.invalidateQueries({ queryKey: documentKeys.lists() }),
  ];

  if (options.documentId) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: ["documents", options.documentId] }),
      queryClient.invalidateQueries({ queryKey: ["documents", "summary"] }),
    );
  }

  if (options.lexemeId) {
    tasks.push(queryClient.invalidateQueries({ queryKey: lexemeKeys.detail(options.lexemeId) }));
  }

  await Promise.all(tasks);
}
