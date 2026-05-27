"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { DiscoveryCandidate, DiscoveryCandidateDetailResponse, DiscoveryEvidenceItem } from "@/lib/types/api";
import { ROUTES } from "@/lib/utils/constants";
import {
  candidateTypeLabel,
  evidenceLabel,
  evidenceLine,
  evidenceSourceHref,
  hasLexemeResolution,
  pieLemmaFromMorphology,
  readBoolean,
  readNumber,
  readPayloadString,
  readRecord,
  readString,
  resolutionStatusLabel,
  sourceHrefFromText,
  suggestedAction,
  userEvidenceMeaning,
  userEvidenceSourceLabel,
  type DiscoveryEvidenceSection,
} from "@/lib/utils/discovery";
import { buildDocumentEvidenceHref } from "@/lib/utils/evidence-links";

export type DecisionOptions = {
  create_lexeme_canonical_form?: string | null;
  create_lexeme_definition?: string | null;
};

export type PendingDecisionAction =
  | "mark_interesting"
  | "mark_poorly_defined"
  | "mark_known"
  | "mark_ocr_noise"
  | "mark_uncertain"
  | "ignore"
  | "create_lexeme"
  | "confirm_pie_lemma";

type DiscoveryDecisionCopy = {
  createLexeme: string;
  ignore: string;
  interesting: string;
  known: string;
  ocrNoise: string;
  poorlyDefined: string;
  uncertain: string;
};

type DiscoveryCandidateSheetProps = {
  candidateDetail: DiscoveryCandidateDetailResponse | undefined;
  copy: {
    contexts: string;
    decisions: DiscoveryDecisionCopy;
    detailTitle: string;
    notePlaceholder: string;
  };
  decisionPending: boolean;
  documentId: string;
  href: (path: string) => string;
  isAdmin: boolean;
  isDetailFetching: boolean;
  isDetailLoading: boolean;
  lexemeCanonicalForm: string;
  lexemeDefinition: string;
  linguistEvidence: DiscoveryEvidenceItem[];
  note: string;
  onClose: () => void;
  onConfirmPieLemma: (lemma: string) => void;
  onCreateLexeme: (canonicalForm: string) => void;
  onDecision: (decision: PendingDecisionAction) => void;
  onLexemeCanonicalFormChange: (value: string) => void;
  onLexemeDefinitionChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onShowEvidenceDetailsChange: (value: boolean) => void;
  open: boolean;
  pendingDecisionAction: PendingDecisionAction | null;
  pieLemma: string | null;
  selectedCandidate: DiscoveryCandidate | null;
  showEvidenceDetails: boolean;
  visibleEvidenceSections: DiscoveryEvidenceSection[];
};

function SourceCitation({
  href,
  item,
}: {
  href: (path: string) => string;
  item: DiscoveryEvidenceItem;
}) {
  const sourceHref = evidenceSourceHref(item);
  const sourceLabel =
    item.citation ?? readPayloadString(item, "source_title") ?? readPayloadString(item, "source_name") ?? "Open source";

  if (!sourceHref) {
    return <p className="mt-1 text-xs">Source: {sourceLabel}</p>;
  }

  const isExternal = sourceHref.startsWith("http://") || sourceHref.startsWith("https://");
  const className = "font-medium text-primary underline-offset-4 hover:underline";

  return (
    <p className="mt-1 text-xs">
      Source:{" "}
      {isExternal ? (
        <a className={className} href={sourceHref} rel="noreferrer" target="_blank">
          {sourceLabel}
        </a>
      ) : (
        <Link className={className} href={href(sourceHref)}>
          {sourceLabel}
        </Link>
      )}
    </p>
  );
}

function SourceValueLink({
  href,
  label,
}: {
  href: (path: string) => string;
  label: string;
}) {
  const sourceHref = sourceHrefFromText(label);
  if (!sourceHref) {
    return <>{label}</>;
  }
  const className = "font-medium text-primary underline-offset-4 hover:underline";
  if (sourceHref.startsWith("http://") || sourceHref.startsWith("https://")) {
    return (
      <a className={className} href={sourceHref} rel="noreferrer" target="_blank">
        {label}
      </a>
    );
  }
  return (
    <Link className={className} href={href(sourceHref)}>
      {label}
    </Link>
  );
}

function HighlightedContext({
  context,
  highlightEnd,
  highlightStart,
}: {
  context: string;
  highlightEnd?: number | null;
  highlightStart?: number | null;
}) {
  const hasHighlight =
    typeof highlightStart === "number" &&
    typeof highlightEnd === "number" &&
    highlightStart >= 0 &&
    highlightEnd > highlightStart &&
    highlightEnd <= context.length;

  if (!hasHighlight) {
    return <>{context}</>;
  }

  return (
    <>
      {context.slice(0, highlightStart)}
      <strong className="font-semibold text-foreground">{context.slice(highlightStart, highlightEnd)}</strong>
      {context.slice(highlightEnd)}
    </>
  );
}

function LexemeResolutionSection({ morphology }: { morphology: Record<string, unknown> | undefined }) {
  const resolution = readRecord(morphology?.lexeme_resolution);
  const surfaceForm = readString(resolution, "surface_form");
  const pieLemma = pieLemmaFromMorphology(morphology);
  const dictionaryLemma = readString(resolution, "dictionary_lemma");
  const mappingSource = readString(resolution, "dictionary_lemma_source");
  const resolutionType = readString(resolution, "resolution_type");
  const confidence = readNumber(resolution, "confidence");
  const resolvedByMapping = resolutionType === "resolved_by_approved_lexeme_mapping";

  return (
    <section>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Lexeme resolution</h3>
        {resolvedByMapping ? <Badge variant="secondary">Resolved by approved lexeme mapping</Badge> : null}
      </div>
      <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
        <p><span className="font-medium text-foreground">Surface form:</span> {surfaceForm ?? "—"}</p>
        <p><span className="font-medium text-foreground">PIE lemma:</span> {pieLemma ?? "—"}</p>
        <p><span className="font-medium text-foreground">Dictionary lemma:</span> {dictionaryLemma ?? "—"}</p>
        <p><span className="font-medium text-foreground">Mapping source:</span> {mappingSource ?? "—"}</p>
        <p><span className="font-medium text-foreground">Confidence:</span> {confidence ?? "—"}</p>
      </div>
    </section>
  );
}

function EvidenceSection({
  href,
  items,
  showPayload = false,
  title,
}: {
  href: (path: string) => string;
  items: DiscoveryEvidenceItem[];
  showPayload?: boolean;
  title: string;
}) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <div className="rounded-md border border-border/70 bg-background p-3" key={`${title}-${item.provider_key}-${index}`}>
            <p>{evidenceLine(item)}</p>
            <SourceCitation href={href} item={item} />
            {typeof item.payload.snippet === "string" && item.payload.snippet.trim() ? (
              <p className="mt-2 text-xs">{item.payload.snippet}</p>
            ) : null}
            {showPayload && Object.keys(item.payload).length ? (
              <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function UserEvidenceSection({
  href,
  items,
}: {
  href: (path: string) => string;
  items: DiscoveryEvidenceItem[];
}) {
  return (
    <section>
      <h3 className="font-semibold">Evidence details</h3>
      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const forms = [
            item.result_headword ? `Headword: ${item.result_headword}` : null,
            item.lemma ? `Lemma: ${item.lemma}` : null,
            item.matched_form ? `Matched form: ${item.matched_form}` : null,
          ].filter(Boolean);

          return (
            <div className="rounded-md border border-border/70 bg-background p-3" key={`${item.provider_type}-${index}`}>
              <p className="font-medium text-foreground">{userEvidenceSourceLabel(item)}</p>
              <p className="mt-1">{userEvidenceMeaning(item)}</p>
              {forms.length ? <p className="mt-1 text-xs">{forms.join(" / ")}</p> : null}
              <SourceCitation href={href} item={item} />
              {typeof item.payload.snippet === "string" && item.payload.snippet.trim() ? (
                <p className="mt-2 text-xs">{item.payload.snippet}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TechnicalSummarySection({
  candidate,
  href,
}: {
  candidate: DiscoveryCandidate;
  href: (path: string) => string;
}) {
  const summary = readRecord(candidate.best_evidence_summary);
  const citation = readString(summary, "citation");
  const exactMatch = readBoolean(summary, "is_exact_match");
  const substringMatch = readBoolean(summary, "is_substring_match");
  const fuzzyMatch = readBoolean(summary, "is_fuzzy_match");
  const canonicalMatch = readBoolean(summary, "is_canonical_match");
  type TechnicalSummaryRow = [string, ReactNode | null | undefined];
  const row = (label: string, value: TechnicalSummaryRow[1]): TechnicalSummaryRow => [label, value];
  const rows = [
    row("Provider", readString(summary, "provider_key")),
    row("Provider type", readString(summary, "provider_type")),
    row("Evidence role", readString(summary, "evidence_role")),
    row("Match type", readString(summary, "match_type")),
    row("Validation", readString(summary, "validation_strength")),
    row("Evidence strength", readString(summary, "evidence_strength")),
    row("Definition quality", readString(summary, "definition_quality")),
    row("Matched form", readString(summary, "matched_form")),
    row("Headword", readString(summary, "result_headword")),
    row("Lemma", readString(summary, "lemma")),
    row("Language profile", readString(summary, "language_profile")),
    row("Confidence", readNumber(summary, "confidence_score")),
    row("Exact match", exactMatch === null ? null : String(exactMatch)),
    row("Substring match", substringMatch === null ? null : String(substringMatch)),
    row("Fuzzy match", fuzzyMatch === null ? null : String(fuzzyMatch)),
    row("Canonical match", canonicalMatch === null ? null : String(canonicalMatch)),
    row("Citation", citation ? <SourceValueLink href={href} label={citation} /> : null),
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <section>
      <h3 className="font-semibold">Technical summary</h3>
      {rows.length ? (
        <dl className="mt-2 grid gap-2 text-sm text-muted-foreground">
          {rows.map(([label, value]) => (
            <div className="grid gap-1 rounded-md border border-border/70 bg-background p-3" key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 rounded-md border border-border/70 bg-background p-3 text-sm text-muted-foreground">
          No best-evidence metadata was stored for this candidate.
        </p>
      )}
    </section>
  );
}

function EmptyEvidenceDetailsSection() {
  return (
    <section>
      <h3 className="font-semibold">Evidence details</h3>
      <div className="mt-2 rounded-md border border-border/70 bg-background p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">No additional evidence details are available.</p>
        <p className="mt-1">
          This candidate may have been shown from occurrence counts, OCR risk, or the stored best-evidence summary
          rather than from a detailed provider result.
        </p>
      </div>
    </section>
  );
}

function decisionButtonContent(
  pendingDecisionAction: PendingDecisionAction | null,
  action: PendingDecisionAction,
  label: string,
) {
  if (pendingDecisionAction !== action) {
    return label;
  }
  return (
    <>
      <RefreshCw className="h-4 w-4 animate-spin" />
      {label}
    </>
  );
}

export function DiscoveryCandidateSheet({
  candidateDetail,
  copy,
  decisionPending,
  documentId,
  href,
  isAdmin,
  isDetailFetching,
  isDetailLoading,
  lexemeCanonicalForm,
  lexemeDefinition,
  linguistEvidence,
  note,
  onClose,
  onConfirmPieLemma,
  onCreateLexeme,
  onDecision,
  onLexemeCanonicalFormChange,
  onLexemeDefinitionChange,
  onNoteChange,
  onShowEvidenceDetailsChange,
  open,
  pendingDecisionAction,
  pieLemma,
  selectedCandidate,
  showEvidenceDetails,
  visibleEvidenceSections,
}: DiscoveryCandidateSheetProps) {
  return (
    <Sheet
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={open}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{selectedCandidate?.normalized_form ?? copy.detailTitle}</SheetTitle>
          <SheetDescription>
            {selectedCandidate ? resolutionStatusLabel(selectedCandidate.resolution_status) : null}
          </SheetDescription>
        </SheetHeader>

        {isDetailLoading ? (
          <Skeleton className="mt-6 h-64" />
        ) : selectedCandidate ? (
          <div className="mt-6 space-y-6">
            <section>
              <h3 className="font-semibold">Research summary</h3>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Suggested action:</span>{" "}
                  {suggestedAction(selectedCandidate)}
                </p>
                <p>
                  <span className="font-medium text-foreground">Confidence:</span>{" "}
                  {selectedCandidate.confidence_score ?? "not established"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Candidate type:</span>{" "}
                  {candidateTypeLabel(selectedCandidate.candidate_type)}
                </p>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {(candidateDetail?.why_shown ?? []).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold">Original evidence</h3>
              <p className="mt-2 text-sm text-muted-foreground">{selectedCandidate.sample_tokens.join(", ")}</p>
              {selectedCandidate.sample_pages.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  pages: {selectedCandidate.sample_pages.join(", ")}
                </p>
              ) : null}
            </section>

            <section>
              <h3 className="font-semibold">Best evidence</h3>
              <p className="mt-2 rounded-md border border-border/70 bg-background p-3 text-sm text-muted-foreground">
                {evidenceLabel(selectedCandidate)}
              </p>
            </section>

            {!isAdmin ? (
              <section>
                <Button
                  disabled={isDetailFetching}
                  onClick={() => onShowEvidenceDetailsChange(!showEvidenceDetails)}
                  type="button"
                  variant="outline"
                >
                  {showEvidenceDetails ? "Hide evidence details" : "Show evidence details"}
                </Button>
                {showEvidenceDetails && isDetailFetching ? (
                  <p className="mt-2 text-sm text-muted-foreground">Loading evidence details...</p>
                ) : null}
              </section>
            ) : null}

            {isAdmin ? (
              <>
                <TechnicalSummarySection candidate={selectedCandidate} href={href} />
                {hasLexemeResolution(candidateDetail?.morphology) ? (
                  <LexemeResolutionSection morphology={candidateDetail?.morphology} />
                ) : null}
                {visibleEvidenceSections.length ? (
                  visibleEvidenceSections.map((section) => (
                    <EvidenceSection
                      href={href}
                      items={section.items}
                      key={section.title}
                      showPayload={isAdmin}
                      title={section.title}
                    />
                  ))
                ) : (
                  <EmptyEvidenceDetailsSection />
                )}
              </>
            ) : showEvidenceDetails ? (
              linguistEvidence.length ? (
                <UserEvidenceSection href={href} items={linguistEvidence} />
              ) : (
                <EmptyEvidenceDetailsSection />
              )
            ) : null}

            <section>
              <h3 className="font-semibold">{copy.contexts}</h3>
              <div className="mt-2 space-y-2">
                {(candidateDetail?.occurrence_evidence ?? []).length
                  ? candidateDetail?.occurrence_evidence.map((occurrence) => (
                      <div
                        key={`${occurrence.page_number}-${occurrence.context_snippet}`}
                        className="rounded-md border border-border/70 bg-background p-3 text-sm"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground">p.{occurrence.page_number}</span>
                          <Link
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            href={href(
                              buildDocumentEvidenceHref(documentId, occurrence.page_number) ??
                                `${ROUTES.documents}/${documentId}`,
                            )}
                          >
                            Open source page
                          </Link>
                        </div>
                        <p>
                          <HighlightedContext
                            context={occurrence.context_snippet}
                            highlightEnd={occurrence.context_highlight_end}
                            highlightStart={occurrence.context_highlight_start}
                          />
                        </p>
                      </div>
                    ))
                  : selectedCandidate.sample_contexts.map((context) => (
                      <p key={context} className="rounded-md border border-border/70 bg-background p-3 text-sm">
                        {context}
                      </p>
                    ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold">Linguist decision</h3>
              <Textarea onChange={(event) => onNoteChange(event.target.value)} placeholder={copy.notePlaceholder} value={note} />
              <div className="rounded-md border border-border/70 bg-muted/10 p-3">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="discovery-lexeme-canonical">
                      New lexeme canonical form
                    </label>
                    <Input
                      id="discovery-lexeme-canonical"
                      onChange={(event) => onLexemeCanonicalFormChange(event.target.value)}
                      placeholder={selectedCandidate.canonical_form_candidate || selectedCandidate.normalized_form}
                      value={lexemeCanonicalForm}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="discovery-lexeme-definition">
                      Definition / notes
                    </label>
                    <Textarea
                      id="discovery-lexeme-definition"
                      onChange={(event) => onLexemeDefinitionChange(event.target.value)}
                      placeholder="Add a working definition or source note for the new lexeme."
                      value={lexemeDefinition}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pieLemma ? (
                      <Button
                        disabled={decisionPending}
                        onClick={() => onConfirmPieLemma(pieLemma)}
                        type="button"
                        variant="secondary"
                      >
                        {decisionButtonContent(
                          pendingDecisionAction,
                          "confirm_pie_lemma",
                          `Confirm PIE lemma: ${pieLemma}`,
                        )}
                      </Button>
                    ) : null}
                    <Button
                      disabled={decisionPending}
                      onClick={() => onCreateLexeme(lexemeCanonicalForm)}
                      type="button"
                      variant="secondary"
                    >
                      {decisionButtonContent(pendingDecisionAction, "create_lexeme", copy.decisions.createLexeme)}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={decisionPending} onClick={() => onDecision("mark_interesting")} type="button">
                  {decisionButtonContent(pendingDecisionAction, "mark_interesting", copy.decisions.interesting)}
                </Button>
                <Button
                  disabled={decisionPending}
                  onClick={() => onDecision("mark_poorly_defined")}
                  type="button"
                  variant="outline"
                >
                  {decisionButtonContent(pendingDecisionAction, "mark_poorly_defined", copy.decisions.poorlyDefined)}
                </Button>
                <Button disabled={decisionPending} onClick={() => onDecision("mark_known")} type="button" variant="outline">
                  {decisionButtonContent(pendingDecisionAction, "mark_known", copy.decisions.known)}
                </Button>
                <Button
                  disabled={decisionPending}
                  onClick={() => onDecision("mark_ocr_noise")}
                  type="button"
                  variant="outline"
                >
                  {decisionButtonContent(pendingDecisionAction, "mark_ocr_noise", copy.decisions.ocrNoise)}
                </Button>
                <Button
                  disabled={decisionPending}
                  onClick={() => onDecision("mark_uncertain")}
                  type="button"
                  variant="outline"
                >
                  {decisionButtonContent(pendingDecisionAction, "mark_uncertain", copy.decisions.uncertain)}
                </Button>
                <Button disabled={decisionPending} onClick={() => onDecision("ignore")} type="button" variant="ghost">
                  {decisionButtonContent(pendingDecisionAction, "ignore", copy.decisions.ignore)}
                </Button>
              </div>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
