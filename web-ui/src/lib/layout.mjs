import { SITE_NAME } from "./config.mjs";
import { html, raw } from "./html.mjs";
import { THEME_COLORS, headTags, jsonLdScript } from "./seo.mjs";

/** Ids the page chrome uses, reserved so document headings never collide with them. */
export const TEMPLATE_IDS = ["main", "menu", "menu-title", "search", "search-input", "search-results", "search-status", "on-this-page", "toc-title"];

const NAV = [
  { label: "Catalog", kinds: ["home"], page: (site) => site.home },
  { label: "Docs", kinds: ["docs", "tool", "platform"], page: (site) => site.docs },
];

const LOGO = raw(
  '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="currentColor"/><path d="M6.5 10.5 13.5 16l-7 5.5" fill="none" stroke="var(--bg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="20.5" width="10" height="3" rx="1.2" fill="var(--bg)"/></svg>',
);

/**
 * Primary navigation. `aria-current="page"` marks only the page itself;
 * a section's descendants get the active style without claiming to be it.
 */
function mainNav(page, site, className) {
  return NAV.map(({ label, kinds, page: target }) => {
    const self = target(site);
    const current = page === self ? raw(' aria-current="page"') : "";
    const active = kinds.includes(page.kind) ? " active" : "";
    return html`<a class="${className}${active}" href="${site.config.href(self.route)}"${current}>${label}</a>`;
  });
}

/** The docs tree: overview, then each category page with its tools and their platforms. */
export function docsNav(page, site) {
  const { config, catalog } = site;
  const link = (target, className) => {
    const current = target === page ? raw(' aria-current="page"') : "";
    return html`<a class="${className}" href="${config.href(target.route)}"${current}>${target.label}</a>`;
  };
  const families = new Map(catalog.tools.map((tool) => [tool, site.toolFamily(tool)]));
  return html`<ul class="tree">
<li>${link(site.docs, "tree-link")}</li>
${catalog.categories.map(
  (category) => html`<li class="tree-group">${link(site.categoryPage(category), "tree-label")}<ul>${category.tools.map((tool) => {
    const [toolPage, ...platforms] = families.get(tool);
    // Platforms show only under the tool being read, keeping the tree short.
    const open = page.tool === tool;
    return html`<li>${link(toolPage, "tree-link")}${open ? html`<ul class="tree-sub">${platforms.map((platform) => html`<li>${link(platform, "tree-link")}</li>`)}</ul>` : ""}</li>`;
  })}</ul></li>`,
)}
</ul>`;
}

function header(page, site, icon) {
  const { config } = site;
  return html`<header class="header"><div class="container header-inner">
<a class="brand" href="${config.href("/")}">${LOGO}<span>${SITE_NAME}</span></a>
<nav class="nav" aria-label="Main">${mainNav(page, site, "tab")}</nav>
<div class="actions">
<a class="search-trigger" href="${config.href("/search/")}" data-search-open aria-label="Search docs" aria-keyshortcuts="Control+K Meta+K">${raw(icon("search"))}<span class="search-label">Search docs…</span><kbd data-hotkey>Ctrl K</kbd></a>
<a class="icon-btn" href="${config.repoUrl}" aria-label="${SITE_NAME} on GitHub">${raw(icon("github"))}</a>
<button class="icon-btn theme" type="button" data-theme-toggle aria-label="Toggle dark theme">${raw(icon("sun"))}${raw(icon("moon"))}</button>
<button class="icon-btn menu-open" type="button" data-menu-open aria-label="Open menu" aria-haspopup="dialog" aria-controls="menu">${raw(icon("menu"))}</button>
</div>
</div></header>`;
}

/** Mobile navigation sheet: a modal `<dialog>`, so focus trapping and Esc come from the browser. */
function menu(page, site, icon) {
  return html`<dialog class="sheet" id="menu" aria-labelledby="menu-title">
<div class="sheet-head"><span class="sheet-title" id="menu-title">Menu</span><button class="icon-btn" type="button" data-menu-close aria-label="Close menu">${raw(icon("close"))}</button></div>
<nav class="sheet-nav" aria-label="Main">${mainNav(page, site, "sheet-link")}</nav>
<nav class="sheet-docs" aria-label="Documentation">${docsNav(page, site)}</nav>
<button class="sheet-theme" type="button" data-theme-toggle>${raw(icon("sun"))}${raw(icon("moon"))}<span>Toggle theme</span></button>
</dialog>`;
}

function searchDialog(icon) {
  return html`<dialog class="search" id="search" aria-label="Search docs">
<div class="search-box">${raw(icon("search"))}<input id="search-input" type="text" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search docs…" aria-label="Search docs"><button class="search-close" type="button" data-search-close aria-label="Close search"><kbd>Esc</kbd>${raw(icon("close"))}</button></div>
<div class="search-results" id="search-results" role="listbox" aria-label="Search results"></div>
<div class="search-foot"><span id="search-status" role="status"></span><span class="hints" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>↵</kbd> open <kbd>Esc</kbd> close</span></div>
</dialog>`;
}

function footer(site) {
  const { config } = site;
  return html`<footer class="footer"><div class="container footer-inner">
<span>${SITE_NAME}</span>
<nav aria-label="Footer"><a href="${config.href("/")}">Catalog</a><a href="${config.href("/docs/")}">Docs</a><a href="${config.href("/llms.txt")}">llms.txt</a><a href="${config.repoUrl}">GitHub</a></nav>
</div></footer>`;
}

/**
 * A complete HTML document. The only inline script applies a stored theme
 * before first paint; everything else is shared, content-addressed files.
 */
export function renderPage({ page, site, seo, main, assets, icon }) {
  const { config } = site;
  return String(html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${raw(headTags(page, site, seo))}
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${THEME_COLORS.light}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${THEME_COLORS.dark}">
<link rel="icon" href="${config.href("/favicon.ico")}" sizes="180x180">
<link rel="icon" href="${config.href("/favicon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${config.href("/apple-touch-icon.png")}">
<link rel="manifest" href="${config.href("/site.webmanifest")}">
<link rel="stylesheet" href="${assets.css}">
<script>${raw(assets.theme)}</script>
<script type="module" src="${assets.js}"></script>
${raw(jsonLdScript(seo.structuredData))}
</head>
<body class="page-${page.kind}" data-search-index="${assets.index}" data-page-name="${page.reading ? page.name : ""}">
<a class="skip" href="#main">Skip to content</a>
${header(page, site, icon)}
${menu(page, site, icon)}
<main id="main">${main}</main>
${footer(site)}
${searchDialog(icon)}
</body>
</html>
`);
}
