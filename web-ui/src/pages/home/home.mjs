import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import {
  repoRoot,
  repoUrl,
  catalog,
  pages,
  basePath as base,
  siteOrigin,
} from "../../build/catalog.mjs";
import { escapeHtml, extractMeta, firstParagraph, catalogDescriptions, rewriteTargets } from "../../build/markdown.mjs";
import { icon } from "../../build/icons.mjs";

function toolCard({ category, tool, description }) {
  const page = pages.get(`images/${category}/${tool}/README.md`);
  return `<a class="tool-card" href="${page.route}">
<div class="tool-head">
<div class="tool-id"><span class="tool-icon">${icon("box")}</span><span class="tool-name">${escapeHtml(tool)}</span></div>
${icon("arrow", "tool-arrow")}
</div>
<p class="tool-desc clamp-2">${escapeHtml(description)}</p>
</a>`;
}

/** Prose between the README h1 and the first `## ` heading, minus the lead paragraph. */
function introHtml(preparedReadme) {
  const lines = preparedReadme.split("\n");
  const introEnd = lines.findIndex((line) => /^##\s/.test(line));
  const introLines = lines
    .slice(0, introEnd === -1 ? lines.length : introEnd)
    .filter((line) => !/^#\s/.test(line));
  return marked.parse(introLines.join("\n").trim()).replace(/<p>[\s\S]*?<\/p>/, "").trim();
}

/**
 * Landing page body: centered hero + stats + intro from the root README, then
 * one section per images/<category>/ directory. The only page not rendered
 * from a tool document; everything on it is generated from the repository.
 */
export function renderHomePage() {
  const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
  const prepared = rewriteTargets(readme, ".");
  const descriptions = catalogDescriptions(readme);
  const lead = firstParagraph(prepared);
  const intro = introHtml(prepared);
  const toolCount = catalog.reduce((sum, { tools }) => sum + tools.length, 0);
  const recipeCount = [...pages.values()].filter((page) => page.kind === "example").length;

  const hero = `<section class="hero">
<div class="hero-dots" aria-hidden="true"></div>
<span class="badge badge-outline">Docker image catalog</span>
<h1>tool-containers</h1>
${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ""}
<div class="hero-actions">
<a class="btn btn-primary" href="/#tools">Browse tools</a>
<a class="btn btn-outline" href="/docs/">Open the docs</a>
</div>
<dl class="hero-stats">
<div><dt>Tools</dt><dd>${toolCount}</dd></div>
<div><dt>Examples</dt><dd>${recipeCount}</dd></div>
<div><dt>Categories</dt><dd>${catalog.length}</dd></div>
</dl>
</section>`;

  const sections = catalog
    .map(({ category, tools }, index) => {
      const body = tools.length
        ? `<div class="tool-grid">${tools
            .map(({ tool }) => {
              const fallback = extractMeta(
                fs.readFileSync(path.join(repoRoot, "images", category, tool, "README.md"), "utf8"),
              ).description;
              const description = descriptions.get(`images/${category}/${tool}`) ?? fallback;
              return toolCard({ category, tool, description });
            })
            .join("\n")}</div>`
        : `<div class="empty empty-sm">
<div class="empty-header"><span class="empty-media">${icon("inbox")}</span><p class="empty-title">None yet</p></div>
</div>`;
      return `<section class="tool-section"${index === 0 ? ' id="tools"' : ""}>
<div class="section-head"><h2>${category}</h2>${
        tools.length ? `<span class="badge badge-secondary">${tools.length}</span>` : ""
      }</div>
${body}
</section>`;
    })
    .join("\n");

  const content = `<main class="content home-content" id="content">
<div class="content-inner wide">
${hero}
${intro ? `<div class="prose intro">${intro}</div>` : ""}
${sections}
</div>
</main>`;
  return { content, jsonLd: { "@context": "https://schema.org", "@type": "WebSite", name: "tool-containers", url: `${siteOrigin}${base}/` } };
}
