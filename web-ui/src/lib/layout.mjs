import { escapeHtml } from "./markdown.mjs";
import { icon, sprite, usedIcons } from "./icons.mjs";

const SITE_NAME = "tool-containers";
const NAV = [
  { label: "Home", route: "/", kinds: ["home"] },
  { label: "Docs", route: "/docs/", kinds: ["docs-index", "tool", "example"] },
];

/** Pages whose layout includes the docs sidebar and its mobile drawer. */
const WITH_SIDEBAR = new Set(["docs-index", "tool", "example"]);

/* ------------------------------------------------------------------ head */

function meta(attribute, name, content) {
  return `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`;
}

function head({ page, meta: pageMeta, config, assets, structuredData }) {
  const title = page.kind === "home" ? pageMeta.title : `${pageMeta.title} · ${SITE_NAME}`;
  const canonical = config.canonical(page.route);
  const indexable = page.kind !== "404";
  const ogImage = config.canonical("/og.png");

  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    meta("name", "description", pageMeta.description),
    indexable
      ? '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'
      : '<meta name="robots" content="noindex, follow">',
    `<link rel="canonical" href="${canonical}">`,
    '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">',
    '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#09090b">',
    '<meta name="color-scheme" content="light dark">',
    meta("property", "og:type", page.kind === "tool" || page.kind === "example" ? "article" : "website"),
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:locale", "en_US"),
    meta("property", "og:title", title),
    meta("property", "og:description", pageMeta.description),
    meta("property", "og:url", canonical),
    meta("property", "og:image", ogImage),
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    meta("property", "og:image:alt", `${SITE_NAME} — container images for AI agents, CI and sandboxes`),
    '<meta name="twitter:card" content="summary_large_image">',
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", pageMeta.description),
    meta("name", "twitter:image", ogImage),
    `<link rel="icon" href="${assets.favicon}" sizes="any" type="image/svg+xml">`,
    `<link rel="apple-touch-icon" href="${assets.appleTouchIcon}">`,
    `<link rel="manifest" href="${assets.manifest}">`,
    `<link rel="preload" href="${assets.styles}" as="style">`,
    `<link rel="stylesheet" href="${assets.styles}">`,
    structuredData
      ? `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>`
      : "",
    `<script>${assets.themeScript}</script>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ---------------------------------------------------------------- header */

function siteHeader({ page, config }) {
  const links = NAV.map(({ label, route, kinds }) => {
    const active = kinds.includes(page.kind);
    return `<a class="top-link${active ? " active" : ""}"${active ? ' aria-current="page"' : ""} href="${config.href(route)}">${label}</a>`;
  }).join("");

  const drawerToggle = WITH_SIDEBAR.has(page.kind)
    ? `<button class="icon-btn nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button>`
    : "";

  return `<header class="site-header">
<div class="header-inner">
${drawerToggle}<a class="brand" href="${config.href("/")}" aria-label="${SITE_NAME} home"><span class="brand-mark" aria-hidden="true">&gt;_</span><span class="brand-name">${SITE_NAME}</span></a>
<nav class="top-nav" aria-label="Main">${links}</nav>
<div class="header-actions">
<a class="icon-btn" href="${config.repoUrl}" aria-label="View this project on GitHub" rel="noopener">${icon("github")}</a>
<button class="icon-btn theme-toggle" type="button" aria-label="Switch between light and dark theme">${icon("sun", "ic-sun")}${icon("moon", "ic-moon")}</button>
</div>
</div>
</header>`;
}

/** Page kinds that render one document a reader could sensibly go and edit. */
const EDITABLE = new Set(["home", "tool", "example"]);

function siteFooter({ page, config }) {
  const source = EDITABLE.has(page.kind) ? page.source : null;
  return `<footer class="site-footer">
<p class="footer-note">Generated from the repository's own documentation.</p>
<nav class="footer-links" aria-label="Footer">
${source ? `<a href="${config.blobUrl(source)}" rel="noopener">Edit this page</a>` : ""}
<a href="${config.repoUrl}" rel="noopener">GitHub</a>
</nav>
</footer>`;
}

/* ----------------------------------------------------------------- shell */

/**
 * Assemble one page: head, header, the page's own body, and the shared footer.
 * Styles and behaviour are shared static assets, so a visitor downloads them
 * once for the whole site; only the sprite is inlined, subset to the icons the
 * page actually references.
 */
export function renderShell({ page, body, meta: pageMeta, config, assets, structuredData }) {
  const chrome = `${siteHeader({ page, config })}${body}${siteFooter({ page, config })}`;
  return `<!doctype html>
<html lang="en">
<head>
${head({ page, meta: pageMeta, config, assets, structuredData })}
</head>
<body>
${sprite(usedIcons(chrome))}
<a class="skip-link" href="#content">Skip to content</a>
${chrome}
<script src="${assets.script}" defer></script>
</body>
</html>
`;
}
