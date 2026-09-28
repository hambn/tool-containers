import { html } from "../lib/html.mjs";

/** GitHub Pages serves this for any missing path, so every link is root-relative. */
export function notFoundPage({ page, site }) {
  const { config } = site;
  return html`<div class="container narrow not-found">
<p class="muted">404</p>
<h1>${page.heading}</h1>
<p>The page you asked for does not exist or has moved.</p>
<p class="actions-row"><a class="button" href="${config.href("/")}">Browse the catalog</a><a class="button ghost" href="${config.href("/search/")}" data-search-open>Search docs</a></p>
</div>`;
}
