import { escapeHtml } from "./html.mjs";
import { icon, sprite, usedIcons } from "./icons.mjs";
import { SITE_NAME, headTags } from "./seo.mjs";

const NAV = [
  { label: "Catalog", route: "/", kinds: ["home"] },
  { label: "Docs", route: "/docs/", kinds: ["docs", "tool", "platform"] },
];

const HAS_SIDEBAR = new Set(["docs", "tool", "platform"]);

function header(page, { config }, assets) {
  const links = NAV.map(({ label, route, kinds }) => {
    const current = kinds.includes(page.kind) ? ' aria-current="page"' : "";
    return `<a href="${config.href(route)}"${current}>${label}</a>`;
  }).join("");
  const menu = HAS_SIDEBAR.has(page.kind)
    ? `<button class="icon-btn menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button>`
    : "";
  // The search trigger is a real link to /search/ so it works without
  // JavaScript; the client script upgrades it to open the search dialog.
  return `<header class="header"><div class="header-in">
${menu}<a class="brand" href="${config.href("/")}"><span class="logo" aria-hidden="true">&gt;_</span>${SITE_NAME}</a>
<nav class="nav" aria-label="Main">${links}</nav>
<a class="search-trigger" href="${config.href("/search/")}" data-search-index="${assets.searchIndex}">${icon("search")}<span>Search docs…</span><kbd aria-hidden="true">/</kbd></a>
<a class="icon-btn" href="${config.repoUrl}" rel="noopener" aria-label="Source on GitHub">${icon("github")}</a>
<button class="icon-btn theme" type="button" aria-label="Dark theme" aria-pressed="false">${icon("sun")}${icon("moon")}</button>
</div></header>`;
}

function footer(page, { config }) {
  const source = page.source
    ? `<a href="${config.blobUrl(page.source)}" rel="noopener">Edit this page on GitHub</a>`
    : "";
  return `<footer class="footer"><div class="footer-in">
<p>${SITE_NAME} · container images for AI coding agents and dev boxes</p>
<nav aria-label="Footer">${source}<a href="${config.href("/sitemap.xml")}">Sitemap</a><a href="${config.repoUrl}" rel="noopener">GitHub</a></nav>
</div></footer>`;
}

/**
 * Assemble a complete HTML document. Styles and behaviour are shared,
 * content-addressed files cached across pages; the only inline script sets the
 * theme before first paint so dark-mode readers never see a light flash.
 */
export function renderPage({ page, site, meta, body, modified, structuredData, assets }) {
  const { config } = site;
  const chrome = `${header(page, site, assets)}${body}${footer(page, site)}`;
  const jsonLd = structuredData
    ? `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${headTags(page, site, meta, modified).join("\n")}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">
<link rel="icon" href="${config.href("/favicon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${config.href("/apple-touch-icon.png")}">
<link rel="manifest" href="${config.href("/site.webmanifest")}">
<link rel="sitemap" type="application/xml" href="${config.href("/sitemap.xml")}">
<link rel="stylesheet" href="${assets.styles}">
<script>${assets.themeScript}</script>
<script src="${assets.script}" defer></script>
${jsonLd}
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
${sprite(usedIcons(chrome))}
${chrome}
</body>
</html>
`;
}

/** A labelled list of links rendered as small pills. */
export function pills(items, label) {
  if (!items.length) return "";
  return `<ul class="pills" aria-label="${escapeHtml(label)}">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}
