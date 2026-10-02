import { html, raw } from "../lib/html.mjs";
import { docsNav } from "../lib/layout.mjs";
import { toolRoute } from "../lib/site.mjs";
import { externalLink, imageList, platformChips } from "../lib/ui.mjs";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

function breadcrumb(page, { config }) {
  if (!page.crumbs.length) return "";
  const last = page.crumbs.length - 1;
  return html`<nav class="crumbs" aria-label="Breadcrumb"><ol>${page.crumbs.map(({ label, route }, index) =>
    index === last ? html`<li><span aria-current="page">${label}</span></li>` : html`<li><a href="${config.href(route)}">${label}</a></li>`,
  )}</ol></nav>`;
}

/** Overview and a compact dropdown of the tool's platform pages. */
function tabs(page, site, icon) {
  if (!page.tool) return "";
  const [overview, ...platforms] = site.toolFamily(page.tool);
  if (!platforms.length) return "";
  const current = page === overview ? raw(' aria-current="page"') : "";
  return html`<nav class="tabs" aria-label="${page.tool.meta.title} platforms">
<a class="tabs-link" href="${site.config.href(overview.route)}"${current}>Overview</a>
<details class="platform-dropdown">
<summary><span class="sr-only">Choose platform: </span>${page.platform ? page.label : "Platform"}${raw(icon("chevron"))}</summary>
<ul class="platform-options">${platforms.map((target) => html`<li><a class="tabs-link" href="${site.config.href(target.route)}"${target === page ? raw(' aria-current="page"') : ""}>${target.label}${target === page ? raw(icon("check")) : ""}</a></li>`)}</ul>
</details>
</nav>`;
}

function facts(page, site, icon) {
  const { tool, platform } = page;
  if (!tool) return "";
  const { meta } = tool;
  const upstream = meta.upstream && new URL(meta.upstream);
  const source = page.source.replace(/\/README\.md$/, "");
  return html`<dl class="facts">
<div><dt>${meta.images.length > 1 ? "Images" : "Image"}</dt><dd>${imageList(meta.images, icon)}</dd></div>
${platform ? html`<div><dt>Use case</dt><dd>${platform.meta.usecase}</dd></div>` : ""}
${upstream ? html`<div><dt>Upstream</dt><dd>${externalLink(upstream.href, `${upstream.host}${upstream.pathname.replace(/\/$/, "")}`, { icon })}</dd></div>` : ""}
<div><dt>Source</dt><dd>${externalLink(site.config.treeUrl(source), source, { icon })}</dd></div>
</dl>`;
}

/**
 * The generated body of a category README's Tools section: every tool of the
 * category in `order`, with its title, description, images, and platform pages.
 */
function categoryTools(page, site, icon) {
  if (page.kind !== "category") return "";
  return html`<ul class="category-tools">${page.category.tools.map(
    (tool) => html`<li class="category-tool">
<h3 class="category-tool-title"><a href="${site.config.href(toolRoute(tool))}">${tool.meta.title}</a></h3>
<p class="category-tool-desc">${tool.meta.description}</p>
${imageList(tool.meta.images, icon)}
${platformChips(tool, site)}
</li>`,
  )}</ul>`;
}

/** The page's keywords as tags, each a search for that keyword. */
function tags(page, { config }) {
  const keywords = page.tool ? (page.platform ?? page.tool).meta.keywords : [];
  if (!keywords.length) return "";
  return html`<section class="tags" aria-labelledby="tags-title"><h2 class="tags-title" id="tags-title">Topics</h2><ul class="chips">${keywords.map(
    (keyword) => html`<li><a class="chip" href="${config.href(`/search/?q=${encodeURIComponent(keyword)}`)}">${keyword}</a></li>`,
  )}</ul></section>`;
}

function tocList(toc) {
  return html`<ul>${toc.map(({ level, id, text }) => html`<li class="toc-${level}"><a href="#${id}">${text}</a></li>`)}</ul>`;
}

function pager(page, site, icon) {
  const { previous, next } = site.neighbours(page);
  if (!previous && !next) return "";
  const link = (target, rel, label) =>
    target
      ? html`<a class="pager-link ${rel}" href="${site.config.href(target.route)}" rel="${rel}"><span class="pager-label">${raw(icon("chevron"))}${label}</span><span class="pager-name">${target.name}</span></a>`
      : html`<span></span>`;
  return html`<nav class="pager" aria-label="Previous and next page">${link(previous, "prev", "Previous")}${link(next, "next", "Next")}</nav>`;
}

/** Edit link, last change, and the reading-order neighbours. */
function docFooter(page, site, dates, icon) {
  const updated = dates.modified
    ? html`<span>Last updated <time datetime="${dates.modified}">${dateFormat.format(new Date(dates.modified))}</time></span>`
    : "";
  return html`<footer class="doc-footer">
<div class="doc-meta">${externalLink(site.config.editUrl(page.source), html`${raw(icon("edit"))}Edit this page on GitHub`, { className: "edit-link" })}${updated}</div>
${pager(page, site, icon)}
</footer>`;
}

/**
 * A documentation page: sidebar tree, article, and "On this page" outline.
 * The README's opening paragraph is the lead under the h1 and is removed
 * from the body, so it is shown once; the frontmatter description stays in
 * metadata and search results, where it is written for.
 */
export function docPage({ page, site, rendered, dates, icon }) {
  const toc = rendered.toc.length ? tocList(rendered.toc) : "";
  return html`<div class="container docs">
<nav class="sidebar" aria-label="Documentation">${docsNav(page, site)}</nav>
<article class="doc">
${breadcrumb(page, site)}
<header class="doc-header">
<h1>${page.heading}</h1>
${rendered.leadHtml ? html`<p class="lead">${raw(rendered.leadHtml)}</p>` : ""}
${tabs(page, site, icon)}
</header>
${facts(page, site, icon)}
${toc ? html`<details class="toc-inline"><summary>On this page</summary>${toc}</details>` : ""}
<div class="prose">${raw(rendered.html)}${categoryTools(page, site, icon)}${raw(rendered.tail)}</div>
${tags(page, site)}
${docFooter(page, site, dates, icon)}
</article>
${toc ? html`<nav class="toc" id="on-this-page" aria-labelledby="toc-title"><p class="toc-title" id="toc-title">On this page</p>${toc}</nav>` : html`<div class="toc"></div>`}
</div>`;
}
