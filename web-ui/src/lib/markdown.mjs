import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { repoRoot } from "./config.mjs";
import { icon } from "./icons.mjs";
import { highlight } from "./highlight.mjs";

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/* ------------------------------------------------------------------ text */

/** Markdown inline syntax removed, for text that lands in meta tags and titles. */
function stripInline(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

const isHeading = (line) => /^#{1,6}\s/.test(line);
const isBlockSyntax = (line) =>
  /^[>|]/.test(line) ||
  /^[-*+]\s/.test(line) ||
  /^\d+\.\s/.test(line) ||
  /^```/.test(line);

/**
 * The document's lead paragraph as a single line. Source READMEs hard-wrap
 * prose, so consecutive lines are joined until the paragraph ends — reading
 * only the first line would cut descriptions mid-sentence.
 */
export function leadParagraph(markdown) {
  const lines = markdown.split("\n");
  const start = lines.findIndex(isHeading);
  const paragraph = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (paragraph.length && (!line || isHeading(line) || isBlockSyntax(line)))
      break;
    if (!line || isHeading(line) || isBlockSyntax(line)) continue;
    paragraph.push(line);
  }
  return stripInline(paragraph.join(" "));
}

/** The `# ` title of a document, or a fallback when it has none. */
export function documentTitle(markdown, fallback = "tool-containers") {
  const heading = markdown.split("\n").find(isHeading);
  return heading ? stripInline(heading.replace(/^#+\s+/, "")) : fallback;
}

/** Tool descriptions from the root README catalog tables, keyed by directory. */
export function catalogDescriptions(readme) {
  const descriptions = new Map();
  for (const line of readme.split("\n")) {
    const row = line.match(/^\|\s*\[[^\]]+\]\(([^)]+)\)\s*\|\s*(.+?)\s*\|$/);
    if (!row) continue;
    const dir = row[1].replace(/^\.\//, "").replace(/\/+$/, "");
    if (dir.startsWith("tools/")) descriptions.set(dir, stripInline(row[2]));
  }
  return descriptions;
}

/* ------------------------------------------------------------- rendering */

/**
 * Rewrite repository-relative links: to a site route when the target is a
 * published page, to GitHub when it is a tracked file the site does not
 * publish, and untouched when it is external or a bare fragment.
 */
function rewriteTarget(target, sourceDir, site, image = false) {
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) return target;
  const [relative, fragment = ""] = target.split("#", 2);
  const resolved = path.posix.normalize(
    path.posix.join(sourceDir, decodeURI(relative)),
  );
  const hash = fragment ? `#${fragment}` : "";
  const page =
    site.bySource.get(resolved) ??
    site.bySource.get(`${resolved.replace(/\/$/, "")}/README.md`);
  if (page && !image) return `${site.config.href(page.route)}${hash}`;
  const absolute = path.join(repoRoot, resolved);
  if (!fs.existsSync(absolute)) return target;
  if (image) return `${site.config.repoUrl}/raw/HEAD/${resolved}${hash}`;
  return `${fs.statSync(absolute).isDirectory() ? site.config.treeUrl(resolved) : site.config.blobUrl(resolved)}${hash}`;
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "section"
  );
}

/** Stable, unique ids on headings so the TOC and deep links can target them. */
function addHeadingAnchors(html) {
  const seen = new Map();
  return html.replace(
    /<h([1-6])>([\s\S]*?)<\/h\1>/g,
    (_match, level, inner) => {
      const base = slugify(inner.replace(/<[^>]+>/g, ""));
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}">${inner}</a></h${level}>`;
    },
  );
}

/** Heading outline for the on-page table of contents. */
export function tableOfContents(html) {
  return [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map(
    (match) => ({
      level: Number(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, "").trim(),
    }),
  );
}

const LANGUAGE_LABELS = {
  shellscript: "shell",
  bash: "shell",
  dockerfile: "Dockerfile",
  yaml: "YAML",
  json: "JSON",
  text: "text",
};

function codeCard({ label, html }) {
  return `<figure class="code-card">
<figcaption class="code-head">
<span class="code-name">${escapeHtml(label)}</span>
<button type="button" class="copy-btn" data-copy aria-label="Copy code to clipboard">${icon("copy", "i-copy")}${icon("check", "i-check")}</button>
</figcaption>
<div class="code-body">${html}</div>
</figure>`;
}

/** Wrap tables so wide catalog tables scroll instead of breaking the layout. */
function wrapTables(html) {
  return html.replace(
    /<table>([\s\S]*?)<\/table>/g,
    (_match, inner) =>
      `<div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table class="doc-table">${inner}</table></div>`,
  );
}

/** Render one repository document to the HTML shown on its page. */
export async function renderDocument(markdown, { sourceDir, site, theme }) {
  const parser = new Marked({
    async: true,
    async walkTokens(token) {
      if (token.type === "link" || token.type === "image") {
        token.href = rewriteTarget(
          token.href,
          sourceDir,
          site,
          token.type === "image",
        );
      }
      if (token.type === "code") {
        const lang = (token.lang ?? "text").split(/\s+/)[0].toLowerCase();
        token.card = codeCard({
          label: LANGUAGE_LABELS[lang] ?? lang,
          html: await highlight(token.text, lang, theme),
        });
      }
    },
    renderer: {
      code(token) {
        return token.card;
      },
    },
  });
  return wrapTables(addHeadingAnchors(await parser.parse(markdown)));
}
