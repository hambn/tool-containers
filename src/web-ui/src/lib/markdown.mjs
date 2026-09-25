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
    if (dir.startsWith("src/tools/")) descriptions.set(dir, stripInline(row[2]));
  }
  return descriptions;
}

/* ------------------------------------------------------------- rendering */

/**
 * Rewrite repository-relative links: to an in-page anchor when the target is
 * a file (or directory of files) rendered inline, to a site route when it is a
 * published page, to GitHub for any other repository path, and untouched when
 * it is external or a bare fragment.
 */
function rewriteTarget(target, sourceDir, site, anchors, image = false) {
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) return target;
  const [relative, fragment = ""] = target.split("#", 2);
  const resolved = path.posix.normalize(
    path.posix.join(sourceDir, decodeURI(relative)),
  );
  const anchor = anchors.get(resolved.replace(/\/$/, ""));
  if (anchor && !image) return `#${anchor}`;
  const hash = fragment ? `#${fragment}` : "";
  const page =
    site.bySource.get(resolved) ??
    site.bySource.get(`${resolved.replace(/\/$/, "")}/README.md`);
  if (page && !image) return `${site.config.href(page.route)}${hash}`;
  if (resolved.startsWith("../")) return target;
  const absolute = path.join(repoRoot, resolved);
  if (!fs.existsSync(absolute))
    return `${site.config.blobUrl(resolved)}${hash}`;
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

/** An id generator that never hands out the same id twice on one page. */
function uniqueIds() {
  const seen = new Set();
  return (base) => {
    let id = base;
    for (let n = 2; seen.has(id); n += 1) id = `${base}-${n}`;
    seen.add(id);
    return id;
  };
}

const anchoredHeading = (level, id, inner) =>
  `<h${level} id="${id}"><a class="heading-anchor" href="#${id}">${inner}</a></h${level}>`;

/** Stable, unique ids on headings so the TOC and deep links can target them. */
function addHeadingAnchors(html, unique) {
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_match, level, inner) =>
    anchoredHeading(
      level,
      unique(slugify(inner.replace(/<[^>]+>/g, ""))),
      inner,
    ),
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
  toml: "TOML",
  markdown: "Markdown",
  text: "text",
};

const EXTENSION_LANGUAGES = {
  sh: "bash",
  bash: "bash",
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  toml: "toml",
  md: "markdown",
  txt: "text",
};

/** Highlighting grammar for an inline file, chosen by its name. */
export function fileLanguage(name) {
  const base = path.posix.basename(name);
  if (/^Dockerfile|\.Dockerfile$/i.test(base)) return "dockerfile";
  return (
    EXTENSION_LANGUAGES[path.posix.extname(base).slice(1).toLowerCase()] ??
    "text"
  );
}

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

/** Every inline file as a heading plus highlighted code, after the document. */
async function filesSection(files, unique, theme) {
  if (!files.length) return "";
  const id = unique("file-contents");
  const blocks = [];
  for (const file of files) {
    const lang = fileLanguage(file.name);
    blocks.push(
      anchoredHeading(3, file.id, `<code>${escapeHtml(file.name)}</code>`),
      codeCard({
        label: LANGUAGE_LABELS[lang] ?? lang,
        html: await highlight(file.text.replace(/\n$/, ""), lang, theme),
      }),
    );
  }
  return `<section class="file-contents" aria-labelledby="${id}">
${anchoredHeading(2, id, "File contents")}
${blocks.join("\n")}
</section>`;
}

/**
 * Render one repository document to the HTML shown on its page. `files` are
 * sibling files (`{ name, text }`, relative to `sourceDir`) rendered inline
 * after the document; links to them, or to directories holding them, become
 * in-page anchors.
 */
export async function renderDocument(
  markdown,
  { sourceDir, site, theme, files = [] },
) {
  const unique = uniqueIds();
  const anchors = new Map();
  const inline = files.map((file) => {
    const id = unique(
      `file-${slugify(file.name.replace(/[^a-z0-9]+/gi, " "))}`,
    );
    let target = path.posix.join(sourceDir, file.name);
    while (target !== sourceDir && !anchors.has(target)) {
      anchors.set(target, id);
      target = path.posix.dirname(target);
    }
    return { ...file, id };
  });
  const parser = new Marked({
    async: true,
    async walkTokens(token) {
      if (token.type === "link" || token.type === "image") {
        token.href = rewriteTarget(
          token.href,
          sourceDir,
          site,
          anchors,
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
  const article = addHeadingAnchors(await parser.parse(markdown), unique);
  return wrapTables(article) + (await filesSection(inline, unique, theme));
}
