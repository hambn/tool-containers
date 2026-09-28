import { escapeHtml } from "./escape.mjs";

/**
 * The search engine shared by the search dialog, the /search/ page, the home
 * catalog filter, and the node tests. It is pure: the index goes in, ranked
 * results come out, and rendering helpers return escaped HTML.
 *
 * @typedef {object} IndexPage
 * @property {string} t  display title ("Claude Code · Helm")
 * @property {string} u  href
 * @property {string} k  page kind
 * @property {string} d  description
 * @property {string} w  keywords, use case, platform, category, and image reference
 * @property {[string, string, string][]} s sections as [heading, id, text]; the preamble has an empty id
 */

// Title beats headings beats keywords/use case beats prose.
export const WEIGHTS = { title: 10, heading: 6, keywords: 4, description: 2, prose: 1 };
const EXACT = 1;
const PREFIX = 0.75;
const TYPO = 0.5;
const TYPO_PREFIX = 0.4;
const TYPO_MIN_LENGTH = 5;
const WORD = /[\p{L}\p{N}]+/gu;

/** Lowercase and strip diacritics so "Café" matches "cafe". */
export const normalize = (text) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

/** Normalized words of a text. */
export const words = (text) => normalize(text).match(WORD) ?? [];

/** Distinct query terms, in the order typed. */
export const parseQuery = (query) => [...new Set(words(query))];

/** True when `a` becomes `b` with at most one insertion, deletion, or substitution. */
function withinOneEdit(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/**
 * How well a query term matches a word: exact, prefix (the user is still
 * typing), or one typo away for terms long enough that a typo is likely.
 * @returns {number} 0 when there is no match
 */
export function matchQuality(term, word, typos = true) {
  if (word === term) return EXACT;
  if (word.startsWith(term)) return PREFIX;
  if (!typos || term.length < TYPO_MIN_LENGTH) return 0;
  if (withinOneEdit(term, word)) return TYPO;
  if (word.length > term.length && withinOneEdit(term, word.slice(0, term.length))) return TYPO_PREFIX;
  return 0;
}

/**
 * True when every term matches some word of `text`: the home filter's
 * predicate. The filter first tries without typos and allows them only when
 * nothing matches, so "codex" never also lists every "code" row.
 */
export function matchesAll(terms, text, { typos = true } = {}) {
  const list = words(text);
  return terms.every((term) => list.some((word) => matchQuality(term, word, typos) > 0));
}

/**
 * Build a searcher over a serialized index. Words are normalized once here,
 * so the index ships each text a single time, in its display form.
 * @param {{ pages: IndexPage[] }} index
 */
export function createSearch(index) {
  const vocabulary = new Set();
  const wordSet = (text) => {
    const set = new Set(words(text));
    for (const word of set) vocabulary.add(word);
    return set;
  };
  const pages = index.pages.map((page, order) => {
    const sections = page.s.map(([heading, id, text]) => ({ heading, id, text, headingWords: wordSet(heading), textWords: wordSet(text) }));
    const union = (key) => new Set(sections.flatMap((section) => [...section[key]]));
    return {
      order,
      page,
      sections,
      fields: [
        [WEIGHTS.title, wordSet(page.t)],
        [WEIGHTS.heading, union("headingWords")],
        [WEIGHTS.keywords, wordSet(page.w)],
        [WEIGHTS.description, wordSet(page.d)],
        [WEIGHTS.prose, union("textWords")],
      ],
    };
  });

  const expansions = new Map();
  /** Every vocabulary word a term matches, with its quality. */
  const expand = (term) => {
    if (!expansions.has(term)) {
      const found = [];
      for (const word of vocabulary) {
        const quality = matchQuality(term, word);
        if (quality) found.push([word, quality]);
      }
      expansions.set(term, found);
    }
    return expansions.get(term);
  };
  const best = (matches, set, weight = 1) => {
    let score = 0;
    for (const [word, quality] of matches) if (set.has(word)) score = Math.max(score, quality * weight);
    return score;
  };

  /**
   * Pages matching every term, best first, each with the sections that also
   * match every term on their own.
   * @param {string} query
   */
  function search(query) {
    const terms = parseQuery(query);
    if (!terms.length) return { terms, results: [] };
    const matches = terms.map(expand);
    const phrase = normalize(query).trim();
    const results = [];
    for (const entry of pages) {
      let score = 0;
      for (const termMatches of matches) {
        const termScore = Math.max(...entry.fields.map(([weight, set]) => best(termMatches, set, weight)));
        if (!termScore) {
          score = 0;
          break;
        }
        score += termScore;
      }
      if (!score) continue;
      if (normalize(entry.page.t) === phrase) score += WEIGHTS.title * 2;

      // A term the page's title or keywords already satisfy need not repeat in
      // the section: "claude helm variables" finds Helm's Variables section.
      const [title, , keywords] = entry.fields;
      const pageLevel = matches.map((termMatches) => best(termMatches, title[1]) > 0 || best(termMatches, keywords[1]) > 0);
      const sections = entry.sections
        .map((section) => {
          let sectionScore = 0;
          for (const [index, termMatches] of matches.entries()) {
            const termScore = Math.max(best(termMatches, section.headingWords, 2), best(termMatches, section.textWords));
            if (!termScore && !pageLevel[index]) return null;
            sectionScore += termScore;
          }
          return sectionScore ? { section, score: sectionScore } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
      const preamble = sections.find(({ section }) => !section.id);
      results.push({
        score,
        order: entry.order,
        page: entry.page,
        // The preamble is the page itself, so it supplies the page snippet instead of a nested hit.
        text: preamble ? preamble.section.text : entry.page.d,
        sections: sections.filter(({ section }) => section.id).map(({ section }) => section),
      });
    }
    results.sort((a, b) => b.score - a.score || a.order - b.order);
    return { terms, results };
  }

  return { search, pages: index.pages };
}

/** Escaped HTML of `text` with every word matching a term wrapped in `<mark>`. */
export function highlight(text, terms) {
  if (!terms.length) return escapeHtml(text);
  let out = "";
  let last = 0;
  for (const match of text.matchAll(WORD)) {
    const word = normalize(match[0]);
    if (!terms.some((term) => matchQuality(term, word) > 0)) continue;
    out += `${escapeHtml(text.slice(last, match.index))}<mark>${escapeHtml(match[0])}</mark>`;
    last = match.index + match[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

/**
 * A highlighted excerpt of about `length` characters around the first match,
 * cut at word boundaries.
 */
export function snippet(text, terms, length = 160) {
  if (text.length <= length) return highlight(text, terms);
  let first = 0;
  for (const match of text.matchAll(WORD)) {
    if (terms.some((term) => matchQuality(term, normalize(match[0])) > 0)) {
      first = match.index;
      break;
    }
  }
  let start = Math.max(0, first - Math.floor(length / 3));
  if (start > 0) start = Math.min(first, text.indexOf(" ", start) + 1 || first);
  let end = Math.min(text.length, start + length);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > start) end = space;
  }
  const excerpt = highlight(text.slice(start, end).trim(), terms);
  return `${start > 0 ? "… " : ""}${excerpt}${end < text.length ? " …" : ""}`;
}
