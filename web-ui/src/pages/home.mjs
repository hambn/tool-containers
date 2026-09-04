import { escapeHtml, catalogDescriptions, leadParagraph, truncate } from "../lib/markdown.mjs";
import { icon } from "../lib/icons.mjs";

/** A tool in the catalog grid: name, one-line description, example count. */
function toolCard({ category, tool, platforms, description, config }) {
  const examples = platforms.length === 1 ? "1 example" : `${platforms.length} examples`;
  return `<li class="tool-card">
<a class="tool-link" href="${config.href(`/docs/${category}/${tool}/`)}">
<span class="tool-head">
<span class="tool-icon">${icon("box")}</span>
<span class="tool-name">${escapeHtml(tool)}</span>
${icon("arrow", "tool-arrow")}
</span>
<span class="tool-desc">${escapeHtml(truncate(description, 120))}</span>
${platforms.length ? `<span class="tool-meta">${icon("layers")}${examples}</span>` : ""}
</a>
</li>`;
}

function categorySection({ category, tools, descriptions, documents, config }) {
  const heading = `<div class="section-head">
<h2 id="${escapeHtml(category)}">${escapeHtml(category)}</h2>
${tools.length ? `<span class="badge badge-secondary">${tools.length}</span>` : ""}
</div>`;

  if (!tools.length) {
    return `<section class="tool-section" aria-labelledby="${escapeHtml(category)}">
${heading}
<div class="empty empty-sm">
<span class="empty-media">${icon("inbox")}</span>
<p class="empty-title">Nothing here yet</p>
</div>
</section>`;
  }

  const cards = tools
    .map(({ tool, platforms, readme }) =>
      toolCard({
        category,
        tool,
        platforms,
        description: descriptions.get(`tools/${category}/${tool}`) || leadParagraph(documents.get(readme)),
        config,
      }),
    )
    .join("\n");

  return `<section class="tool-section" aria-labelledby="${escapeHtml(category)}">
${heading}
<ul class="tool-grid">${cards}</ul>
</section>`;
}

/**
 * The landing page. Every number, description and card comes from the
 * repository: the hero from the root README, the sections from the directories
 * under `tools/`. It is the one page not rendered from a single document.
 */
export function renderHome({ site, documents }) {
  const { config, catalog, toolCount, exampleCount } = site;
  const readme = documents.get("README.md");
  const lead = leadParagraph(readme);
  const descriptions = catalogDescriptions(readme);

  const stats = [
    ["Tools", toolCount],
    ["Examples", exampleCount],
    ["Categories", catalog.length],
  ]
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");

  const hero = `<section class="hero">
<div class="hero-grid" aria-hidden="true"></div>
<p class="badge badge-outline">${icon("terminal")}Container image catalog</p>
<h1>tool-containers</h1>
<p class="lead">${escapeHtml(lead)}</p>
<div class="hero-actions">
<a class="btn btn-primary" href="${config.href("/docs/")}">Browse the catalog${icon("arrow", "btn-icon")}</a>
<a class="btn btn-outline" href="${config.repoUrl}" rel="noopener">${icon("github")}View source</a>
</div>
<dl class="hero-stats">${stats}</dl>
</section>`;

  const sections = catalog
    .map(({ category, tools }) => categorySection({ category, tools, descriptions, documents, config }))
    .join("\n");

  return `<main class="content home" id="content">
<div class="content-inner wide">
${hero}
${sections}
</div>
</main>`;
}
