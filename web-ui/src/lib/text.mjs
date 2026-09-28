/** Sentence and clause helpers for descriptions derived from README prose. */

const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });

/** Sentences of a paragraph, trimmed. */
export function sentences(text) {
  return [...segmenter.segment(text)].map(({ segment }) => segment.trim()).filter(Boolean);
}

/**
 * Shorten a sentence to at most `max` characters by dropping trailing clauses
 * (split at dashes, colons, semicolons, and commas). Returns "" if even the
 * first clause is too long, so callers can fall back deliberately.
 */
export function fitClauses(sentence, max) {
  let text = sentence.replace(/[.!?]+$/, "");
  while (text.length > max) {
    const cut = Math.max(text.lastIndexOf(" — "), text.lastIndexOf(" – "), text.lastIndexOf(": "), text.lastIndexOf("; "), text.lastIndexOf(", "));
    if (cut <= 0) return "";
    text = text.slice(0, cut);
  }
  return text;
}

/**
 * Text of at most `max` characters from `list`, starting at sentence `start`,
 * that never ends mid-sentence or mid-clause: whole sentences while they fit,
 * then the leading clauses of the next one if any fit, closed with a period.
 * Returns the text and the index of the first sentence not used in full.
 */
export function fitSentences(list, max, start = 0) {
  let text = "";
  let end = start;
  for (; end < list.length; end += 1) {
    const next = text ? `${text} ${list[end]}` : list[end];
    if (next.length > max) break;
    text = next;
  }
  if (end < list.length) {
    const room = max - (text ? text.length + 1 : 0) - 1;
    const clause = room > 0 ? fitClauses(list[end], room) : "";
    if (clause) text = text ? `${text} ${clause}.` : `${clause}.`;
  }
  return { text, end };
}
