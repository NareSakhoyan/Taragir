import type { DiscoveryCandidate, DiscoveryEvidenceItem, DocumentReferenceEvidenceState } from "@/lib/types/api";

export function evidenceLabel(candidate: DiscoveryCandidate) {
  const summary = candidate.best_evidence_summary ?? {};
  const provider = typeof summary.provider_key === "string" ? summary.provider_key : null;
  const matchType = typeof summary.match_type === "string" ? strictEvidenceLabel(summary.match_type) : null;
  const validation = typeof summary.validation_strength === "string" ? summary.validation_strength : null;
  return [matchType, provider, validation].filter(Boolean).join(" / ") || "No validating evidence";
}

export function evidenceLine(item: DiscoveryEvidenceItem) {
  const matched = item.result_headword || item.matched_form || item.lemma || "—";
  return `${strictEvidenceLabel(item.match_type)} • ${evidenceRoleLabel(item.evidence_role || item.role)} • ${matched} • ${validationLabel(item.validation_strength)}`;
}

export function strictEvidenceLabel(matchType: string) {
  const labels: Record<string, string> = {
    exact_headword_match: "Exact dictionary match",
    exact_lemma_match: "Resolved by lemma",
    canonical_variant_match: "Canonical variant",
    corpus_attestation_exact: "Corpus attestation",
    corpus_attestation_lemma: "Corpus lemma attestation",
    morphology_analysis_only: "Morphology only",
    named_entity_surface_match: "Named entity surface",
    fuzzy_ocr_candidate: "Fuzzy OCR suggestion",
    substring_match: "Substring / does not validate",
    partial_match: "Partial / does not validate",
    ambiguous_search_result: "Ambiguous search result",
    rejected_artifact: "Rejected OCR artifact",
  };
  return labels[matchType] ?? matchType;
}

export function candidateTypeLabel(value: string) {
  const labels: Record<string, string> = {
    needs_linguist_research: "Needs research",
    poorly_defined: "Poorly defined",
    attested_needs_definition: "Attested but not defined",
    possible_ocr_noise: "Possible OCR noise",
    probable_ocr_noise: "Probable OCR noise",
    known_suppressed: "Known in internal lexicon",
    attested_suppressed: "Attested but not defined",
    noise_suppressed: "Probable OCR noise",
    unknown_plausible: "Needs research",
    named_entity_candidate: "Possible named entity",
    conflicting_sources: "Conflicting evidence",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function resolutionStatusLabel(value: string) {
  const labels: Record<string, string> = {
    needs_linguist_research: "Needs research",
    poorly_defined: "Poorly defined",
    attested_in_corpus: "Attested but not defined",
    possible_ocr_noise: "Possible OCR noise",
    probable_ocr_noise: "Probable OCR noise",
    resolved_by_dictionary: "Resolved by dictionary",
    resolved_by_lemma: "Resolved by lemma",
    resolved_known: "Known in internal lexicon",
    possible_named_entity: "Possible named entity",
    conflicting_sources: "Conflicting evidence",
    unknown_plausible: "Needs research",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function suggestedAction(candidate: DiscoveryCandidate) {
  const status = candidate.resolution_status;
  if (status === "poorly_defined" || status === "attested_in_corpus") {
    return "Check lexical sources and add or improve a definition.";
  }
  if (status === "possible_ocr_noise" || status === "probable_ocr_noise") {
    return "Inspect the OCR context before rejecting or correcting the form.";
  }
  if (status === "resolved_by_lemma") {
    return "Confirm the lemma relationship and link the lexeme if useful.";
  }
  if (status === "conflicting_sources") {
    return "Compare the sources and record the preferred analysis.";
  }
  if (status === "possible_named_entity") {
    return "Check whether this is a person, organization, or place name before linking or dismissing it.";
  }
  return "Research the form, then mark it known, interesting, uncertain, or OCR noise.";
}

export function evidenceRoleLabel(value: string) {
  const labels: Record<string, string> = {
    curated_lexicon: "Internal lexicon",
    imported_reference: "Imported dictionary/reference",
    corpus_attestation: "Corpus attestation",
    web_dictionary: "Dictionary",
    morphology_analysis: "DALiH/PIE morphology",
    named_entity_signal: "Named entity evidence",
    fuzzy_ocr: "OCR signal",
    fuzzy_ocr_suggestion: "Fuzzy OCR suggestion",
    ambiguous_external: "Context-only source",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function validationLabel(value: string) {
  const labels: Record<string, string> = {
    validates_word: "validates word",
    supports_word: "supports word",
    suggests_candidate: "suggests candidate",
    does_not_validate: "does not validate",
    rejects: "rejects",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function reviewStatusLabel(value: string) {
  const labels: Record<string, string> = {
    unreviewed: "Needs review",
    reviewed: "Reviewed",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

export function needsReferenceUpdate(state: DocumentReferenceEvidenceState) {
  return ["never_checked", "stale", "failed"].includes(state.status);
}

export function loadingStageKey(stageCode?: string | null, documentStatus?: string | null) {
  const normalized = stageCode || documentStatus || "";

  switch (normalized) {
    case "uploaded":
    case "queued":
      return "queued";
    case "loading_source_file":
      return "loadingSource";
    case "extracting_pages":
      return "extractingPages";
    case "ocr_processing":
    case "running_ocr":
      return "readingImages";
    case "extracting_text":
    case "reconstructing_text":
      return "cleaningText";
    case "storing_occurrences":
      return "collectingWords";
    case "morphology_pending":
    case "loading_scope":
    case "checking_eligibility":
    case "morphology_running":
    case "morphology_done":
      return "morphology";
    case "discovery_pending":
      return "discoveryPending";
    case "discovery_running":
      return "discoveryRunning";
    case "saving_results":
    case "finalizing":
    case "ready":
      return "finalizing";
    default:
      return "default";
  }
}

export function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : null;
}

export function readBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

export function readPayloadString(item: DiscoveryEvidenceItem, key: string) {
  const value = item.payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function sourceHrefFromText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function evidenceSourceHref(item: DiscoveryEvidenceItem) {
  return (
    sourceHrefFromText(readPayloadString(item, "reference_link")) ??
    sourceHrefFromText(readPayloadString(item, "source_url")) ??
    sourceHrefFromText(readPayloadString(item, "url")) ??
    sourceHrefFromText(readPayloadString(item, "href")) ??
    sourceHrefFromText(readPayloadString(item, "link")) ??
    sourceHrefFromText(item.citation)
  );
}

export function pieLemmaFromMorphology(morphology: Record<string, unknown> | undefined) {
  const resolution = readRecord(morphology?.lexeme_resolution);
  return readString(resolution, "pie_lemma") ?? readString(resolution, "morphological_lemma");
}

export function hasLexemeResolution(morphology: Record<string, unknown> | undefined) {
  const resolution = readRecord(morphology?.lexeme_resolution);
  return [
    "surface_form",
    "pie_lemma",
    "morphological_lemma",
    "dictionary_lemma",
    "dictionary_lemma_source",
    "resolution_type",
    "confidence",
  ].some((key) => resolution[key] !== undefined && resolution[key] !== null && resolution[key] !== "");
}

export function userEvidenceSourceLabel(item: DiscoveryEvidenceItem) {
  if (
    ["curated_lexicon", "reference", "imported_dictionary", "dictionary", "external_dictionary"].includes(
      item.provider_type,
    )
  ) {
    return "Dictionary/reference";
  }
  if (item.provider_type === "corpus") {
    return "Corpus attestation";
  }
  if (item.provider_type === "morphology") {
    return "Morphology analysis";
  }
  if (item.provider_type === "ner") {
    return "Named entity signal";
  }
  if (["web_dictionary", "ambiguous_external", "external_reference"].includes(item.provider_type)) {
    return "External source";
  }
  return "Evidence";
}

export function userEvidenceMeaning(item: DiscoveryEvidenceItem) {
  if (item.validation_strength === "validates_word") {
    return "This source treats the form as a word.";
  }
  if (item.validation_strength === "supports_word") {
    return "This source attests the form, but does not by itself provide a definition.";
  }
  if (item.validation_strength === "suggests_candidate") {
    return "This source suggests a possible analysis; review it with the page context.";
  }
  if (item.validation_strength === "rejects") {
    return "This source suggests the form may be OCR noise or not a valid word.";
  }
  return "This source does not clearly validate the form as a word.";
}

export type DiscoveryEvidenceSection = {
  items: DiscoveryEvidenceItem[];
  title: string;
};

export function groupProviderEvidence(providerEvidence: DiscoveryEvidenceItem[]) {
  const lexicalEvidence = providerEvidence.filter((item) =>
    ["curated_lexicon", "reference", "imported_dictionary", "dictionary", "external_dictionary"].includes(
      item.provider_type,
    ),
  );
  const corpusEvidence = providerEvidence.filter((item) => item.provider_type === "corpus");
  const morphologyEvidence = providerEvidence.filter((item) => item.provider_type === "morphology");
  const namedEntityEvidence = providerEvidence.filter((item) => item.provider_type === "ner");
  const validationEvidence = providerEvidence.filter((item) => item.provider_type === "validation");
  const sourceEvidence = providerEvidence.filter((item) =>
    ["web_dictionary", "ambiguous_external", "external_reference"].includes(item.provider_type),
  );
  const evidenceSections: DiscoveryEvidenceSection[] = [
    { items: lexicalEvidence, title: "Lexical evidence" },
    { items: corpusEvidence, title: "Corpus evidence" },
    { items: morphologyEvidence, title: "Morphology evidence" },
    { items: namedEntityEvidence, title: "Named entity evidence" },
    { items: validationEvidence, title: "Validation evidence" },
    { items: sourceEvidence, title: "Source/page evidence" },
  ].filter(({ items }) => items.length > 0);
  const categorizedEvidence = new Set([
    ...lexicalEvidence,
    ...corpusEvidence,
    ...morphologyEvidence,
    ...namedEntityEvidence,
    ...validationEvidence,
    ...sourceEvidence,
  ]);
  const otherEvidence = providerEvidence.filter((item) => !categorizedEvidence.has(item));
  const visibleEvidenceSections = otherEvidence.length
    ? [...evidenceSections, { items: otherEvidence, title: "Other evidence" }]
    : evidenceSections;
  const linguistEvidence = providerEvidence.filter((item) => item.provider_type !== "validation");

  return { visibleEvidenceSections, linguistEvidence };
}
