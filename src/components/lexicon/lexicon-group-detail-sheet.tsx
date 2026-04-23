"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { GroupClassificationBadges } from "@/components/lexicon/group-classification-badges";
import { GroupLinkedBadge } from "@/components/lexicon/group-linked-badge";
import { GroupStateBadge } from "@/components/lexicon/group-state-badge";
import { ReferenceMatchBadge } from "@/components/lexicon/reference-match-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLexiconGroup } from "@/lib/hooks/use-lexicon-group";
import { useI18n } from "@/lib/i18n/use-i18n";
import { ROUTES } from "@/lib/utils/constants";
import { buildDocumentEvidenceHref } from "@/lib/utils/evidence-links";
import { formatNumber } from "@/lib/utils/format";

type LexiconGroupDetailSheetProps = {
  normalizedForm: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewMatches?: (normalizedForm: string) => void;
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function HighlightedSnippet({ snippet, token }: { snippet: string; token: string }) {
  if (!snippet) {
    return null;
  }

  const matchIndex = token ? snippet.indexOf(token) : -1;

  if (matchIndex < 0) {
    return <>{snippet}</>;
  }

  const before = snippet.slice(0, matchIndex);
  const match = snippet.slice(matchIndex, matchIndex + token.length);
  const after = snippet.slice(matchIndex + token.length);

  return (
    <>
      {before}
      <strong className="font-semibold text-foreground">{match}</strong>
      {after}
    </>
  );
}

export function LexiconGroupDetailSheet({
  normalizedForm,
  open,
  onOpenChange,
  onViewMatches,
}: LexiconGroupDetailSheetProps) {
  const { href, locale, messages } = useI18n();
  const groupQuery = useLexiconGroup(normalizedForm, open);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full max-w-4xl flex-col gap-6 p-0" side="right">
        <div className="border-b border-border/70 px-6 py-6">
          <SheetHeader>
            <SheetTitle>{normalizedForm ?? messages.lexicon.detail.fallbackTitle}</SheetTitle>
            <SheetDescription>{messages.lexicon.detail.description}</SheetDescription>
          </SheetHeader>
        </div>

        <div className="min-h-0 flex-1 px-6 pb-6">
          {groupQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-[28rem]" />
            </div>
          ) : groupQuery.error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
              {groupQuery.error.message}
            </div>
          ) : groupQuery.data ? (
            <div className="flex h-full min-h-0 flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-md border border-border/80 bg-card/70 p-5 shadow-sm xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-2xl font-semibold">{groupQuery.data.normalized_form}</h2>
                    <GroupStateBadge state={groupQuery.data.group_state} />
                    <GroupClassificationBadges scriptType={groupQuery.data.dominant_script_type} />
                    {groupQuery.data.is_suspicious ? (
                      <Badge className="gap-1.5" variant="destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {messages.lexicon.badges.suspicious}
                      </Badge>
                    ) : null}
                    <GroupLinkedBadge
                      linkedLexemeCanonicalForm={groupQuery.data.linked_lexeme_canonical_form}
                      linkedLexemeId={groupQuery.data.linked_lexeme_id}
                    />
                  </div>
                  {groupQuery.data.is_suspicious && groupQuery.data.suspicion_reasons.length ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{messages.lexicon.detail.suspicionReasons}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {groupQuery.data.suspicion_reasons.map((reason) => (
                          <Badge key={reason} variant="destructive">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {groupQuery.data.linked_lexeme_id ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{messages.lexicon.detail.linkedLexeme}</p>
                      <Link
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        href={href(`${ROUTES.lexemes}/${groupQuery.data.linked_lexeme_id}`)}
                      >
                        {groupQuery.data.linked_lexeme_canonical_form ?? messages.lexicon.detail.openLinkedLexeme}
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{messages.lexicon.detail.unlinkedDescription}</p>
                  )}
                  <div className="rounded-md border border-border/70 bg-muted/10 p-4">
                    <ReferenceMatchBadge
                      bestMatch={groupQuery.data.best_reference_match}
                      hasMatch={groupQuery.data.has_reference_match}
                      matchCount={groupQuery.data.reference_match_count}
                      showUnmatched
                    />
                    {groupQuery.data.normalized_form ? (
                      <div className="mt-3">
                        <Button onClick={() => onViewMatches?.(groupQuery.data.normalized_form)} type="button" variant="outline">
                          {messages.reference.actions.viewMatches}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label={messages.lexicon.detail.occurrences} value={formatNumber(groupQuery.data.occurrence_count, locale)} />
                  <StatCard label={messages.lexicon.detail.documents} value={formatNumber(groupQuery.data.document_count, locale)} />
                  <StatCard label={messages.lexicon.detail.pages} value={formatNumber(groupQuery.data.page_count, locale)} />
                </div>
              </div>

              <div className="min-h-0 flex-1 rounded-md border border-border/80 shadow-sm">
                <div className="border-b border-border/70 px-5 py-4">
                  <h3 className="font-semibold tracking-tight">{messages.lexicon.detail.evidenceTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{messages.lexicon.detail.evidenceDescription}</p>
                </div>

                <ScrollArea className="h-[28rem]">
                  {groupQuery.data.occurrences.length ? (
                    <>
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead>{messages.lexicon.detail.token}</TableHead>
                              <TableHead>{messages.lexicon.detail.document}</TableHead>
                              <TableHead>{messages.lexicon.detail.page}</TableHead>
                              <TableHead>{messages.lexicon.detail.context}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupQuery.data.occurrences.map((occurrence) => (
                              <TableRow key={occurrence.id}>
                                <TableCell>
                                  <div className="space-y-1">
                                    <p className="font-semibold">{occurrence.token}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {messages.lexicon.detail.normalized}: {occurrence.normalized_token}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Link
                                      className="font-medium text-primary underline-offset-4 hover:underline"
                                      href={href(
                                        buildDocumentEvidenceHref(
                                          occurrence.document_id,
                                          occurrence.page_number,
                                        ) ?? `${ROUTES.documents}/${occurrence.document_id}`,
                                      )}
                                    >
                                      {occurrence.document_title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">
                                      {messages.lexicon.detail.documentId}: {occurrence.document_id}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>{formatNumber(occurrence.page_number, locale)}</TableCell>
                                <TableCell className="max-w-xl">
                                  <div className="rounded-md bg-muted/20 px-4 py-3 text-sm leading-7 text-foreground/90">
                                    {occurrence.context_snippet ? (
                                      <HighlightedSnippet snippet={occurrence.context_snippet} token={occurrence.token} />
                                    ) : (
                                      messages.lexicon.detail.noContextSnippet
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="space-y-3 px-5 py-4 md:hidden">
                        {groupQuery.data.occurrences.map((occurrence) => (
                          <div className="rounded-md border border-border/70 bg-muted/10 p-4" key={occurrence.id}>
                            <div className="space-y-2">
                              <p className="font-semibold">{occurrence.token}</p>
                              <p className="text-xs text-muted-foreground">
                                {messages.lexicon.detail.normalized}: {occurrence.normalized_token}
                              </p>
                              <Link
                                className="block font-medium text-primary underline-offset-4 hover:underline"
                                href={href(
                                  buildDocumentEvidenceHref(
                                    occurrence.document_id,
                                    occurrence.page_number,
                                  ) ?? `${ROUTES.documents}/${occurrence.document_id}`,
                                )}
                              >
                                {occurrence.document_title}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {messages.lexicon.detail.page} {formatNumber(occurrence.page_number, locale)}
                              </p>
                              <p className="rounded-md bg-background px-3 py-3 text-sm leading-7">
                                {occurrence.context_snippet ? (
                                  <HighlightedSnippet snippet={occurrence.context_snippet} token={occurrence.token} />
                                ) : (
                                  messages.lexicon.detail.noContextSnippet
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <p className="font-medium">{messages.lexicon.detail.noEvidenceTitle}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{messages.lexicon.detail.noEvidenceDescription}</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
