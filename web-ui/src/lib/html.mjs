import { escapeHtml } from "../shared/escape.mjs";

export { escapeHtml };

/** Tagged template that escapes every interpolated value unless it is `raw()` markup. */
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, index) => {
    out += render(value) + strings[index + 1];
  });
  return new Raw(out);
}

class Raw {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

/** Mark trusted, already-rendered markup so `html` inserts it verbatim. */
export const raw = (value) => new Raw(String(value));

function render(value) {
  if (value === null || value === undefined || value === false) return "";
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  return escapeHtml(value);
}

const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });

/** Sentences of a paragraph, trimmed. */
export function sentences(text) {
  return [...segmenter.segment(text)].map(({ segment }) => segment.trim()).filter(Boolean);
}

/**
 * Whole sentences from `list`, starting at `start`, that fit in `max`
 * characters together. Meta descriptions are built this way so they never
 * end mid-sentence; returns the text and the index after the last sentence used.
 */
export function fitSentences(list, max, start = 0) {
  let text = "";
  let end = start;
  for (; end < list.length; end += 1) {
    const next = text ? `${text} ${list[end]}` : list[end];
    if (next.length > max) break;
    text = next;
  }
  return { text, end };
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
