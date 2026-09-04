import { platformLabel } from "../lib/catalog.mjs";
import { escapeHtml, leadParagraph, truncate } from "../lib/markdown.mjs";
import { icon } from "../lib/icons.mjs";

/* --------------------------------------------------------------- sidebar */

function navLink({ href, label, active, icon: name }) {
  return `<a class="nav-link${active ? " active" : ""}"${active ? ' aria-current="page"' : ""} href="${href}">${
    name ? icon(name) : ""
  }<span>${escapeHtml(label)}</span></a>`;
}

/**
 * The docs navigation. Example links are nested under their tool and shown for
 * the tool being read (and on the index, where the whole tree is the content),
 * keeping the list short without hiding anything the reader needs.
 */
function sidebar(page, site) {
  const { config, catalog } = site;
  const groups = catalog
    .filter(({ tools }) => tools.length)
    .map(({ category, tools }) => {
      const items = tools
        .map(({ tool, platforms }) => {
          const current = page.category === category && page.tool === tool;
          const expanded = platforms.length && (current || page.kind === "docs-index");
          const examples = expanded
            ? `<div class="nav-sub">${platforms
                .map((platform) =>
                  navLink({
                    href: config.href(`/docs/${category}/${tool}/${platform}/`),
                    label: platformLabel(platform),
                    active: current && page.platform === platform,
                    icon: "layers",
                  }),
                )
                .join("")}</div>`
            : "";
          return `<div data-nav-item>${navLink({
            href: config.href(`/docs/${category}/${tool}/`),
            label: tool,
            active: current && page.kind === "tool",
            icon: "box",
          })}${examples}</div>`;
        })
        .join("");
      return `<div class="nav-group" data-nav-group><p class="nav-label">${escapeHtml(category)}</p>${items}</div>`;
    })
    .join("");

  return `<div class="filter-box">
${icon("search")}
<label class="sr-only" for="nav-filter">Filter documentation</label>
<input class="nav-input" id="nav-filter" type="search" data-nav-filter placeholder="Filter tools…" autocomplete="off" spellcheck="false">
<kbd class="filter-kbd" aria-hidden="true">/</kbd>
</div>
<nav class="doc-nav" aria-label="Documentation">
${navLink({ href: config.href("/docs/"), label: "All docs", active: page.kind === "docs-index", icon: "book" })}
${groups}
</nav>
<p class="nav-empty" data-nav-empty hidden>No tools match that filter.</p>
<div class="sidebar-footer">${navLink({ href: config.repoUrl, label: "GitHub", icon: "github" })}</div>`;
}

/* ------------------------------------------------------------ page chrome */

function breadcrumbs(page, config) {
  if (page.kind === "docs-index") return "";
  const trail = [{ label: "Docs", route: "/docs/" }, { label: page.tool, route: `/docs/${page.category}/${page.tool}/` }];
  if (page.kind === "example") trail.push({ label: platformLabel(page.platform), route: page.route });

  const links = trail
    .map(({ label, route }, index) =>
      index === trail.length - 1
        ? `<span class="current" aria-current="page">${escapeHtml(label)}</span>`
        : `<a href="${config.href(route)}">${escapeHtml(label)}</a>`,
    )
    .join(icon("chevron"));
  return `<nav class="crumbs" aria-label="Breadcrumb">${links}</nav>`;
}

function tableOfContentsNav(entries) {
  const items = entries
    .map(
      ({ level, id, text }) =>
        `<li><a class="toc-link${level === 3 ? " indent" : ""}" href="#${id}">${escapeHtml(text)}</a></li>`,
    )
    .join("");
  return `<aside class="toc-col">
<nav class="toc" aria-labelledby="toc-title">
<p class="toc-title" id="toc-title">On this page</p>
<ul class="toc-list">${items}</ul>
</nav>
</aside>`;
}

function pagination(page, site) {
  const { previous, next } = site.neighbours(page);
  if (!previous && !next) return "";
  const cell = (direction, item) =>
    item
      ? `<a class="page-link ${direction}" href="${site.config.href(item.route)}"><span class="dir">${
          direction === "prev" ? "Previous" : "Next"
        }</span><span class="label">${escapeHtml(item.label)}</span></a>`
      : '<span class="page-spacer" aria-hidden="true"></span>';
  return `<nav class="pagination" aria-label="Pagination">${cell("prev", previous)}${cell("next", next)}</nav>`;
}

/* ------------------------------------------------------------ index page */

/** `/docs/`: every tool under `tools/`, with its examples, straight from the tree. */
function docsIndex(site, documents) {
  const { config, catalog, toolCount, exampleCount } = site;
  const sections = catalog
    .filter(({ tools }) => tools.length)
    .map(({ category, tools }) => {
      const items = tools
        .map(({ tool, platforms, readme }) => {
          const examples = platforms
            .map(
              (platform) =>
                `<a class="docs-example-link" href="${config.href(`/docs/${category}/${tool}/${platform}/`)}">${icon(
                  "layers",
                )}${platformLabel(platform)}</a>`,
            )
            .join("");
          return `<li class="docs-tool">
<a class="docs-tool-name" href="${config.href(`/docs/${category}/${tool}/`)}">${escapeHtml(tool)}</a>
<p class="docs-tool-desc">${escapeHtml(truncate(leadParagraph(documents.get(readme)), 150))}</p>
${examples ? `<div class="docs-tool-examples">${examples}</div>` : ""}
</li>`;
        })
        .join("");
      return `<section class="docs-category">
<h2 id="${escapeHtml(category)}">${escapeHtml(category)}</h2>
<ul class="docs-tools">${items}</ul>
</section>`;
    })
    .join("");

  return `<div class="docs-index">
<h1>Docs</h1>
<p class="docs-lead">${toolCount} container images and ${exampleCount} runnable examples, generated from the repository. Each tool page documents its variants, tags and registries; each example page is a recipe you can copy and run.</p>
${sections}
</div>`;
}

/* ----------------------------------------------------------------- shell */

/**
 * The three-column docs layout: navigation, the document, and — when the
 * document has enough headings to be worth one — a table of contents.
 */
export function renderDocs({ page, site, documents, article, toc = [] }) {
  const body = page.kind === "docs-index" ? docsIndex(site, documents) : `<article class="prose">${article}</article>`;
  const hasToc = toc.length >= 2;

  return `<div class="backdrop" aria-hidden="true"></div>
<div class="shell docs-shell${hasToc ? " has-toc" : ""}">
<aside class="sidebar" id="sidebar" aria-label="Documentation navigation">
${sidebar(page, site)}
</aside>
<main class="content" id="content">
<div class="content-inner">
${breadcrumbs(page, site.config)}
${body}
${pagination(page, site)}
</div>
</main>
${hasToc ? tableOfContentsNav(toc) : ""}
</div>`;
}
