import type { ReactNode } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findWordBoundaryMatch(snippet: string, token: string) {
  if (!token) {
    return null;
  }

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}\\p{M}_])(${escapeRegExp(token)})(?![\\p{L}\\p{N}\\p{M}_])`,
    "iu",
  );
  const match = pattern.exec(snippet);
  if (!match || match.index === undefined) {
    return null;
  }

  return {
    start: match.index,
    end: match.index + match[0].length,
  };
}

function findWordBoundaryMatchNear(snippet: string, token: string, expectedStart: number) {
  if (!token) {
    return null;
  }

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}\\p{M}_])(${escapeRegExp(token)})(?![\\p{L}\\p{N}\\p{M}_])`,
    "giu",
  );

  let closest: { start: number; end: number } | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const match of snippet.matchAll(pattern)) {
    const start = match.index ?? -1;
    if (start < 0) {
      continue;
    }

    const end = start + match[0].length;
    const distance = Math.abs(start - expectedStart);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = { start, end };
    }
  }

  return closest;
}

type HighlightContextSnippetOptions = {
  snippet: string;
  token: string;
  highlightStart?: number | null;
  highlightEnd?: number | null;
};

export function highlightContextSnippet({
  snippet,
  token,
  highlightStart,
  highlightEnd,
}: HighlightContextSnippetOptions): ReactNode {
  if (!snippet) {
    return null;
  }

  let start = highlightStart ?? null;
  let end = highlightEnd ?? null;

  if (
    start === null
    || end === null
    || end <= start
    || start < 0
    || end > snippet.length
    || snippet.slice(start, end) !== token
  ) {
    const fallback =
      start !== null && start >= 0
        ? findWordBoundaryMatchNear(snippet, token, start)
        : findWordBoundaryMatch(snippet, token);
    if (!fallback) {
      return snippet;
    }
    start = fallback.start;
    end = fallback.end;
  }

  return (
    <>
      {snippet.slice(0, start)}
      <strong className="font-semibold text-foreground">{snippet.slice(start, end)}</strong>
      {snippet.slice(end)}
    </>
  );
}

export function highlightTermsInText(text: string, terms: Array<string | null | undefined>): ReactNode {
  if (!text) {
    return null;
  }

  const uniqueTerms = Array.from(
    new Set(
      terms
        .map((term) => term?.trim())
        .filter((term): term is string => Boolean(term)),
    ),
  ).sort((left, right) => right.length - left.length);

  if (!uniqueTerms.length) {
    return text;
  }

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}\\p{M}_])(${uniqueTerms.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}\\p{M}_])`,
    "giu",
  );
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? -1;
    if (start < 0) {
      continue;
    }
    const value = match[0];
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <strong className="font-semibold text-foreground" key={`${start}-${matchIndex}`}>
        {value}
      </strong>,
    );
    lastIndex = start + value.length;
    matchIndex += 1;
  }

  if (!parts.length) {
    return text;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
