import { PLATFORMS } from "../lib/frontmatter.mjs";
import { html, raw, sentences } from "../lib/html.mjs";
import { copyButton } from "../lib/markdown.mjs";
import { categoryAnchor, categoryLabel, platformLabel, platformRoute, toolRoute } from "../lib/site.mjs";

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

function toolRow(tool, site, icon) {
  const { config } = site;
  const { meta } = tool;
  const bySlug = new Map(tool.platforms.map((platform) => [platform.slug, platform]));
  // The filter matches the same words search would: visible text plus keywords.
  const text = [meta.title, meta.description, meta.image, categoryLabel(tool.category), ...meta.keywords, ...tool.platforms.map((p) => p.meta.name)].join(" ");
  // Every row has a cell per platform in the same order, so columns line up.
  const cells = [...PLATFORMS.keys()].map((slug) => {
    const platform = bySlug.get(slug);
    if (!platform) return html`<span class="slot" aria-hidden="true"></span>`;
    return html`<a class="slot" href="${config.href(platformRoute(tool, platform))}" title="${meta.title} with ${platform.meta.name}">${platformLabel(platform)}</a>`;
  });
  return html`<li class="row" data-category="${tool.category}" data-platforms="${tool.platforms.map((p) => p.slug).join(" ")}" data-text="${text}">
<div class="row-main"><h3 class="row-title"><a href="${config.href(toolRoute(tool))}">${meta.title}</a></h3><p class="row-desc">${meta.description}</p></div>
<div class="row-image" data-copy-source><code>${meta.image}</code>${copyButton(icon, `Copy ${meta.image}`)}</div>
<nav class="row-platforms" aria-label="${meta.title} platforms">${cells}</nav>
</li>`;
}

function select(name, label, options) {
  return html`<select name="${name}" aria-label="${label}">${options.map(([value, text]) => html`<option value="${value}">${text}</option>`)}</select>`;
}

/** The catalog: a short intro from the root README, then images grouped by category. */
export function homePage({ site, readme, icon }) {
  const { catalog } = site;
  const total = catalog.tools.length;
  const usedPlatforms = [...PLATFORMS].filter(([slug]) => catalog.tools.some((tool) => tool.platforms.some((p) => p.slug === slug)));
  return html`<div class="container home">
<section class="intro">
<h1>${readme.title}</h1>
<p class="intro-lead">${sentences(readme.lead)[0] ?? ""}</p>
<p class="stats">${plural(total, "image")} · ${plural(site.recipeCount, "recipe")} · <a href="${site.config.href(site.docs.route)}">Read the docs</a></p>
</section>
<form class="filter" role="search" aria-label="Filter images" data-filter>
<div class="filter-input">${raw(icon("search"))}<input type="search" name="q" placeholder="Filter images…" aria-label="Filter images" autocomplete="off" spellcheck="false"></div>
${select("category", "Category", [["", "All categories"], ...catalog.categories.map(({ slug }) => [slug, categoryLabel(slug)])])}
${select("platform", "Platform", [["", "Any platform"], ...usedPlatforms])}
</form>
<p class="filter-status" role="status" data-filter-status></p>
${catalog.categories.map(
  (category) => html`<section class="group" id="${categoryAnchor(category.slug)}" aria-labelledby="${categoryAnchor(category.slug)}-title" data-group>
<h2 class="group-title" id="${categoryAnchor(category.slug)}-title">${categoryLabel(category.slug)} <span class="count" data-count>${category.tools.length}</span></h2>
<ul class="rows">${category.tools.map((tool) => toolRow(tool, site, icon))}</ul>
</section>`,
)}
<div class="empty" data-filter-empty hidden><p>No images match these filters.</p><button type="button" class="button" data-filter-reset>Clear filters</button></div>
</div>`;
}
