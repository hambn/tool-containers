import { icon } from "../lib/icons.mjs";

export function renderNotFound({ site }) {
  const { href } = site.config;
  return `<main id="content" class="narrow center" tabindex="-1">
<p class="eyebrow">404</p>
<h1>Page not found</h1>
<p class="lead">The page may have moved when a tool or recipe was renamed. Search for it, or start from the catalog.</p>
<form class="search-form" action="${href("/search/")}" method="get" role="search">
<div class="field">${icon("search")}<label class="sr-only" for="search-q">Search the documentation</label><input id="search-q" name="q" type="search" placeholder="Search tools, platforms, docs…" autocomplete="off"></div>
<button class="btn primary" type="submit">Search</button>
</form>
<p class="actions"><a class="btn" href="${href("/")}">Catalog</a><a class="btn" href="${href("/docs/")}">Docs</a></p>
</main>`;
}
