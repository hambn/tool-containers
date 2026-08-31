import { icon } from "../lib/icons.mjs";

/** The 404 page served by GitHub Pages for unknown paths. */
export function renderNotFound(config) {
  return `<main class="content" id="content">
<div class="content-inner">
<section class="not-found empty">
<span class="empty-media">${icon("inbox")}</span>
<h1 class="empty-title">Page not found</h1>
<p class="empty-description">That page does not exist, or it moved when the site was last generated from the repository.</p>
<div class="empty-content">
<a class="btn btn-primary" href="${config.href("/")}">Back to home</a>
<a class="btn btn-outline" href="${config.href("/docs/")}">Open the docs</a>
</div>
</section>
</div>
</main>`;
}
