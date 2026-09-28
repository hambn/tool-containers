import { html, raw } from "../lib/html.mjs";

/**
 * The full results page. It shares the dialog's engine; the form submits to
 * itself, so the query lives in the URL and results are linkable.
 */
export function searchPage({ page, site, icon }) {
  const { config } = site;
  return html`<div class="container narrow search-page">
<h1>${page.heading}</h1>
<form class="search-form" action="${config.href(page.route)}" role="search" data-search-page>
<div class="filter-input">${raw(icon("search"))}<input type="search" name="q" placeholder="Search docs…" aria-label="Search docs" autocomplete="off" spellcheck="false"></div>
<button class="button" type="submit">Search</button>
</form>
<p class="search-count" role="status" data-search-count></p>
<ol class="search-list" data-search-list></ol>
<noscript><p class="muted">Search runs in your browser and needs JavaScript. Browse the <a href="${config.href("/")}">catalog</a> or the <a href="${config.href("/docs/")}">documentation</a> instead.</p></noscript>
</div>`;
}
