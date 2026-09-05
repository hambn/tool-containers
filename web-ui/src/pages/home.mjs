import {
  escapeHtml,
  catalogDescriptions,
  documentTitle,
  leadParagraph,
  truncate,
} from "../lib/markdown.mjs";
import { platformLabel } from "../lib/catalog.mjs";
import { icon } from "../lib/icons.mjs";

function toolCard({ category, tool, platforms, description, config }) {
  const route = `/docs/${category}/${tool}/`;
  const search = [tool, category, description, ...platforms]
    .join(" ")
    .toLowerCase();
  return `<li class="tool-card" data-catalog-item data-search="${escapeHtml(search)}">
<div class="tool-card-body">
<a class="tool-link" href="${config.href(route)}"><div class="tool-title"><span class="tool-symbol" aria-hidden="true">${icon("box")}</span><h3>${escapeHtml(tool)}</h3></div>${icon("arrow", "tool-arrow")}</a>
<p class="tool-desc">${escapeHtml(truncate(description, 160))}</p>
</div>
<div class="tool-platforms" aria-label="${escapeHtml(tool)} examples">
${platforms.map((platform) => `<a href="${config.href(`${route}${platform}/`)}">${escapeHtml(platformLabel(platform))}</a>`).join("")}
${!platforms.length ? "<span>Documentation</span>" : ""}
</div>
</li>`;
}

function categorySection({ category, tools, descriptions, documents, config }) {
  return `<section class="tool-section" data-catalog-group="${escapeHtml(category)}" aria-labelledby="category-${escapeHtml(category)}">
<div class="section-head"><h2 id="category-${escapeHtml(category)}">${escapeHtml(category)}</h2><span class="badge badge-secondary">${tools.length}</span></div>
${
  tools.length
    ? `<ul class="tool-grid">${tools
        .map((entry) =>
          toolCard({
            ...entry,
            description:
              descriptions.get(`tools/${category}/${entry.tool}`) ||
              leadParagraph(documents.get(entry.readme)),
            config,
          }),
        )
        .join("")}</ul>`
    : '<p class="category-empty">No tools yet.</p>'
}
</section>`;
}

export function renderHome({ site, documents }) {
  const { config, catalog, toolCount, exampleCount } = site;
  const readme = documents.get("README.md");
  const descriptions = catalogDescriptions(readme);
  const intro = leadParagraph(readme);
  const summary =
    [
      ...new Intl.Segmenter("en", { granularity: "sentence" }).segment(intro),
    ][0]?.segment.trim() || intro;

  return `<main class="content home" id="content" tabindex="-1">
<div class="content-inner wide">
<section class="hero" aria-labelledby="catalog-title">
<p class="eyebrow">${icon("box")}Container catalog</p>
<h1 id="catalog-title">${escapeHtml(documentTitle(readme))}</h1>
<p class="lead">${escapeHtml(summary)}</p>
<div class="hero-bottom"><p class="catalog-count"><strong>${toolCount}</strong> tools<span aria-hidden="true">/</span><strong>${exampleCount}</strong> examples</p>
<a class="text-link" href="${config.href("/docs/")}">Documentation${icon("arrow")}</a></div>
</section>
<div class="catalog-toolbar" data-catalog-controls hidden>
<div class="catalog-search">${icon("search")}<label class="sr-only" for="catalog-search">Search tools and platforms</label><input id="catalog-search" type="search" placeholder="Search tools, platforms…" autocomplete="off" spellcheck="false"><kbd class="filter-kbd" aria-hidden="true">/</kbd></div>
<div class="category-filters" role="group" aria-label="Filter by category"><button type="button" data-category="" aria-pressed="true">All tools</button>${catalog.map(({ category }) => `<button type="button" data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)}</button>`).join("")}</div>
</div>
<p class="sr-only" data-catalog-status role="status"></p>
${catalog.map((entry) => categorySection({ ...entry, descriptions, documents, config })).join("\n")}
<div class="empty catalog-empty" data-catalog-empty hidden><span class="empty-media">${icon("search")}</span><p class="empty-title">No matching tools</p><p class="empty-description">Try a different name or platform.</p><button class="btn btn-outline" type="button" data-catalog-reset>Clear filters</button></div>
</div>
</main>`;
}
