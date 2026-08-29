import fs from "node:fs";
import path from "node:path";
import {
  repoRoot,
  repoUrl,
  blobUrl,
  catalog,
  pages,
  readingOrder,
  platformLabels,
  basePath as base,
  siteOrigin,
} from "../../build/catalog.mjs";
import { escapeHtml, extractMeta } from "../../build/markdown.mjs";
import { icon } from "../../build/icons.mjs";

/* --------------------------------------------------------------- sidebar */

function navLink(href, label, active, { icon: iconName } = {}) {
  return `<a class="nav-link${active ? " active" : ""}"${
    active ? ' aria-current="page"' : ""
  } href="${base}${href}">${iconName ? icon(iconName) : ""}${label}</a>`;
}

export function docsSidebar(activePage) {
  const parts = [];
  parts.push(
    `<div class="filter-box">${icon("search")}<label class="sr-only" for="nav-filter">Filter documentation</label><input id="nav-filter" type="search" data-nav-filter placeholder="Filter tools…" autocomplete="off" class="nav-input"><span class="kbd filter-kbd" aria-hidden="true">/</span></div>`,
  );
  parts.push('<nav class="doc-nav" aria-label="Docs">');
  parts.push(navLink("/docs/", "All docs", activePage.kind === "docs-index", { icon: "book" }));
  for (const { category, tools } of catalog) {
    parts.push('<div class="nav-group" data-nav-group>');
    parts.push(`<div class="nav-label">${category}</div>`);
    for (const { tool, platforms } of tools) {
      const toolPage = pages.get(`images/${category}/${tool}/README.md`);
      const isCurrentTool = activePage.tool === tool && activePage.category === category;
      parts.push(navLink(toolPage.route, tool, activePage.kind === "tool" && isCurrentTool, { icon: "box" }));
      if (platforms.length && (isCurrentTool || activePage.kind === "docs-index")) {
        parts.push('<div class="nav-sub">');
        for (const platform of platforms) {
          const page = pages.get(`images/${category}/${tool}/examples/${platform}/README.md`);
          const active =
            activePage.kind === "example" &&
            activePage.tool === tool &&
            activePage.category === category &&
            activePage.platform === platform;
          parts.push(navLink(page.route, platformLabels[platform] ?? platform, active, { icon: "layers" }));
        }
        parts.push("</div>");
      }
    }
    parts.push("</div>");
  }
  parts.push("</nav>");
  parts.push(
    `<div class="nav-empty empty empty-sm" data-nav-empty style="display:none"><div class="empty-header"><span class="empty-media">${icon("inbox")}</span><p class="empty-title">No matches</p></div></div>`,
  );
  parts.push(`<div class="sidebar-footer"><a class="nav-link" href="${repoUrl}">${icon("github")}GitHub</a></div>`);
  return parts.join("");
}

/* --------------------------------------------------------- docs wrappers */

/** Full docs layout body: sidebar column + content column + optional TOC column. */
export function docsBody({ page, contentHtml, tocEntries = [] }) {
  const hasToc = tocEntries.length >= 2;
  const article =
    page.kind === "docs-index" ? contentHtml : `<article class="prose">\n${contentHtml}\n</article>`;
  return `<div class="backdrop" aria-hidden="true"></div>
<div class="shell docs-shell${hasToc ? " has-toc" : ""}">
<aside class="sidebar" id="sidebar">
${docsSidebar(page)}
</aside>
<main class="content" id="content">
<div class="content-inner">
${breadcrumbs(page)}
${article}
${pagination(page)}
<footer class="site-footer">
<a href="${blobUrl(page.repoRelPath)}">Edit this page on GitHub</a>
<span>Generated from repository documentation \u00b7 ${new Date().toISOString().slice(0, 10)}</span>
</footer>
</div>
</main>
${hasToc ? toc(tocEntries) : ""}
</div>`;
}

function crumb(label, route) {
  return route
    ? `<a href="${base}${route}">${label}</a>`
    : `<span aria-current="page" class="current">${label}</span>`;
}

function breadcrumbs(page) {
  if (page.kind === "docs-index") return "";
  const sep = icon("chevron");
  if (page.kind === "tool") {
    return `<nav class="crumbs" aria-label="Breadcrumb">${crumb("Docs", "/docs/")}${sep}${crumb(page.tool, null)}</nav>`;
  }
  return `<nav class="crumbs" aria-label="Breadcrumb">${crumb("Docs", "/docs/")}${sep}${crumb(
    page.tool,
    `/docs/${page.category}/${page.tool}/`,
  )}${sep}${crumb(platformLabels[page.platform] ?? page.platform, null)}</nav>`;
}

function toc(entries) {
  const items = entries
    .map(
      (entry) =>
        `<li><a class="toc-link${entry.level === 3 ? " indent" : ""}" href="#${entry.id}">${escapeHtml(entry.text)}</a></li>`,
    )
    .join("\n");
  return `<aside class="toc-col" aria-label="Table of contents">
<div class="toc">
<p class="toc-title">On this page</p>
<ul class="toc-list">
${items}
</ul>
</div>
</aside>`;
}

function pagination(page) {
  const index = readingOrder.findIndex(({ route }) => route === page.route);
  if (index === -1) return "";
  const cell = (direction, item) =>
    item
      ? `<a class="page-link ${direction}" href="${base}${item.route}"><span class="dir">${
          direction === "prev" ? "Previous" : "Next"
        }</span><span class="label">${escapeHtml(item.label)}</span></a>`
      : `<span class="page-spacer" aria-hidden="true"></span>`;
  return `<nav class="pagination" aria-label="Pagination">${cell("prev", readingOrder[index - 1])}${cell(
    "next",
    readingOrder[index + 1],
  )}</nav>`;
}

/* ----------------------------------------------------- docs index page */

/**
 * /docs/ landing: one generated section per images/<category>/ directory,
 * every tool linked with its example pages.
 */
export function renderDocsIndexPage() {
  const sections = catalog
    .map(({ category, tools }) => {
      const rows = tools
        .map(({ tool, platforms }) => {
          const toolPage = pages.get(`images/${category}/${tool}/README.md`);
          const description = extractMeta(
            fs.readFileSync(path.join(repoRoot, "images", category, tool, "README.md"), "utf8"),
          ).description;
          const examples = platforms
            .map((platform) => {
              const page = pages.get(`images/${category}/${tool}/examples/${platform}/README.md`);
              return `<a class="docs-example-link" href="${page.route}">${platformLabels[platform] ?? platform}</a>`;
            })
            .join("");
          return `<li class="docs-tool">
<a class="docs-tool-name font-mono" href="${toolPage.route}">${escapeHtml(tool)}</a>
<p class="docs-tool-desc">${escapeHtml(description)}</p>
${examples ? `<div class="docs-tool-examples">${examples}</div>` : ""}
</li>`;
        })
        .join("\n");
      return `<section class="docs-category">
<h2>${category}</h2>
<ul class="docs-tools">
${rows}
</ul>
</section>`;
    })
    .join("\n");
  return `<div class="docs-index">
<h1>Docs</h1>
<p class="docs-lead">Every tool under <code>images/</code>, generated from the repository. Each tool page documents its image variants, tags, and registries; each example page is a runnable recipe.</p>
${sections}
</div>`;
}

/* --------------------------------------------------------- structured data */

export function docsJsonLd(page) {
  if (page.kind === "docs-index") {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Docs",
      url: `${siteOrigin}${base}/docs/`,
    };
  }
  const toolUrl = `${siteOrigin}${base}/docs/${page.category}/${page.tool}/`;
  const itemListElement = [
    { "@type": "ListItem", position: 1, name: "Docs", item: `${siteOrigin}${base}/docs/` },
    { "@type": "ListItem", position: 2, name: page.tool, item: toolUrl },
  ];
  if (page.kind === "example") {
    itemListElement.push({
      "@type": "ListItem",
      position: 3,
      name: platformLabels[page.platform] ?? page.platform,
      item: `${siteOrigin}${base}${page.route}`,
    });
  }
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };
}
