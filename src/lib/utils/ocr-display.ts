const ARMENIAN_OR_LATIN_LETTER = /[A-Za-z\u0531-\u0556\u0561-\u0587]/;
const ARMENIAN_LETTER = /[\u0531-\u0556\u0561-\u0587]/;
const WORD_LIKE_TOKEN = /[A-Za-z\u0531-\u0556\u0561-\u0587]{2,}/g;
const SYMBOL_NOISE = /^[\s\d.,:;!?'"`~^_*+=|/\\<>{}()[\]«»“”‘’\-–—…·•°]+$/;
const REPEATED_NOISE = /^(.)(\1|\s){4,}$/;

function normalizeOcrLine(line: string) {
  return line
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\s+([.,:;!?»”’])/g, "$1")
    .replace(/([«“‘])\s+/g, "$1")
    .trim();
}

function isNoiseLine(line: string) {
  const compact = line.replace(/\s/g, "");

  if (!compact) {
    return false;
  }

  if (compact.length <= 3 && !ARMENIAN_OR_LATIN_LETTER.test(compact)) {
    return true;
  }

  if (/^\d{1,4}$/.test(compact)) {
    return true;
  }

  if (SYMBOL_NOISE.test(line)) {
    return true;
  }

  if (REPEATED_NOISE.test(compact)) {
    return true;
  }

  const words = line.match(WORD_LIKE_TOKEN) ?? [];
  if (!ARMENIAN_LETTER.test(line) && words.length === 0 && compact.length < 12) {
    return true;
  }

  return false;
}

export function cleanOcrTextForDisplay(text: string) {
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[\f\v]/g, "\n")
    .replace(/([\u0531-\u0556\u0561-\u0587])[-¬]\n([\u0531-\u0556\u0561-\u0587])/g, "$1$2");

  const lines = normalized
    .split("\n")
    .map(normalizeOcrLine)
    .filter((line) => !isNoiseLine(line));

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
