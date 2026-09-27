/** Small HTML string helpers shared by the renderers. */

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Visible text of an HTML fragment, whitespace collapsed. */
export function textContent(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_m, name) => ENTITIES[name])
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut text at a word boundary so meta descriptions never end mid-word. */
export function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/[\s,;:.–—-]+\S*$/, "")}…`;
}

/** The first sentence of a paragraph, for compact summaries. */
export function firstSentence(text) {
  const [first] = new Intl.Segmenter("en", { granularity: "sentence" }).segment(text);
  return first?.segment.trim() || text;
}
