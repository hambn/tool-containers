import { escapeHtml } from "../lib/html.mjs";
import { icon } from "../lib/icons.mjs";
import { pills } from "../lib/layout.mjs";
import { breadcrumbTrail } from "../lib/seo.mjs";
import { pageLabel, platformRoute, toolRoute } from "../lib/site.mjs";

const current = (active) => (active ? ' aria-current="page"' : "");

/**
 * The docs tree: category → tool → recipes. Recipes are listed only under the
 * tool being read; the other tools stay one line each so the whole catalog
 * fits on screen.
 */
function sidebar(page, site) {
  const { href } = site.config;
  const groups = site.catalog.categories
    .map(({ name, tools }) => {
      const items = tools
        .map((tool) => {
          const open = page.tool === tool;
          const recipes = open
            ? `<ul>${tool.platforms
                .map((platform) => `<li><a href="${href(platformRoute(tool, platform))}"${current(page.platform === platform)}>${escapeHtml(platform.meta.name)}</a></li>`)
                .join("")}</ul>`
            : "";
          return `<li${open ? ' class="open"' : ""}><a href="${href(toolRoute(tool))}"${current(open && page.kind === "tool")}>${escapeHtml(tool.meta.name)}</a>${recipes}</li>`;
        })
        .join("");
      return `<p class="side-group">${escapeHtml(name)}</p><ul>${items}</ul>`;
    })
    .join("");
  return `<aside class="sidebar" id="sidebar"><nav aria-label="Documentation">
<ul><li><a href="${href("/docs/")}"${current(page.kind === "docs")}>Overview</a></li></ul>
${groups}
</nav></aside>`;
}

function breadcrumbs(page, { config }) {
  if (page.kind === "docs") return "";
  const items = breadcrumbTrail(page).map(({ label, route }) =>
    route === page.route
      ? `<li><span aria-current="page">${escapeHtml(label)}</span></li>`
      : `<li><a href="${config.href(route)}">${escapeHtml(label)}</a></li>`,
  );
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.join("")}</ol></nav>`;
}

function tocAside(toc) {
  if (toc.length < 2) return "";
  const items = toc
    .map(({ level, id, text }) => `<li${level === 3 ? ' class="sub"' : ""}><a href="#${id}">${escapeHtml(text)}</a></li>`)
    .join("");
  return `<aside class="toc" aria-labelledby="toc-title"><p id="toc-title">On this page</p><ul>${items}</ul></aside>`;
}

function pager(page, site) {
  const { previous, next } = site.neighbours(page);
  const link = (target, rel, label) =>
    target
      ? `<a class="${rel}" rel="${rel}" href="${site.config.href(target.route)}"><span>${label}</span>${escapeHtml(pageLabel(target))}</a>`
      : "<span></span>";
  return `<nav class="pager" aria-label="Previous and next page">${link(previous, "prev", "Previous")}${link(next, "next", "Next")}</nav>`;
}

/** `docker pull` box for a tool image, from its frontmatter `image`. */
function pullBox(image) {
  return `<div class="pull" data-copy-scope><pre><code><span class="prompt" aria-hidden="true">$ </span>docker pull ${escapeHtml(image)}</code></pre><button type="button" class="copy" data-copy aria-label="Copy pull command">${icon("copy")}${icon("check")}</button></div>`;
}

function toolHeader(tool, site) {
  const { meta } = tool;
  const links = [
    meta.upstream ? `<a href="${escapeHtml(meta.upstream)}" rel="noopener">${icon("external")}Upstream project</a>` : "",
    `<a href="${site.config.treeUrl(`tools/${tool.category}/${tool.slug}`)}" rel="noopener">${icon("github")}Source</a>`,
  ].filter(Boolean);
  return `${meta.image ? pullBox(meta.image) : ""}
<p class="doc-links">${links.join("")}</p>
${pills(meta.keywords.map(escapeHtml), "Keywords")}`;
}

/** Recipe cards on a tool page: the fastest route from "what is it" to "run it". */
function recipeCards(tool, site, id) {
  if (!tool.platforms.length) return "";
  const cards = tool.platforms
    .map(
      (platform) => `<li class="card"><h3><a class="card-link" href="${site.config.href(platformRoute(tool, platform))}">${escapeHtml(platform.meta.name)}</a></h3><p>${escapeHtml(platform.meta.usecase)}</p></li>`,
    )
    .join("");
  return `<section class="recipes" aria-labelledby="${id}"><h2 id="${id}"><a class="anchor" href="#${id}">Deployment recipes</a></h2><ul class="cards">${cards}</ul></section>`;
}

/** Tabs linking a recipe to its siblings, so switching platform is one click. */
function platformTabs(page, site) {
  const { tool } = page;
  if (tool.platforms.length < 2) return "";
  const tabs = tool.platforms
    .map((platform) => `<a href="${site.config.href(platformRoute(tool, platform))}"${current(platform === page.platform)}>${escapeHtml(platform.meta.name)}</a>`)
    .join("");
  return `<nav class="tabs" aria-label="${escapeHtml(tool.meta.name)} recipes">${tabs}</nav>`;
}

function platformHeader(page) {
  const { meta } = page.platform;
  return `<p class="usecase"><strong>Use case</strong> ${escapeHtml(meta.usecase)}</p>
${pills(meta.keywords.map(escapeHtml), "Keywords")}`;
}

/**
 * Three-column documentation layout: the docs tree, the document, and an
 * on-page table of contents when the document has enough headings for one.
 * @param {{ page: any, site: any, doc: import("../lib/markdown.mjs").Rendered, meta: { description: string } }} input
 */
export function renderDoc({ page, site, doc, meta }) {
  const toc = [...doc.toc];
  let extras = "";
  let intro = "";
  if (page.kind === "tool") {
    intro = toolHeader(page.tool, site);
    // The id must not collide with a heading from the document itself.
    const taken = new Set(toc.map((entry) => entry.id));
    let id = "deployment-recipes";
    while (taken.has(id)) id = `${id}-x`;
    extras = recipeCards(page.tool, site, id);
    if (extras) toc.unshift({ level: 2, id, text: "Deployment recipes" });
  } else if (page.kind === "platform") {
    intro = platformHeader(page);
  }
  const eyebrow = page.tool ? escapeHtml(page.tool.category) : "Documentation";

  return `<div class="docs${toc.length >= 2 ? " with-toc" : ""}">
${sidebar(page, site)}
<div class="backdrop" data-close-nav hidden></div>
<main id="content" class="doc" tabindex="-1">
${breadcrumbs(page, site)}
${page.kind === "platform" ? platformTabs(page, site) : ""}
<header class="doc-head">
<p class="eyebrow">${eyebrow}</p>
<h1>${doc.titleHtml || escapeHtml(pageLabel(page))}</h1>
<p class="lead">${escapeHtml(meta.description)}</p>
${intro}
</header>
${extras}
<article class="prose">${doc.html}</article>
${pager(page, site)}
</main>
${tocAside(toc)}
</div>`;
}
