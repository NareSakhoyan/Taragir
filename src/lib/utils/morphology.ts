import type { Messages } from "@/lib/i18n/messages";
import type {
  MorphologySettings,
  MorphologyRunStatus,
  MorphologySourceType,
  MorphologySummary,
  MorphologyValueCount,
  WordMorphologyDetail,
  WordMorphologySummary,
} from "@/lib/types/api";
import { humanizeSnakeCase } from "@/lib/utils/format";

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeValueCountEntry(value: unknown): MorphologyValueCount | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const normalizedValue =
    readString(record.value) ??
    readString(record.label) ??
    readString(record.lemma) ??
    readString(record.pos) ??
    readString(record.name);
  const count = readNumber(record.count);

  if (!normalizedValue) {
    return null;
  }

  return {
    value: normalizedValue,
    count: count ?? 0,
  };
}

function normalizeStringList(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .flatMap((value) => {
          if (typeof value === "string") {
            return value.trim() ? [value.trim()] : [];
          }

          const normalizedEntry = normalizeValueCountEntry(value);

          if (!normalizedEntry) {
            return [];
          }

          return [normalizedEntry.value];
        }),
    ),
  );
}

function normalizeValueCountList(values: unknown) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => normalizeValueCountEntry(value))
    .filter((value): value is MorphologyValueCount => Boolean(value));
}

function normalizeMorphologyStatus(value: unknown): MorphologyRunStatus | null {
  const normalized = readString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return normalized ?? null;
}

export function normalizeMorphologySettings(value: unknown): MorphologySettings | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const languageStage = readString(record.language_stage) ?? readString(record.languageStage);
  const morphologyProfile =
    readString(record.morphology_profile) ?? readString(record.morphologyProfile);
  const analyzer =
    readString(record.analyzer) ??
    readString(record.morphology_analyzer) ??
    readString(record.morphologyAnalyzer);

  if (!languageStage && !morphologyProfile && !analyzer) {
    return null;
  }

  return {
    language_stage: languageStage,
    morphology_profile: morphologyProfile,
    analyzer,
  };
}

export function normalizeMorphologySummary(
  value: unknown,
  sourceType?: MorphologySourceType,
): MorphologySummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const status =
    normalizeMorphologyStatus(record.status) ??
    normalizeMorphologyStatus(record.morphology_status) ??
    normalizeMorphologyStatus(record.run_status);
  const isEligible =
    readBoolean(record.is_eligible) ??
    readBoolean(record.eligible) ??
    readBoolean(record.morphology_eligible) ??
    readBoolean(record.supports_pie_morphology) ??
    readBoolean(record.pie_morphology_eligible) ??
    false;
  const isSupported =
    readBoolean(record.is_supported) ??
    readBoolean(record.supported) ??
    readBoolean(record.morphology_supported) ??
    readBoolean(record.supports_morphology) ??
    false;
  const explicitAvailable =
    readBoolean(record.is_available) ??
    readBoolean(record.available) ??
    readBoolean(record.morphology_available);
  const analyzedOccurrenceCount =
    readNumber(record.analyzed_occurrence_count) ??
    readNumber(record.analyzed_count) ??
    readNumber(record.occurrences_analyzed);
  const completedCount =
    readNumber(record.completed_count) ??
    readNumber(record.completed_occurrence_count);
  const skippedCount = readNumber(record.skipped_count);
  const failedCount = readNumber(record.failed_count);
  const distinctLemmaCount =
    readNumber(record.distinct_lemma_count) ??
    readNumber(record.lemma_count) ??
    readNumber(record.distinct_lemmas);
  const hasMeaningfulData =
    explicitAvailable != null ||
    Boolean(status) ||
    analyzedOccurrenceCount != null ||
    completedCount != null ||
    skippedCount != null ||
    failedCount != null ||
    distinctLemmaCount != null ||
    isEligible ||
    isSupported;

  if (!hasMeaningfulData) {
    return null;
  }

  return {
    source_type:
      sourceType ??
      (readString(record.source_type) as MorphologySourceType | null) ??
      null,
    is_eligible: isEligible,
    is_supported: isSupported,
    is_available: explicitAvailable ?? status === "completed",
    status,
    analyzed_occurrence_count: analyzedOccurrenceCount,
    completed_count: completedCount,
    skipped_count: skippedCount,
    failed_count: failedCount,
    distinct_lemma_count: distinctLemmaCount,
  };
}

export function normalizeWordMorphologySummary(value: unknown): WordMorphologySummary | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const bestLemma =
    readString(record.best_lemma) ??
    readString(record.lemma) ??
    readString(record.lemma_display);
  const bestPos =
    readString(record.best_pos) ??
    readString(record.pos);
  const lemmaCandidates = normalizeStringList(record.lemma_candidates ?? record.lemmas ?? record.candidate_lemmas);
  const posCandidates = normalizeStringList(record.pos_candidates ?? record.pos_tags ?? record.candidate_pos);
  const status =
    normalizeMorphologyStatus(record.status) ??
    normalizeMorphologyStatus(record.morphology_status);
  const explicitAvailable =
    readBoolean(record.available) ??
    readBoolean(record.is_available) ??
    readBoolean(record.morphology_available);
  const normalizedPosCandidates = bestPos && !posCandidates.includes(bestPos)
    ? [bestPos, ...posCandidates]
    : posCandidates;
  const normalizedLemmaCandidates = bestLemma && !lemmaCandidates.includes(bestLemma)
    ? [bestLemma, ...lemmaCandidates]
    : lemmaCandidates;
  const hasMeaningfulData =
    explicitAvailable != null ||
    Boolean(status) ||
    Boolean(bestLemma) ||
    normalizedLemmaCandidates.length > 0 ||
    normalizedPosCandidates.length > 0;

  if (!hasMeaningfulData) {
    return null;
  }

  return {
    available: explicitAvailable ?? status === "completed",
    status,
    best_lemma: bestLemma,
    lemma_candidates: normalizedLemmaCandidates,
    pos_candidates: normalizedPosCandidates,
  };
}

export function normalizeWordMorphologyDetail(value: unknown): WordMorphologyDetail | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const normalizedForm =
    readString(record.normalized_form) ??
    readString(record.normalized_token) ??
    readString(record.normalizedForm);
  const analyzedOccurrenceCount =
    readNumber(record.analyzed_occurrence_count) ??
    readNumber(record.analyzed_count) ??
    readNumber(record.total_analyzed);
  const completedCount =
    readNumber(record.completed_count) ??
    readNumber(record.completed_occurrence_count);
  const skippedCount = readNumber(record.skipped_count);
  const failedCount = readNumber(record.failed_count);
  const lemmaCandidates = normalizeValueCountList(record.lemma_candidates);
  const posDistribution = normalizeValueCountList(
    record.pos_distribution ?? record.pos_candidates ?? record.pos_summaries,
  );
  const morphFeatureRecord = asRecord(
    record.morph_feature_summaries ?? record.morph_features ?? record.feature_summaries,
  );
  const morphFeatureSummaries = Object.fromEntries(
    Object.entries(morphFeatureRecord ?? {})
      .map(([featureName, entries]) => [featureName, normalizeValueCountList(entries)])
      .filter(([, entries]) => entries.length),
  );
  const hasMeaningfulData =
    Boolean(normalizedForm) ||
    analyzedOccurrenceCount != null ||
    completedCount != null ||
    skippedCount != null ||
    failedCount != null ||
    lemmaCandidates.length > 0 ||
    posDistribution.length > 0 ||
    Object.keys(morphFeatureSummaries).length > 0;

  if (!hasMeaningfulData) {
    return null;
  }

  return {
    normalized_form: normalizedForm,
    analyzed_occurrence_count: analyzedOccurrenceCount,
    completed_count: completedCount,
    skipped_count: skippedCount,
    failed_count: failedCount,
    lemma_candidates: lemmaCandidates,
    pos_distribution: posDistribution,
    morph_feature_summaries: morphFeatureSummaries,
  };
}

export function hasMorphologySupport(summary: MorphologySummary | null | undefined) {
  return Boolean(
    summary &&
      (summary.is_eligible || summary.is_supported || summary.is_available || summary.status),
  );
}

export function formatMorphologyStatus(status: MorphologyRunStatus | null | undefined, messages: Messages) {
  switch (status) {
    case "not_analyzed":
      return messages.morphology.status.notAnalyzed;
    case "queued":
      return messages.status.queued;
    case "running":
      return messages.status.running;
    case "completed":
      return messages.status.completed;
    case "skipped":
      return messages.morphology.status.skipped;
    case "failed":
      return messages.status.failed;
    default:
      return status ? humanizeSnakeCase(status) : "—";
  }
}

export function getMorphologyEmptyLabel(
  summary:
    | Pick<MorphologySummary, "status">
    | Pick<WordMorphologySummary, "status">
    | null
    | undefined,
  messages: Messages,
) {
  switch (summary?.status) {
    case "skipped":
      return messages.morphology.empty.skipped;
    case "failed":
      return messages.morphology.empty.failed;
    default:
      return messages.morphology.empty.notAnalyzed;
  }
}
