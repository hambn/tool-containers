import { marked } from "marked";
import { codeToHtml } from "shiki";
import fs from "node:fs";
import path from "node:path";
import { repoRoot, pages, repoUrl, basePath } from "./catalog.mjs";
import { icon } from "./icons.mjs";

export function escapeHtml(text) {
  return text.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
}

function stripInline(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

export function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}\u2026`;
}

/** First real paragraph after the h1, markdown stripped, untruncated. */
export function firstParagraph(markdown) {
  const lines = markdown.split("\n");
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line));
  for (let i = h1Index + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (/^#{1,6}\s/.test(line)) break;
    if (!line || /^[#>|]/.test(line) || /^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) continue;
    return stripInline(line);
  }
  return "";
}

/** { title, description } for SEO, taken from the document itself. */
export function extractMeta(markdown) {
  const lines = markdown.split("\n");
  let title = "tool-containers";
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line));
  if (h1Index !== -1) title = stripInline(lines[h1Index].slice(2));
  let description = "";
  for (let i = h1Index + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || /^[#>|]/.test(line) || /^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) continue;
    description = line;
    break;
  }
  return { title, description: truncate(stripInline(description), 155) };
}

/** Catalog table descriptions from the root README, keyed by images/<category>/<tool>. */
export function catalogDescriptions(readmeMarkdown) {
  const descriptions = new Map();
  for (const line of readmeMarkdown.split("\n")) {
    const match = line.match(/^\|\s*\[[^\]]+\]\(([^)]+)\)\s*\|\s*(.+?)\s*\|$/);
    if (!match) continue;
    const dir = match[1].replace(/^\.\//, "").replace(/\/+$/, "");
    if (dir.startsWith("images/")) descriptions.set(dir, stripInline(match[2]));
  }
  return descriptions;
}

function treeUrl(repoPath) {
  return `${repoUrl}/tree/HEAD/${repoPath}`;
}

/** Rewrite repository-relative markdown links to site pages or GitHub urls. */
export function rewriteTargets(markdown, sourceDir) {
  return markdown.replace(
    /(\]\()([^)\s]+)((?:\s+"[^"]*"|\s+'[^']*')?\))/g,
    (match, open, target, tail) => {
      if (/^(https?:|mailto:|#|\/\/)/i.test(target)) return match;
      const [pathPart, hash = ""] = target.split("#", 2);
      if (!pathPart) return match;
      const resolved = path.posix.normalize(path.posix.join(sourceDir, pathPart));
      const page = pages.get(resolved);
      if (page) return `${open}${basePath}${page.route}${hash ? `#${hash}` : ""}${tail}`;
      const dirPage = pages.get(`${resolved.replace(/\/$/, "")}/README.md`);
      if (dirPage) return `${open}${basePath}${dirPage.route}${hash ? `#${hash}` : ""}${tail}`;
      const abs = path.join(repoRoot, resolved);
      if (fs.existsSync(abs)) {
        const url = fs.statSync(abs).isDirectory() ? treeUrl(resolved) : `${repoUrl}/blob/HEAD/${resolved}`;
        return `${open}${url}${hash ? `#${hash}` : ""}${tail}`;
      }
      return match;
    },
  );
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

function addHeadingAnchors(html) {
  const slugCounts = new Map();
  return html.replace(/<h([2-6])>([\s\S]*?)<\/h\1>/g, (match, level, inner) => {
    let id = slugify(inner.replace(/<[^>]+>/g, ""));
    const count = slugCounts.get(id) ?? 0;
    slugCounts.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    return `<h${level} id="${id}"><a href="#${id}">${inner}</a></h${level}>`;
  });
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "").trim();
}

/** Heading outline for the right-rail table of contents. */
export function buildToc(contentHtml) {
  const entries = [];
  for (const match of contentHtml.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)) {
    entries.push({ level: Number(match[1]), id: match[2], text: stripTags(match[3]) });
  }
  return entries;
}

function langFromFilename(name) {
  const base = path.basename(name).toLowerCase();
  if (/^dockerfile/.test(base)) return "dockerfile";
  const ext = path.extname(base).slice(1);
  return { yml: "yaml", yaml: "yaml", sh: "shellscript", bash: "bash", json: "json" }[ext] ?? "text";
}

const langLabels = { shellscript: "shell", dockerfile: "Dockerfile", text: "text", yaml: "yaml", bash: "bash" };

/*
 * Shiki emits one inline style per token (dual light/dark CSS variables).
 * Tokens share a small set of color pairs, so styles are deduplicated into
 * .tk* classes and emitted once per page instead of once per token.
 */
const tokenClasses = new Map();
const preClasses = new Map();

function tokenizeStyles(html) {
  return html
    .replace(/ class="(shiki[^"]*)" style="([^"]+)"/g, (_m, cls, style) => {
      let name = preClasses.get(style);
      if (!name) {
        name = `ptk${preClasses.size}`;
        preClasses.set(style, name);
      }
      return ` class="${cls} ${name}"`;
    })
    .replace(/<span style="([^"]+)">/g, (_m, style) => {
      let name = tokenClasses.get(style);
      if (!name) {
        name = `tk${tokenClasses.size}`;
        tokenClasses.set(style, name);
      }
      return `<span class="${name}">`;
    });
}

/** Collected token CSS for the current build; call after rendering all pages. */
export function tokenCss() {
  const rules = [...preClasses].map(([style, name]) => `.${name}{${style}}`);
  rules.push(...[...tokenClasses].map(([style, name]) => `.${name}{${style}}`));
  return rules.join("\n");
}

async function highlight(code, lang) {
  const options = { themes: { light: "github-light", dark: "github-dark-default" }, defaultColor: false };
  try {
    return tokenizeStyles(await codeToHtml(code, { lang, ...options }));
  } catch {
    try {
      return tokenizeStyles(await codeToHtml(code, { lang: "text", ...options }));
    } catch {
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  }
}

function codeCard({ filename, shikiHtml }) {
  return `<div class="code-card">
<div class="code-head">
<span class="code-name">${escapeHtml(filename)}</span>
<button type="button" class="copy-btn" data-copy aria-label="Copy to clipboard">${icon("copy", "i-copy")}${icon("check", "i-check")}</button>
</div>
<div class="code-body">${shikiHtml}</div>
</div>`;
}

function extractFences(markdown) {
  const fences = [];
  const text = markdown.replace(
    /^[ \t]*(```+)[^\S\n]*([^\n`]*)\n([\s\S]*?)\n[ \t]*\1[ \t]*$/gm,
    (match, ticks, info, code) => {
      fences.push({ lang: info.trim().split(/\s+/)[0].toLowerCase() || "text", code });
      return `<!--FENCE:${fences.length - 1}-->`;
    },
  );
  return { text, fences };
}

function dressTables(html) {
  return html.replace(
    /<table>([\s\S]*?)<\/table>/g,
    (_match, inner) => `<div class="table-wrap"><table class="doc-table">${inner}</table></div>`,
  );
}

export async function renderMarkdown(repoRelPath) {
  const raw = fs.readFileSync(path.join(repoRoot, repoRelPath), "utf8");
  const prepared = rewriteTargets(raw, path.posix.dirname(repoRelPath));
  const { text, fences } = extractFences(prepared);
  let html = addHeadingAnchors(marked.parse(text));
  const cards = await Promise.all(
    fences.map(async (fence) =>
      codeCard({ filename: langLabels[fence.lang] ?? fence.lang, shikiHtml: await highlight(fence.code, fence.lang) }),
    ),
  );
  cards.forEach((card, index) => {
    html = html.replace(new RegExp(`<p><!--FENCE:${index}--></p>|<!--FENCE:${index}-->`), () => card);
  });
  return dressTables(html);
}
