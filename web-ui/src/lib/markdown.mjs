import path from "node:path";
import { Marked, Renderer } from "marked";
import { fileLanguage } from "./highlight.mjs";
import { html, raw } from "./html.mjs";
import { copyButton } from "./ui.mjs";

// Longer recipe files start collapsed so the page stays scannable.
const COLLAPSE_LINES = 40;
const FILES_HEADING = "File contents";

/**
 * GitHub's heading slug algorithm, so fragments written against GitHub's
 * rendering (`#included-software`) resolve on the site too.
 */
export function slugify(text) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-") || "section"
  );
}

/** An id generator that never hands out the same id twice on one page. */
export function uniqueIds(reserved = []) {
  const seen = new Set(reserved);
  return (base) => {
    let id = base;
    for (let n = 1; seen.has(id); n += 1) id = `${base}-${n}`;
    seen.add(id);
    return id;
  };
}

const BLOCKS = new Set(["paragraph", "heading", "list", "list_item", "table", "blockquote", "code", "html", "space", "hr"]);
const UNINDEXED = new Set(["code", "html", "space", "hr"]);

/** Visible text of inline or block tokens, without markup or code blocks. */
export function plainText(tokens = []) {
  const text = tokens
    .map((token) => {
      let value;
      if (UNINDEXED.has(token.type)) value = "";
      else if (token.type === "list") value = plainText(token.items);
      else if (token.type === "table") value = [...token.header, ...token.rows.flat()].map((cell) => plainText(cell.tokens)).join(" ");
      else if (token.type === "br") value = " ";
      else if (token.tokens) value = plainText(token.tokens);
      else value = token.text ?? "";
      return BLOCKS.has(token.type) ? ` ${value} ` : value;
    })
    .join("");
  return text.replace(/\s+/g, " ").trim();
}

/**
 * @typedef {object} Rendered
 * @property {string} title    plain text of the document's `# ` heading
 * @property {string} leadHtml inline HTML of the opening paragraph, moved out of the body
 * @property {string} lead     plain text of that paragraph
 * @property {string} html     the body without its title and lead; with a slot, the part up to and including its heading
 * @property {string} tail     with a slot, the body after the slot's section; otherwise ""
 * @property {{ level: number, id: string, text: string }[]} toc
 * @property {{ id: string, heading: string, text: string }[]} sections searchable prose, never code
 * @property {string[]} headings plain text of every h2 in the body
 * @property {string[]} problems content errors (raw HTML, bad links), each naming the source
 */

/**
 * The markdown pipeline. Everything structural (heading ids, the page title,
 * the lead, removed sections, link targets) is decided on marked's tokens
 * before rendering, so no rendered HTML is ever re-parsed.
 * @param {object} options
 * @param {{ render(code: string, lang?: string): string }} options.highlighter
 * @param {ReturnType<import("./links.mjs").createLinkResolver>} options.resolveLink
 * @param {(name: string) => string} options.icon
 * @param {string[]} [options.reservedIds] ids the page template already uses
 */
export function createMarkdown({ highlighter, resolveLink, icon, reservedIds = [] }) {
  const codeBlock = (highlighted, copy = true) =>
    `<div class="code" data-copy-source>${copy ? copyButton(icon, "Copy code") : ""}${highlighted}</div>`;
  const recipeFile = (file) => {
    const text = file.text.replace(/\n$/, "");
    const lines = text.split("\n").length;
    return String(
      html`<details class="file" id="${file.id}" data-copy-source${raw(lines <= COLLAPSE_LINES ? " open" : "")}><summary><span class="file-name">${file.name}</span><span class="file-lines">${lines} ${lines === 1 ? "line" : "lines"}</span>${copyButton(icon, `Copy ${file.name}`)}</summary>${raw(codeBlock(highlighter.render(text, fileLanguage(file.name)), false))}</details>`,
    );
  };
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, id }) {
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}<a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a></h${depth}>\n`;
      },
      code({ text, lang }) {
        return codeBlock(highlighter.render(text.replace(/\n$/, ""), (lang ?? "").split(/\s+/)[0]));
      },
      // Wide tables scroll inside their own focusable region instead of the page.
      table(token) {
        return String(html`<div class="table" role="region" tabindex="0" aria-label="${token.label}">${raw(Renderer.prototype.table.call(this, token))}</div>`);
      },
    },
  });

  /**
   * @param {string} markdown document body without frontmatter
   * @param {{ source: string, selfHref: string, files?: { name: string, text: string }[], slot?: string }} context
   *   `selfHref` is the page's own href: list items that only link there are dropped.
   *   `slot` names an h2 section whose content the page generates instead: its
   *   heading stays at the end of `html`, and the rest of the body is `tail`.
   * @returns {Rendered} rendered even when `problems` is not empty, so one build reports everything
   */
  return function render(markdown, { source, selfHref, files = [], slot }) {
    const nextId = uniqueIds(reservedIds);
    const sourceDir = path.posix.dirname(source);
    const problems = [];

    const inline = files.map((file) => ({ ...file, id: nextId(`file-${slugify(file.name.replace(/[^\p{L}\p{N}]+/gu, " ")).replace(/-+/g, "-")}`) }));
    const anchors = new Map();
    for (const file of inline) {
      // A link to a directory of inline files jumps to its first file.
      for (let target = path.posix.join(sourceDir, file.name); target !== sourceDir && !anchors.has(target); ) {
        anchors.set(target, file.id);
        target = path.posix.dirname(target);
      }
    }

    const tokens = marked.lexer(markdown);
    marked.walkTokens(tokens, (token) => {
      if (token.type === "html") problems.push(`raw HTML is not published; use Markdown instead of ${JSON.stringify(token.raw.trim().slice(0, 40))}`);
      if (token.type === "link" || token.type === "image") {
        try {
          token.href = resolveLink(token.href, { source, anchors, image: token.type === "image" });
        } catch (error) {
          problems.push(error.message);
        }
      }
    });

    const blocks = tokens.filter((token) => token.type !== "space");
    const title = blocks[0]?.type === "heading" && blocks[0].depth === 1 ? blocks.shift() : null;
    const lead = blocks[0]?.type === "paragraph" ? blocks.shift() : null;
    let body = dropSelfLinks(dropContents(blocks), selfHref);
    let after = [];
    if (slot) {
      const isH2 = (token) => token.type === "heading" && token.depth === 2;
      const start = body.findIndex((token) => isH2(token) && plainText(token.tokens) === slot);
      // A missing slot is reported by content discovery, which checks the section's bullets.
      if (start !== -1) {
        const end = body.findIndex((token, index) => index > start && isH2(token));
        after = end === -1 ? [] : body.slice(end);
        body = body.slice(0, start + 1);
      }
    }

    const toc = [];
    const headings = [];
    let label = "";
    marked.walkTokens([...body, ...after], (token) => {
      if (token.type === "heading") {
        token.depth = Math.max(token.depth, 2);
        label = plainText(token.tokens);
        token.id = nextId(slugify(label));
        if (token.depth <= 3) toc.push({ level: token.depth, id: token.id, text: label });
        if (token.depth === 2) headings.push(label);
      } else if (token.type === "table") {
        token.label = label ? `${label} table` : "Table";
      }
    });

    const sections = [...splitSections(body), ...splitSections(after)];
    let bodyHtml = marked.parser(body);
    const tail = after.length ? marked.parser(after) : "";
    if (inline.length) {
      const id = nextId(slugify(FILES_HEADING));
      toc.push({ level: 2, id, text: FILES_HEADING });
      const items = inline.map((file) => {
        toc.push({ level: 3, id: file.id, text: file.name });
        sections.push({ id: file.id, heading: file.name, text: "" });
        return recipeFile(file);
      });
      bodyHtml += `<section class="files" aria-labelledby="${id}"><h2 id="${id}">${FILES_HEADING}<a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a></h2>${items.join("")}</section>`;
    }

    const leadText = lead ? plainText(lead.tokens) : "";
    return {
      title: title ? plainText(title.tokens) : "",
      leadHtml: lead ? marked.parser([lead]).trim().replace(/^<p>|<\/p>$/g, "") : "",
      lead: leadText,
      html: bodyHtml,
      tail,
      toc,
      headings,
      sections: withLead(sections, leadText),
      problems: problems.map((problem) => `${source}: ${problem}`),
    };
  };
}

/**
 * Drop a `## Contents` section whose only content is a list of same-page
 * links: the site's "On this page" navigation replaces it.
 */
function dropContents(blocks) {
  const index = blocks.findIndex((token) => token.type === "heading" && token.depth === 2 && /^contents$/i.test(plainText(token.tokens)));
  if (index === -1) return blocks;
  const list = blocks[index + 1];
  const next = blocks[index + 2];
  const onlyAnchors =
    list?.type === "list" &&
    (!next || next.type === "heading") &&
    list.items.every((item) => {
      const links = allLinks(item.tokens);
      return links.length > 0 && links.every((link) => link.href.startsWith("#"));
    });
  return onlyAnchors ? [...blocks.slice(0, index), ...blocks.slice(index + 2)] : blocks;
}

/**
 * Drop list items whose only link points at the page itself, such as a
 * README's "Docs:" line linking to its own published URL.
 */
function dropSelfLinks(blocks, selfHref) {
  const keep = (list) => {
    list.items = list.items.filter((item) => {
      item.tokens = item.tokens.filter((token) => token.type !== "list" || keep(token));
      const links = allLinks(item.tokens.filter((token) => token.type !== "list"));
      return !(links.length === 1 && links[0].href.split("#")[0] === selfHref);
    });
    return list.items.length > 0;
  };
  return blocks.filter((token) => token.type !== "list" || keep(token));
}

function allLinks(tokens = []) {
  return tokens.flatMap((token) => {
    if (token.type === "link") return [token];
    if (token.type === "list") return token.items.flatMap((item) => allLinks(item.tokens));
    return allLinks(token.tokens);
  });
}

/** Split top-level blocks at h2/h3 into searchable sections; code is never indexed. */
function splitSections(blocks) {
  const sections = [];
  let current = { id: "", heading: "", parts: [] };
  const flush = () => {
    const text = current.parts.join(" ").replace(/\s+/g, " ").trim();
    if (current.heading || text) sections.push({ id: current.id, heading: current.heading, text });
  };
  for (const token of blocks) {
    if (token.type === "heading" && token.depth <= 3) {
      flush();
      current = { id: token.id, heading: plainText(token.tokens), parts: [] };
    } else {
      current.parts.push(plainText([token]));
    }
  }
  flush();
  return sections;
}

/** The lead opens the page's preamble section (text before the first heading). */
function withLead(sections, lead) {
  if (!lead) return sections;
  if (sections[0]?.heading === "") return [{ ...sections[0], text: `${lead} ${sections[0].text}`.trim() }, ...sections.slice(1)];
  return [{ id: "", heading: "", text: lead }, ...sections];
}
