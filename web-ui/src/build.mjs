import fs from "node:fs";
import path from "node:path";
import { resolveConfig, lastModified, repoRoot, uiRoot } from "./lib/config.mjs";
import { buildSite } from "./lib/catalog.mjs";
import { createTheme } from "./lib/highlight.mjs";
import { renderDocument, tableOfContents } from "./lib/markdown.mjs";
import { createAssets, readStyles, minifyCss, minifyJs } from "./lib/assets.mjs";
import { pageMeta, structuredData } from "./lib/seo.mjs";
import { renderShell } from "./lib/layout.mjs";
import { renderHome } from "./pages/home.mjs";
import { renderDocs } from "./pages/docs.mjs";
import { renderNotFound } from "./pages/not-found.mjs";

const distRoot = path.join(uiRoot, "dist");

const FONTS = [
  ["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "fonts/inter-latin.woff2"],
  ["@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2", "fonts/jetbrains-mono-latin.woff2"],
];

const config = resolveConfig();
const site = buildSite(config);
const theme = await createTheme();
const assets = createAssets({ distRoot, config });

fs.rmSync(distRoot, { recursive: true, force: true });

/** Every source document, read once and shared by rendering, meta and search. */
const documents = new Map();
for (const page of site.pages) {
  if (!documents.has(page.source)) {
    documents.set(page.source, fs.readFileSync(path.join(repoRoot, page.source), "utf8"));
  }
}

/*
 * Pass 1 — render page bodies. Highlighting interns its token styles as it
 * runs, so the stylesheet can only be written once every fence is rendered.
 */
const rendered = [];
for (const page of site.pages) {
  const markdown = documents.get(page.source);
  const meta = pageMeta(page, markdown, site);
  const modified = lastModified(page.source);
  let body;

  if (page.kind === "home") {
    body = renderHome({ site, documents });
  } else if (page.kind === "docs-index") {
    body = renderDocs({ page, site, documents });
  } else {
    const article = await renderDocument(markdown, { sourceDir: path.posix.dirname(page.source), site, theme });
    body = renderDocs({ page, site, documents, article, toc: tableOfContents(article) });
  }

  rendered.push({ page, body, meta, modified, structuredData: structuredData(page, { site, meta, markdown, modified }) });
}

/* Pass 2 — emit the shared assets, then the pages that reference them. */

for (const [from, to] of FONTS) {
  assets.copy(path.join(uiRoot, "node_modules", from), to);
}

const publicDir = path.join(uiRoot, "public");
for (const file of fs.readdirSync(publicDir)) {
  assets.copy(path.join(publicDir, file), file);
}

const styles = assets.emit(
  "site.css",
  minifyCss(["base.css", "home.css", "docs.css"].map((file) => readStyles(`styles/${file}`, config)).join("\n") + theme.css()),
);
const script = assets.emit("site.js", minifyJs(fs.readFileSync(path.join(uiRoot, "src/client/site.js"), "utf8")));
const themeScript = minifyJs(fs.readFileSync(path.join(uiRoot, "src/client/theme.js"), "utf8"));

const shared = {
  styles,
  script,
  themeScript,
  favicon: config.href("/favicon.svg"),
  appleTouchIcon: config.href("/apple-touch-icon.png"),
  manifest: config.href("/site.webmanifest"),
};

for (const { page, body, meta, structuredData: data } of rendered) {
  const html = renderShell({ page, body, meta, config, assets: shared, structuredData: data });
  assets.write(path.join(page.route, "index.html"), html);
}

const notFound = { id: "404", kind: "404", route: "/404.html", source: null };
assets.write(
  "404.html",
  renderShell({
    page: notFound,
    body: renderNotFound(config),
    meta: { title: "Page not found", description: "This page is not part of the tool-containers site." },
    config,
    assets: shared,
  }),
);

/* Discovery: a sitemap dated from the repository's own history, and robots. */

const urls = rendered
  .map(({ page, modified }) => {
    const lastmod = modified ? `<lastmod>${modified}</lastmod>` : "";
    return `  <url><loc>${config.canonical(page.route)}</loc>${lastmod}</url>`;
  })
  .join("\n");

assets.write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
assets.write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${config.canonical("/sitemap.xml")}\n`);

console.log(`built ${rendered.length} pages + /404.html into ${path.relative(uiRoot, distRoot)}/`);
