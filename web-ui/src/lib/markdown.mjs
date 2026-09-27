import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { repoRoot } from "./config.mjs";
import { escapeHtml, textContent } from "./html.mjs";
import { highlight } from "./highlight.mjs";
import { icon } from "./icons.mjs";

/* --------------------------------------------------------------- links */

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Rewrite a repository-relative link. Documents are written for GitHub, so a
 * link can point at another README (becomes its site route), at a recipe file
 * shown on this page (becomes an in-page anchor), or at any other repository
 * path (becomes a GitHub URL). External links and bare fragments pass through.
 */
function rewriteTarget(target, { sourceDir, site, anchors }, image) {
  if (EXTERNAL.test(target) || target.startsWith("#")) return target;
  const [relative, fragment = ""] = target.split("#", 2);
  const hash = fragment ? `#${fragment}` : "";
  const resolved = path.posix.normalize(path.posix.join(sourceDir, decodeURI(relative)));
  const bare = resolved.replace(/\/$/, "");
  if (resolved.startsWith("../")) return target;
  if (image) return `${site.config.repoUrl}/raw/HEAD/${bare}`;

  const anchor = anchors.get(bare);
  if (anchor) return `#${anchor}`;
  const page = site.bySource.get(bare) ?? site.bySource.get(`${bare}/README.md`);
  if (page) return `${site.config.href(page.route)}${hash}`;

  const absolute = path.join(repoRoot, bare);
  const isDirectory = fs.existsSync(absolute) && fs.statSync(absolute).isDirectory();
  return `${isDirectory ? site.config.treeUrl(bare) : site.config.blobUrl(bare)}${hash}`;
}

/* ------------------------------------------------------------ headings */

/**
 * GitHub's heading slug algorithm, so fragments written against GitHub's
 * rendering (`#included-software`) resolve on the site too.
 */
export function slugify(text) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-") || "section"
  );
}

/** An id generator that never hands out the same id twice on one page. */
function uniqueIds() {
  const seen = new Set();
  return (base) => {
    let id = base;
    for (let n = 1; seen.has(id); n += 1) id = `${base}-${n}`;
    seen.add(id);
    return id;
  };
}

const anchoredHeading = (level, id, inner) =>
  `<h${level} id="${id}"><a class="anchor" href="#${id}">${inner}</a></h${level}>`;

/* --------------------------------------------------------------- code */

const LANGUAGE_LABELS = {
  bash: "shell",
  sh: "shell",
  shell: "shell",
  shellscript: "shell",
  console: "shell",
  dockerfile: "Dockerfile",
  yaml: "YAML",
  yml: "YAML",
  json: "JSON",
  toml: "TOML",
  md: "Markdown",
  markdown: "Markdown",
};

const EXTENSION_LANGUAGES = { sh: "bash", bash: "bash", yml: "yaml", yaml: "yaml", json: "json", toml: "toml", md: "markdown" };

/** Highlighting grammar for an inline file, chosen by its name. */
export function fileLanguage(name) {
  const base = path.posix.basename(name);
  if (/^Dockerfile|\.Dockerfile$/i.test(base)) return "dockerfile";
  return EXTENSION_LANGUAGES[path.posix.extname(base).slice(1).toLowerCase()] ?? "text";
}

/** A code block with a caption and a copy button (enabled by the client script). */
export function codeBlock(label, html) {
  return `<figure class="code" data-copy-scope><figcaption><span>${escapeHtml(label)}</span><button type="button" class="copy" data-copy aria-label="Copy code">${icon("copy")}${icon("check")}</button></figcaption>${html}</figure>`;
}

/* ----------------------------------------------------------- rendering */

/**
 * @typedef {object} Rendered
 * @property {string} title     plain text of the document's `# ` heading
 * @property {string} titleHtml inline HTML of that heading
 * @property {string} html      the document body without its title
 * @property {string} lead      plain text of the first paragraph
 * @property {{ level: number, id: string, text: string }[]} toc
 * @property {{ id: string, heading: string, text: string }[]} sections
 */

/**
 * Render one document. The `# ` title is returned separately because the page
 * template owns the single `<h1>`; any further level-one headings are demoted
 * so a page can never carry two. `files` are recipe files rendered inline
 * after the document, and links to them become in-page anchors.
 * @param {string} markdown document body without frontmatter
 * @param {{ sourceDir: string, site: any, theme: any, files?: { name: string, text: string }[] }} context
 * @returns {Promise<Rendered>}
 */
export async function renderMarkdown(markdown, { sourceDir, site, theme, files = [] }) {
  const unique = uniqueIds();
  const anchors = new Map();
  const inline = files.map((file) => {
    const id = unique(`file-${slugify(file.name.replace(/[^a-z0-9]+/gi, " ")).replace(/-+/g, "-")}`);
    // Links to a directory that holds inline files jump to its first file.
    for (let target = path.posix.join(sourceDir, file.name); target !== sourceDir && !anchors.has(target); ) {
      anchors.set(target, id);
      target = path.posix.dirname(target);
    }
    return { ...file, id };
  });
  const context = { sourceDir, site, anchors };

  const parser = new Marked({
    async: true,
    gfm: true,
    async walkTokens(token) {
      if (token.type === "link" || token.type === "image") {
        token.href = rewriteTarget(token.href, context, token.type === "image");
      } else if (token.type === "code") {
        const lang = (token.lang || "text").split(/\s+/)[0].toLowerCase();
        token.rendered = codeBlock(LANGUAGE_LABELS[lang] ?? lang, await highlight(token.text, lang, theme));
      }
    },
    renderer: {
      code: (token) => token.rendered,
      link(token) {
        const inner = this.parser.parseInline(token.tokens);
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        const rel = /^https?:/.test(token.href) && !token.href.startsWith(site.config.siteUrl) ? ' rel="noopener"' : "";
        return `<a href="${escapeHtml(token.href)}"${title}${rel}>${inner}</a>`;
      },
    },
  });

  // Wide tables scroll inside their own focusable region instead of the page.
  let html = (await parser.parse(markdown)).replace(
    /<table>[\s\S]*?<\/table>/g,
    (table) => `<div class="table" tabindex="0" role="region" aria-label="Table">${table}</div>`,
  );
  let titleHtml = "";
  html = html.replace(/<h1>([\s\S]*?)<\/h1>\n?/, (_m, inner) => {
    titleHtml = inner;
    return "";
  });
  html = html.replace(/<(\/?)h1>/g, "<$1h2>");

  const toc = [];
  html = html.replace(/<h([2-6])>([\s\S]*?)<\/h\1>/g, (_m, level, inner) => {
    const text = textContent(inner);
    const id = unique(slugify(text));
    if (level <= 3) toc.push({ level: Number(level), id, text });
    return anchoredHeading(level, id, inner);
  });

  const lead = textContent(html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? "");
  const sections = splitSections(html);

  if (inline.length) {
    const id = unique("file-contents");
    toc.push({ level: 2, id, text: "File contents" });
    const blocks = [];
    for (const file of inline) {
      const lang = fileLanguage(file.name);
      toc.push({ level: 3, id: file.id, text: file.name });
      sections.push({ id: file.id, heading: file.name, text: "" });
      blocks.push(
        anchoredHeading(3, file.id, `<code>${escapeHtml(file.name)}</code>`),
        codeBlock(LANGUAGE_LABELS[lang] ?? lang, await highlight(file.text.replace(/\n$/, ""), lang, theme)),
      );
    }
    html += `<section class="files" aria-labelledby="${id}">${anchoredHeading(2, id, "File contents")}${blocks.join("")}</section>`;
  }

  return { title: textContent(titleHtml), titleHtml, html, lead, toc, sections };
}

/**
 * Split rendered HTML at its h2/h3 headings into searchable sections. Code
 * blocks are dropped: search should match prose, not every flag in a script.
 */
function splitSections(html) {
  const sections = [];
  const parts = html.split(/(?=<h[23] id=")/);
  for (const part of parts) {
    const heading = part.match(/^<h[23] id="([^"]+)">([\s\S]*?)<\/h[23]>/);
    const body = textContent(part.replace(/^<h[23][\s\S]*?<\/h[23]>/, "").replace(/<figure class="code"[\s\S]*?<\/figure>/g, " "));
    if (heading) sections.push({ id: heading[1], heading: textContent(heading[2]), text: body });
    else if (body) sections.push({ id: "", heading: "", text: body });
  }
  return sections;
}
