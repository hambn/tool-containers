import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { repoRoot, repoUrl, pages, platformLabels, configureSite, basePath } from "./build/catalog.mjs";
import { extractMeta, buildToc, renderMarkdown, tokenCss, truncate } from "./build/markdown.mjs";
import { shell } from "./build/shell.mjs";
import { renderHomePage } from "./pages/home/home.mjs";
import { renderDocsIndexPage, docsBody, docsJsonLd } from "./pages/docs/docs.mjs";

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(uiRoot, "dist");

configureSite({
  base: process.env.BASE_PATH ?? "",
  origin: process.env.SITE_ORIGIN ?? "https://hambn.github.io/tool-containers",
});

/** Conservative CSS minifier: comments, whitespace runs, punct spacing, trailing semicolons. */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/ ([{}:;,>]) /g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

const read = (file) => fs.readFileSync(path.join(uiRoot, file), "utf8");
const baseCss = read("src/styles.css").replaceAll("{{base}}", basePath);
const pageCss = {
  home: read("src/pages/home/home.css"),
  docs: read("src/pages/docs/docs.css"),
};

fs.rmSync(distRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(distRoot, "fonts"), { recursive: true });
for (const [from, to] of [
  ["@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", "fonts/inter-latin.woff2"],
  [
    "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
    "fonts/jetbrains-mono-latin.woff2",
  ],
]) {
  fs.copyFileSync(path.join(uiRoot, "node_modules", from), path.join(distRoot, to));
}

/** Per-page SEO meta; unique title and description derived from the source document. */
function pageMeta(page, markdown) {
  if (page.kind === "docs-index") {
    return {
      title: "Docs",
      description: "Documentation for every tool-containers image: variants, tags, registries, and runnable examples.",
    };
  }
  const meta = extractMeta(markdown);
  if (page.kind !== "example") return meta;
  const platformLabel = platformLabels[page.platform] ?? page.platform;
  return {
    title: `${page.tool} \u00b7 ${platformLabel}`,
    description: truncate(`${page.tool} ${platformLabel} examples: ${meta.description}`, 155),
  };
}

async function renderPage(page, repoRelPath) {
  if (page.kind === "home") {
    const home = renderHomePage();
    return { contentHtml: home.content, structuredData: home.jsonLd, tocEntries: [] };
  }
  if (page.kind === "docs-index") {
    return { contentHtml: docsBody({ page, contentHtml: renderDocsIndexPage() }), structuredData: docsJsonLd(page), tocEntries: [] };
  }
  const markdown = await renderMarkdown(repoRelPath);
  return {
    contentHtml: docsBody({ page, contentHtml: markdown, tocEntries: buildToc(markdown) }),
    structuredData: docsJsonLd(page),
    tocEntries: buildToc(markdown),
  };
}

// Pass 1: render every page body first so syntax-token CSS can be collected once.
const rendered = [];
for (const [repoRelPath, page] of pages) {
  const markdown = page.kind === "docs-index" ? "Generated docs index." : fs.readFileSync(path.join(repoRoot, repoRelPath), "utf8");
  const body = await renderPage(page, repoRelPath);
  rendered.push({ repoRelPath, page, markdown, ...body, ...pageMeta(page, markdown) });
}

const tokensCss = tokenCss();

/** Honest lastmod: the last commit that touched the page's source document. */
function lastmod(repoRelPath) {
  try {
    const date = execSync(`git log -1 --format=%cI -- ${repoRelPath}`, { cwd: repoRoot }).toString().trim();
    return /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : "";
  } catch {
    return "";
  }
}

// Pass 2: inline per-page CSS (base + the area the page belongs to + tokens) and write.
const sitemapUrls = [];
for (const { repoRelPath, page, contentHtml, structuredData, title, description } of rendered) {
  const areaCss = page.kind === "home" ? pageCss.home : page.kind === "404" ? "" : pageCss.docs;
  const html = shell({
    page: { ...page, repoRelPath },
    contentHtml,
    structuredData,
    css: minifyCss(`${baseCss}\n${areaCss}\n${tokensCss}`),
    title,
    description,
  });
  const outDir = path.join(distRoot, page.route);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
  const modified = lastmod(repoRelPath);
  sitemapUrls.push(
    `\t<url><loc>${process.env.SITE_ORIGIN ?? "https://hambn.github.io/tool-containers"}${basePath}${page.route}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ""}</url>`,
  );
  console.log(`built ${page.route}`);
}

const notFoundHtml = shell({
  page: { route: "/404.html", kind: "404", repoRelPath: "README.md" },
  contentHtml: `<main class="content" id="content"><div class="content-inner">
<section class="not-found">
<div class="empty">
<div class="empty-header">
<span class="empty-media"><svg aria-hidden="true"><use href="#i-inbox" xlink:href="#i-inbox"/></svg></span>
<h1 class="empty-title">Page not found</h1>
<p class="empty-description">The page you are looking for does not exist or was removed in a rebuild.</p>
</div>
<div class="empty-content">
<a class="btn btn-primary" href="${basePath}/">Back to home</a>
<a class="btn btn-outline" href="${basePath}/docs/">Open the docs</a>
</div>
</div>
</section>
</div></main>`,
  title: "Page not found",
  description: "This page does not exist in the tool-containers showcase.",
  css: minifyCss(baseCss),
});
fs.writeFileSync(path.join(distRoot, "404.html"), notFoundHtml);
console.log("built /404.html");

const siteUrl = `${process.env.SITE_ORIGIN ?? "https://hambn.github.io/tool-containers"}${basePath}`;
fs.writeFileSync(
  path.join(distRoot, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(path.join(distRoot, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`done: ${pages.size} pages`);
