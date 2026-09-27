/**
 * Static site build: tracked markdown in, a self-contained `dist/` out.
 *
 *   content.mjs   discover documents, parse and validate frontmatter
 *   site.mjs      pages, routes, and navigation order
 *   markdown.mjs  render a document (links, headings, code, inline files)
 *   seo.mjs       titles, descriptions, JSON-LD, sitemap, robots, llms.txt
 *   search.mjs    the client search index
 *   layout.mjs + pages/*  HTML templates
 */
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { resolveConfig, lastModified, uiRoot } from "./lib/config.mjs";
import { ContentError, readInlineFiles } from "./lib/content.mjs";
import { buildSite } from "./lib/site.mjs";
import { createTheme } from "./lib/highlight.mjs";
import { renderMarkdown } from "./lib/markdown.mjs";
import { createAssets, readStyles, minifyCss, minifyJs } from "./lib/assets.mjs";
import { pageMeta, structuredData, sitemap, robots, llmsTxt } from "./lib/seo.mjs";
import { searchIndex } from "./lib/search.mjs";
import { renderPage } from "./lib/layout.mjs";
import { firstSentence } from "./lib/html.mjs";
import { renderHome } from "./pages/home.mjs";
import { renderDoc } from "./pages/doc.mjs";
import { renderSearch } from "./pages/search.mjs";
import { renderNotFound } from "./pages/not-found.mjs";

const distRoot = path.join(uiRoot, "dist");
const STYLES = ["base.css", "layout.css", "components.css", "prose.css"];

const config = resolveConfig();
let site;
try {
  site = buildSite(config);
} catch (error) {
  if (!(error instanceof ContentError)) throw error;
  console.error(`build failed: ${error.message}`);
  process.exit(1);
}
const theme = await createTheme();

/* Pass 1: render every document. Highlighting interns token colours as it
 * runs, so the stylesheet can only be finalised after the last code block. */
const readme = await renderMarkdown(site.catalog.readme.body, { sourceDir: ".", site, theme });
const entries = [];
for (const page of site.pages) {
  let doc = null;
  if (page.kind === "home" || page.kind === "docs") doc = readme;
  else if (page.kind === "tool" || page.kind === "platform") {
    const item = page.platform ?? page.tool;
    const sourceDir = path.posix.dirname(item.source);
    const files = page.platform ? readInlineFiles(sourceDir, page.platform.files) : [];
    doc = await renderMarkdown(item.body, { sourceDir, site, theme, files });
  }
  const meta = pageMeta(page, site, doc);
  entries.push({ page, doc, meta, modified: page.source ? lastModified(page.source) : "" });
}

/* Pass 2: shared assets, then the pages that reference them by digest. */
fs.rmSync(distRoot, { recursive: true, force: true });
const assets = createAssets({ distRoot, config });
for (const file of fs.readdirSync(path.join(uiRoot, "public"))) {
  assets.copy(path.join(uiRoot, "public", file), file);
}

const css = minifyCss(STYLES.map((file) => readStyles(`styles/${file}`, config)).join("\n") + theme.css());
const js = minifyJs(fs.readFileSync(path.join(uiRoot, "src/client/site.js"), "utf8"));
const index = JSON.stringify(searchIndex(entries, site));
const shared = {
  styles: assets.emit("site.css", css),
  script: assets.emit("site.js", js),
  searchIndex: assets.emit("search.json", index),
  themeScript: minifyJs(fs.readFileSync(path.join(uiRoot, "src/client/theme.js"), "utf8")),
};

const bodies = {
  home: renderHome,
  docs: renderDoc,
  tool: renderDoc,
  platform: renderDoc,
  search: renderSearch,
};
for (const { page, doc, meta, modified } of entries) {
  const body = bodies[page.kind]({ page, site, doc, meta });
  const data = page.indexable ? structuredData(page, site, meta, modified) : null;
  assets.write(
    path.join(page.route, "index.html"),
    renderPage({ page, site, meta, body, modified, structuredData: data, assets: shared }),
  );
}

const notFound = { kind: "404", route: "/404.html", source: null, indexable: false };
assets.write(
  "404.html",
  renderPage({ page: notFound, site, meta: pageMeta(notFound, site, null), body: renderNotFound({ site }), assets: shared }),
);

assets.write("sitemap.xml", sitemap(entries, config));
assets.write("robots.txt", robots(config));
assets.write("llms.txt", llmsTxt(site, firstSentence(readme.lead)));
// GitHub Pages would otherwise run Jekyll and drop underscore-prefixed paths.
assets.write(".nojekyll", "");

const kb = (text) => `${(gzipSync(text).length / 1024).toFixed(1)} kB gz`;
console.log(
  `built ${entries.length} pages + 404.html into dist/ (css ${kb(css)}, js ${kb(js)}, search index ${kb(index)})`,
);
