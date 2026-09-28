import { html, raw } from "../lib/html.mjs";
import { categoryAnchor, categoryRoute, registryLabel, toolRoute } from "../lib/site.mjs";
import { sentences } from "../lib/text.mjs";
import { imageList } from "../lib/ui.mjs";

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

function toolRow(tool, site, icon) {
  const { meta } = tool;
  // The filter matches the words the row shows, plus the keywords search would match.
  const text = [meta.title, meta.description, ...meta.images, tool.category.meta.title, ...meta.keywords].join(" ");
  return html`<li class="row" data-category="${tool.category.slug}" data-text="${text}">
<div class="row-main"><h3 class="row-title"><a href="${site.config.href(toolRoute(tool))}">${meta.title}</a></h3><p class="row-desc">${meta.description}</p></div>
${imageList(meta.images, icon)}
</li>`;
}

function hero(site, readme, icon) {
  const { catalog, config } = site;
  const registries = [...new Set(catalog.tools.flatMap((tool) => tool.meta.images.map(registryLabel)))];
  const stats = [
    plural(catalog.tools.length, "image"),
    plural(catalog.categories.length, "category", "categories"),
    plural(site.recipeCount, "recipe"),
  ];
  // The page has one field: the catalog filter. Site-wide search stays in the header.
  return html`<section class="hero">
<h1>${readme.title}</h1>
<p class="hero-lead">${sentences(readme.lead)[0] ?? ""}</p>
<div class="hero-meta">
<a class="button secondary" href="${config.href(site.docs.route)}">Read the docs${raw(icon("chevron"))}</a>
<ul class="stats">${stats.map((stat) => html`<li>${stat}</li>`)}${registries.length ? html`<li>Published to ${registries.join(" and ")}</li>` : ""}</ul>
</div>
<form class="filter" role="search" aria-label="Filter images" data-filter>
<div class="filter-input">${raw(icon("search"))}<input type="search" name="q" placeholder="Filter ${plural(catalog.tools.length, "image")}…" aria-label="Filter images" autocomplete="off" spellcheck="false"></div>
<span class="select"><select name="category" aria-label="Category"><option value="">All categories</option>${catalog.categories.map(({ slug, meta }) => html`<option value="${slug}">${meta.title}</option>`)}</select>${raw(icon("chevron"))}</span>
</form>
<p class="filter-status" role="status" data-filter-status></p>
</section>`;
}

/** The catalog: a hero from the root README, then images grouped by category in `order`. */
export function homePage({ site, readme, icon }) {
  const { catalog, config } = site;
  return html`<div class="container home">
${hero(site, readme, icon)}
${catalog.categories.map(
  (category) => html`<section class="group" id="${categoryAnchor(category.slug)}" aria-labelledby="${categoryAnchor(category.slug)}-title" data-group>
<header class="group-head">
<h2 class="group-title" id="${categoryAnchor(category.slug)}-title"><a href="${config.href(categoryRoute(category))}">${category.meta.title}</a> <span class="count" data-count>${category.tools.length}</span></h2>
<p class="group-desc">${category.meta.description}</p>
</header>
<ul class="rows">${category.tools.map((tool) => toolRow(tool, site, icon))}</ul>
</section>`,
)}
<div class="empty" data-filter-empty hidden><p>No images match these filters.</p><button type="button" class="button secondary" data-filter-reset>Clear filters</button></div>
</div>`;
}
