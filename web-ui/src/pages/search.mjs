import { escapeHtml } from "../lib/html.mjs";
import { icon } from "../lib/icons.mjs";
import { platformRoute, toolRoute } from "../lib/site.mjs";

/**
 * `/search/?q=` — the target of the WebSite SearchAction and the no-JavaScript
 * fallback for the header search. The form submits to itself; the client
 * script reads `q` and renders results from the static index. Without
 * JavaScript the page still lists every document, so nothing is unreachable.
 */
export function renderSearch({ site }) {
  const { href } = site.config;
  const all = site.catalog.categories
    .map(({ name, tools }) => {
      const items = tools
        .map(
          (tool) => `<li><a href="${href(toolRoute(tool))}">${escapeHtml(tool.meta.name)}</a> <span>${escapeHtml(tool.meta.description)}</span>${
            tool.platforms.length
              ? `<ul class="pills">${tool.platforms.map((p) => `<li><a href="${href(platformRoute(tool, p))}">${escapeHtml(p.meta.name)}</a></li>`).join("")}</ul>`
              : ""
          }</li>`,
        )
        .join("");
      return `<h2>${escapeHtml(name)}</h2><ul class="index-list">${items}</ul>`;
    })
    .join("");
  return `<main id="content" class="narrow" tabindex="-1" data-search-page>
<h1>Search</h1>
<form class="search-form" action="${href("/search/")}" method="get" role="search">
<div class="field">${icon("search")}<label class="sr-only" for="search-q">Search the documentation</label><input id="search-q" name="q" type="search" placeholder="Search tools, platforms, docs…" autocomplete="off" spellcheck="false"></div>
<button class="btn primary" type="submit">Search</button>
</form>
<p class="sr-only" role="status" data-search-status></p>
<ol class="results" data-search-results hidden></ol>
<section data-search-all aria-label="All pages">
<p class="muted js-hide">Search runs in your browser and needs JavaScript. Every page is listed below.</p>
${all}
</section>
</main>`;
}
