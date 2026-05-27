"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  DiscoveryCandidateSheet,
  type DecisionOptions,
  type PendingDecisionAction,
} from "@/components/discovery/discovery-candidate-sheet";
import { DiscoveryCandidatesTable } from "@/components/discovery/discovery-candidates-table";
import { DiscoveryLoadingState } from "@/components/discovery/discovery-loading-state";
import { DiscoverySummaryPanel } from "@/components/discovery/discovery-summary-panel";
import { AppShell } from "@/components/layout/app-shell";
import { HeaderActionButton, HeaderActionLink, HeaderActions } from "@/components/layout/header-actions";
import { useJob } from "@/lib/hooks/use-job";
import { useDocument } from "@/lib/hooks/use-document";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import {
  useDecideDocumentDiscoveryCandidate,
  useDocumentDiscoveryCandidate,
  useDocumentDiscoveryCandidates,
  useDocumentDiscoverySummary,
  useStartDocumentDiscoveryBuild,
  useStartDocumentReferenceEvidenceUpdate,
} from "@/lib/hooks/use-document-discovery";
import { useStartAndRedirect } from "@/lib/hooks/use-start-and-redirect";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import type { DiscoveryCandidate } from "@/lib/types/api";
import { JOB_POLL_INTERVAL_MS, ROUTES, TABLE_PAGE_SIZE_OPTIONS } from "@/lib/utils/constants";
import { groupProviderEvidence, loadingStageKey, needsReferenceUpdate, pieLemmaFromMorphology } from "@/lib/utils/discovery";
import { titleFromDocument } from "@/lib/utils/format";

export default function DocumentDiscoveryPage() {
  const params = useParams<{ locale: string; documentId: string }>();
  const documentId = params.documentId;
  const { handleAcceptedStart, handleStartError } = useStartAndRedirect();
  const { href, locale, messages } = useI18n();
  const { isAdmin } = useAuthSession();
  const copy = messages.documentDiscovery;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZE_OPTIONS[1] ?? 20);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [candidateType, setCandidateType] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState("");
  const [reviewStatus, setReviewStatus] = useState("unreviewed");
  const [includeSuppressed, setIncludeSuppressed] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [lexemeCanonicalForm, setLexemeCanonicalForm] = useState("");
  const [lexemeDefinition, setLexemeDefinition] = useState("");
  const [pendingDecisionAction, setPendingDecisionAction] = useState<PendingDecisionAction | null>(null);
  const [showTechnicalEvidence, setShowTechnicalEvidence] = useState(false);
  const autoBuildRequestedRef = useRef(false);

  const documentQuery = useDocument(documentId);
  const documentStatus = documentQuery.data?.status;
  const isDocumentProcessing = Boolean(
    documentStatus && ["uploaded", "queued", "processing"].includes(documentStatus),
  );
  const summaryQuery = useDocumentDiscoverySummary(
    documentId,
    documentQuery.isSuccess,
    (query) => {
      const buildStatus = query.state.data?.latest_build?.status;
      const isBuildActive = Boolean(buildStatus && ["queued", "running"].includes(buildStatus));
      return isBuildActive || isDocumentProcessing ? JOB_POLL_INTERVAL_MS : false;
    },
  );
  const isBuildActive = Boolean(
    summaryQuery.data?.latest_build?.status &&
      ["queued", "running"].includes(summaryQuery.data.latest_build.status),
  );
  const candidatesQuery = useDocumentDiscoveryCandidates(
    documentId,
    {
      search: search || undefined,
      candidate_type: candidateType || undefined,
      resolution_status: resolutionStatus || undefined,
      review_status: reviewStatus || undefined,
      include_suppressed: includeSuppressed,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      sort: "interest_score_desc",
    },
    documentQuery.isSuccess,
    isBuildActive ? JOB_POLL_INTERVAL_MS : false,
  );
  const selectedCandidateQuery = useDocumentDiscoveryCandidate(documentId, selectedCandidateId, {
    includeTechnical: isAdmin || showTechnicalEvidence,
    includeRawPayload: isAdmin,
  });
  const buildMutation = useStartDocumentDiscoveryBuild(documentId);
  const referenceUpdateMutation = useStartDocumentReferenceEvidenceUpdate(documentId);
  const decisionMutation = useDecideDocumentDiscoveryCandidate(documentId);

  const latestDocumentJobId = documentQuery.data?.latest_job_id ?? "";
  const latestDocumentJobQuery = useJob(latestDocumentJobId, {
    enabled: Boolean(latestDocumentJobId && isDocumentProcessing),
  });
  const shouldAutoStartBuild = Boolean(
    documentStatus === "completed" &&
      summaryQuery.isSuccess &&
      !summaryQuery.data?.latest_build &&
      !buildMutation.isPending,
  );
  const candidates = candidatesQuery.data?.items ?? [];
  const total = candidatesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isSummaryLoading = !summaryQuery.data && (
    documentQuery.isLoading ||
    summaryQuery.isLoading ||
    summaryQuery.isFetching
  );
  const isCandidatesLoading = !candidatesQuery.data && (
    documentQuery.isLoading ||
    documentQuery.isSuccess ||
    candidatesQuery.isLoading ||
    candidatesQuery.isFetching
  );
  const isQueuePreparing =
    isDocumentProcessing ||
    shouldAutoStartBuild ||
    buildMutation.isPending ||
    isBuildActive;
  const selectedCandidate = selectedCandidateQuery.data?.candidate ?? null;
  const selectedCandidateDetail = selectedCandidateQuery.data;
  const candidateTypeOptions = Object.keys(summaryQuery.data?.by_candidate_type ?? {}).sort();
  const resolutionOptions = Object.keys(summaryQuery.data?.by_resolution_status ?? {}).sort();
  const reviewOptions = Array.from(
    new Set(["unreviewed", "reviewed", ...Object.keys(summaryQuery.data?.by_review_status ?? {})]),
  ).sort();
  const staleReferenceStates = isAdmin
    ? (summaryQuery.data?.reference_evidence_states ?? []).filter(needsReferenceUpdate)
    : [];
  const providerEvidence = selectedCandidateDetail?.provider_evidence ?? [];
  const { visibleEvidenceSections, linguistEvidence } = groupProviderEvidence(providerEvidence);
  const pieLemma = pieLemmaFromMorphology(selectedCandidateDetail?.morphology);
  const latestBuild = summaryQuery.data?.latest_build ?? null;
  const activeBuild = latestBuild && ["queued", "running"].includes(latestBuild.status) ? latestBuild : null;
  const loadingStageCode =
    activeBuild?.current_stage_code ??
    (buildMutation.isPending || shouldAutoStartBuild ? "discovery_pending" : null) ??
    latestDocumentJobQuery.data?.current_stage_code ??
    documentStatus;
  const loadingStage = copy.loadingStages[loadingStageKey(loadingStageCode, documentStatus)] ?? copy.loadingStages.default;
  const loadingStageLabel =
    activeBuild?.current_stage_label ?? latestDocumentJobQuery.data?.current_stage_label ?? null;
  const loadingStageMessage =
    activeBuild?.stage_message_user ?? latestDocumentJobQuery.data?.stage_message_user ?? null;
  const loadingProgress =
    activeBuild?.progress_percent ?? latestDocumentJobQuery.data?.progress_percent ?? null;
  const boundedLoadingProgress =
    typeof loadingProgress === "number"
      ? Math.max(0, Math.min(100, Math.round(loadingProgress)))
      : null;

  useEffect(() => {
    if (!shouldAutoStartBuild || autoBuildRequestedRef.current) {
      return;
    }

    autoBuildRequestedRef.current = true;
    buildMutation.mutate(undefined, {
      onError(error) {
        autoBuildRequestedRef.current = false;
        handleStartError(copy.buildFailedTitle, error);
      },
    });
  }, [buildMutation, copy.buildFailedTitle, handleStartError, shouldAutoStartBuild]);

  async function handleBuild() {
    try {
      const response = await buildMutation.mutateAsync();
      handleAcceptedStart({
        title: copy.buildQueuedTitle,
        description: copy.buildQueuedDescription,
        path: `${ROUTES.jobs}/${response.job_id}`,
        redirect: false,
      });
    } catch (error) {
      handleStartError(copy.buildFailedTitle, error);
    }
  }

  async function handleDecision(
    decision: PendingDecisionAction,
    options: DecisionOptions = {},
    pendingAction: PendingDecisionAction = decision,
  ) {
    if (!selectedCandidate) {
      return;
    }
    setPendingDecisionAction(pendingAction);
    try {
      const response = await decisionMutation.mutateAsync({
        candidateId: selectedCandidate.id,
        request: { decision, note: note || null, ...options },
      });
      setNote(response.candidate.reviewer_note ?? "");
      if (response.candidate.review_status === "reviewed") {
        setSelectedCandidateId(null);
        setLexemeCanonicalForm("");
        setLexemeDefinition("");
      }
      toast.success(copy.decisionSaved);
    } catch (error) {
      toast.error(copy.decisionFailed, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPendingDecisionAction(null);
    }
  }

  async function handleCreateLexeme(canonicalForm: string, pendingAction: PendingDecisionAction = "create_lexeme") {
    const cleanedCanonicalForm = canonicalForm.trim();
    if (!cleanedCanonicalForm) {
      toast.error("Canonical form is required.");
      return;
    }
    await handleDecision(
      "create_lexeme",
      {
        create_lexeme_canonical_form: cleanedCanonicalForm,
        create_lexeme_definition: lexemeDefinition.trim() || null,
      },
      pendingAction,
    );
  }

  async function handleReferenceUpdate(referenceSourceId: string) {
    try {
      const response = await referenceUpdateMutation.mutateAsync(referenceSourceId);
      handleAcceptedStart({
        title: "Reference evidence update queued",
        description: "This document will be checked against the imported reference dataset locally.",
        path: `${ROUTES.jobs}/${response.job_id}`,
        redirect: false,
      });
    } catch (error) {
      handleStartError("Reference evidence update failed", error);
    }
  }

  function handleViewCandidate(candidate: DiscoveryCandidate) {
    setSelectedCandidateId(candidate.id);
    setNote(candidate.reviewer_note ?? "");
    setLexemeCanonicalForm(candidate.canonical_form_candidate || candidate.normalized_form);
    setLexemeDefinition("");
    setShowTechnicalEvidence(false);
  }

  function handleCloseCandidateSheet() {
    setSelectedCandidateId(null);
    setNote("");
    setLexemeCanonicalForm("");
    setLexemeDefinition("");
    setPendingDecisionAction(null);
    setShowTechnicalEvidence(false);
  }

  return (
    <AppShell
      title={copy.title}
      description={documentQuery.data ? titleFromDocument(documentQuery.data) : copy.description}
      actions={
        <HeaderActions>
          <HeaderActionLink direction="back" href={href(`${ROUTES.documents}/${documentId}`)}>
            {copy.backToDocument}
          </HeaderActionLink>
          {isAdmin ? (
            <HeaderActionButton disabled={buildMutation.isPending} onClick={handleBuild} type="button">
              <RefreshCw className={buildMutation.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {buildMutation.isPending ? copy.building : copy.build}
            </HeaderActionButton>
          ) : null}
        </HeaderActions>
      }
    >
      <div className="space-y-6">
        <DiscoverySummaryPanel
          candidateType={candidateType}
          candidateTypeOptions={candidateTypeOptions}
          copy={copy}
          draftSearch={draftSearch}
          includeSuppressed={includeSuppressed}
          isAdmin={isAdmin}
          isLoading={isSummaryLoading}
          locale={locale}
          onCandidateTypeChange={(value) => {
            setCandidateType(value);
            setPage(1);
          }}
          onDraftSearchChange={setDraftSearch}
          onIncludeSuppressedChange={(value) => {
            setIncludeSuppressed(value);
            setPage(1);
          }}
          onReferenceUpdate={handleReferenceUpdate}
          onResolutionStatusChange={(value) => {
            setResolutionStatus(value);
            setPage(1);
          }}
          onReviewStatusChange={(value) => {
            setReviewStatus(value);
            setPage(1);
          }}
          onSearchSubmit={() => {
            setPage(1);
            setSearch(draftSearch.trim());
          }}
          referenceUpdatePending={referenceUpdateMutation.isPending}
          resolutionOptions={resolutionOptions}
          resolutionStatus={resolutionStatus}
          reviewOptions={reviewOptions}
          reviewStatus={reviewStatus}
          searchLabel={messages.common.search}
          staleReferenceStates={staleReferenceStates}
          summary={summaryQuery.data}
        />

        {isQueuePreparing ? (
          <DiscoveryLoadingState
            boundedProgress={boundedLoadingProgress}
            description={loadingStageMessage ?? loadingStage.description}
            locale={locale}
            progressLabel={copy.loadingProgressLabel}
            stageLabel={loadingStageLabel ?? copy.loadingTitle}
            title={loadingStage.title}
          />
        ) : (
          <DiscoveryCandidatesTable
            candidates={candidates}
            copy={copy}
            currentPage={page}
            errorMessage={candidatesQuery.error?.message}
            isAdmin={isAdmin}
            isFetching={isCandidatesLoading || candidatesQuery.isFetching}
            locale={locale}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            onViewCandidate={handleViewCandidate}
            pageSize={pageSize}
            totalPages={totalPages}
          />
        )}
      </div>

      <DiscoveryCandidateSheet
        candidateDetail={selectedCandidateDetail}
        copy={copy}
        decisionPending={decisionMutation.isPending}
        documentId={documentId}
        href={href}
        isAdmin={isAdmin}
        isDetailFetching={selectedCandidateQuery.isFetching}
        isDetailLoading={selectedCandidateQuery.isLoading}
        lexemeCanonicalForm={lexemeCanonicalForm}
        lexemeDefinition={lexemeDefinition}
        linguistEvidence={linguistEvidence}
        note={note}
        onClose={handleCloseCandidateSheet}
        onConfirmPieLemma={(lemma) => handleCreateLexeme(lemma, "confirm_pie_lemma")}
        onCreateLexeme={handleCreateLexeme}
        onDecision={handleDecision}
        onLexemeCanonicalFormChange={setLexemeCanonicalForm}
        onLexemeDefinitionChange={setLexemeDefinition}
        onNoteChange={setNote}
        onShowEvidenceDetailsChange={setShowTechnicalEvidence}
        open={Boolean(selectedCandidateId)}
        pendingDecisionAction={pendingDecisionAction}
        pieLemma={pieLemma}
        selectedCandidate={selectedCandidate}
        showEvidenceDetails={showTechnicalEvidence}
        visibleEvidenceSections={visibleEvidenceSections}
      />
    </AppShell>
  );
}
