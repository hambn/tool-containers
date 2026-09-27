import { escapeHtml, firstSentence } from "../lib/html.mjs";
import { icon } from "../lib/icons.mjs";
import { platformRoute, toolRoute } from "../lib/site.mjs";

function toolCard(tool, site) {
  const { href } = site.config;
  const { meta } = tool;
  // Lower-cased haystack for the client-side filter; the card text is the
  // visible half, keywords and image name widen what a query can hit.
  const haystack = [meta.name, tool.category, meta.description, meta.image, ...meta.keywords, ...tool.platforms.map((p) => p.meta.name)]
    .join(" ")
    .toLowerCase();
  const recipes = tool.platforms
    .map((platform) => `<li><a href="${href(platformRoute(tool, platform))}">${escapeHtml(platform.meta.name)}</a></li>`)
    .join("");
  return `<li class="card tool" data-category="${escapeHtml(tool.category)}" data-platforms="${tool.platforms.map((p) => p.slug).join(" ")}" data-search="${escapeHtml(haystack)}">
<h3><a class="card-link" href="${href(toolRoute(tool))}">${escapeHtml(meta.name)}</a></h3>
<p>${escapeHtml(meta.description)}</p>
${meta.image ? `<code class="image">${escapeHtml(meta.image)}</code>` : ""}
${recipes ? `<ul class="pills" aria-label="${escapeHtml(meta.name)} recipes">${recipes}</ul>` : ""}
</li>`;
}

/** Radio "chips": native keyboard handling and form state for free. */
function chipGroup(name, legend, options) {
  const chips = [["", "All"], ...options]
    .map(([value, label]) => `<label class="chip"><input type="radio" name="${name}" value="${escapeHtml(value)}"${value ? "" : " checked"}>${escapeHtml(label)}</label>`)
    .join("");
  return `<fieldset><legend>${legend}</legend>${chips}</fieldset>`;
}

/**
 * The landing page: the root README's catalog as a filterable card grid. The
 * cards are plain HTML; the filter form is revealed only when the client
 * script runs, so without JavaScript every card simply stays visible.
 */
export function renderHome({ site, doc }) {
  const { config, catalog } = site;
  const sections = catalog.categories
    .map(
      ({ name, tools }) => `<section class="group" data-group="${escapeHtml(name)}" aria-labelledby="cat-${escapeHtml(name)}">
<h2 id="cat-${escapeHtml(name)}">${escapeHtml(name)} <span class="count">${tools.length}</span></h2>
<ul class="cards">${tools.map((tool) => toolCard(tool, site)).join("")}</ul>
</section>`,
    )
    .join("\n");

  return `<main id="content" class="home" tabindex="-1">
<section class="hero">
<p class="eyebrow">Container image catalog</p>
<h1>${doc.titleHtml}</h1>
<p class="lead">${escapeHtml(firstSentence(doc.lead))}</p>
<p class="stats"><span><strong>${site.tools.length}</strong> images</span><span><strong>${site.platformCount}</strong> deployment recipes</span><span><strong>${site.platforms.size}</strong> platforms</span></p>
<p class="actions"><a class="btn primary" href="${config.href("/docs/")}">Read the docs</a><a class="btn" href="${config.href("/search/")}" data-open-search>${icon("search")}Search</a></p>
</section>
<form class="filters" data-filter hidden role="search" aria-label="Filter images">
<div class="field">${icon("search")}<label class="sr-only" for="filter-q">Filter images</label><input id="filter-q" name="q" type="search" placeholder="Filter by name, keyword, or image…" autocomplete="off" spellcheck="false"></div>
${chipGroup("category", "Category", catalog.categories.map(({ name }) => [name, name]))}
${chipGroup("platform", "Platform", [...site.platforms])}
</form>
<p class="sr-only" role="status" data-filter-status></p>
${sections}
<div class="empty" data-filter-empty hidden><p>No images match these filters.</p><button class="btn" type="button" data-filter-reset>Clear filters</button></div>
</main>`;
}
