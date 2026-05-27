import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, getIntlLocale } from "@/lib/i18n/config";
import type {
  DocumentRead,
  ReferenceImportMethod,
  ReferenceMatchType,
  ReferenceMatchingRunScope,
} from "@/lib/types/api";

export function formatDate(value: string | null | undefined, locale: Locale = defaultLocale) {
  if (!value) {
    return "—";
  }

  const dateFormatter = new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return dateFormatter.format(new Date(value));
}

export function formatNumber(value: number | null | undefined, locale: Locale = defaultLocale) {
  if (value == null) {
    return "0";
  }

  const numberFormatter = new Intl.NumberFormat(getIntlLocale(locale));
  return numberFormatter.format(value);
}

export function formatBytes(value: number | null | undefined, locale: Locale = defaultLocale) {
  if (!value) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatted = new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: size >= 10 || unitIndex === 0 ? 0 : 1,
    minimumFractionDigits: size >= 10 || unitIndex === 0 ? 0 : 1,
  }).format(size);

  return `${formatted} ${units[unitIndex]}`;
}

export function titleFromDocument(document: DocumentRead) {
  return document.title?.trim() || document.original_filename;
}

export function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function truncateText(value: string, maxLength = 160) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function humanizeSnakeCase(value: string) {
  if (!value) {
    return value;
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join(" ");
}

const PART_OF_SPEECH_LABELS = {
  adj: { en: "Adjective", hy: "Ածական" },
  adp: { en: "Adposition", hy: "Կապ" },
  adv: { en: "Adverb", hy: "Մակբայ" },
  adb: { en: "Adverb", hy: "Մակբայ" },
  aux: { en: "Auxiliary verb", hy: "Օժանդակ բայ" },
  cconj: { en: "Coordinating conjunction", hy: "Համադասական շաղկապ" },
  conj: { en: "Conjunction", hy: "Շաղկապ" },
  det: { en: "Determiner", hy: "Որոշիչ" },
  intj: { en: "Interjection", hy: "Ձայնարկություն" },
  noun: { en: "Noun", hy: "Գոյական" },
  num: { en: "Numeral", hy: "Թվական" },
  part: { en: "Particle", hy: "Մասնիկ" },
  pron: { en: "Pronoun", hy: "Դերանուն" },
  propn: { en: "Proper noun", hy: "Հատուկ գոյական" },
  punct: { en: "Punctuation", hy: "Կետադրություն" },
  sconj: { en: "Subordinating conjunction", hy: "Ստորադասական շաղկապ" },
  sym: { en: "Symbol", hy: "Նշան" },
  verb: { en: "Verb", hy: "Բայ" },
  x: { en: "Other", hy: "Այլ" },
} satisfies Record<string, Record<Locale, string>>;

type PartOfSpeechKey = keyof typeof PART_OF_SPEECH_LABELS;

const PART_OF_SPEECH_ALIASES: Record<string, PartOfSpeechKey> = {
  a: "adj",
  adjective: "adj",
  adverb: "adv",
  article: "det",
  coordinating_conjunction: "cconj",
  interjection: "intj",
  n: "noun",
  numeral: "num",
  particle: "part",
  prep: "adp",
  preposition: "adp",
  proper_noun: "propn",
  prt: "part",
  subordinating_conjunction: "sconj",
  v: "verb",
};

export function formatPartOfSpeech(value: string, locale: Locale = defaultLocale) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const labelKey: PartOfSpeechKey | undefined = Object.hasOwn(PART_OF_SPEECH_LABELS, normalized)
    ? (normalized as PartOfSpeechKey)
    : PART_OF_SPEECH_ALIASES[normalized];

  if (labelKey) {
    return PART_OF_SPEECH_LABELS[labelKey][locale];
  }

  return humanizeSnakeCase(value);
}

export function formatPercent(
  value: number | null | undefined,
  locale: Locale = defaultLocale,
  maximumFractionDigits = 1,
) {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "percent",
    maximumFractionDigits,
  }).format(value);
}

export function formatReferenceMatchType(value: ReferenceMatchType) {
  switch (value) {
    case "exact":
      return "Exact";
    case "normalized":
      return "Normalized";
    case "fuzzy":
      return "Fuzzy";
    default:
      return humanizeSnakeCase(value);
  }
}

export function formatReferenceMatchingRunScope(value: ReferenceMatchingRunScope) {
  switch (value) {
    case "lexicon_groups":
      return "Lexicon groups";
    case "lexemes":
      return "Lexemes";
    case "all":
      return "All";
    default:
      return humanizeSnakeCase(value);
  }
}

export function formatReferenceImportMethod(value: ReferenceImportMethod | null | undefined) {
  switch (value) {
    case "txt":
      return "TXT";
    case "csv":
      return "CSV";
    case "docx":
      return "DOCX";
    case "pdf_text":
      return "PDF (text extraction)";
    case "pdf_ocr":
      return "PDF (OCR)";
    case "xlsx":
      return "XLSX";
    case null:
    case undefined:
    case "":
      return "—";
    default:
      return humanizeSnakeCase(value);
  }
}

export function isOcrReferenceImportMethod(value: ReferenceImportMethod | null | undefined) {
  return value === "pdf_ocr";
}
