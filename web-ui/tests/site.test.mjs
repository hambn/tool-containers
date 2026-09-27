// Checks the built `dist/` against the repository. Run after `npm run build`
// with the same SITE_URL and BASE_PATH the build used.
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { resolveConfig, repoRoot, uiRoot } from "../src/lib/config.mjs";
import { buildSite } from "../src/lib/site.mjs";

/** Transfer budgets, gzip. Raise them deliberately, not incidentally. */
const BUDGET = { css: 12 * 1024, js: 6 * 1024, searchIndex: 40 * 1024, page: 40 * 1024 };

const distRoot = path.join(uiRoot, "dist");
const config = resolveConfig();
const { siteUrl, basePath } = config;
const site = buildSite(config);

const distFiles = (function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else out.push(path.relative(distRoot, abs).split(path.sep).join("/"));
  }
  return out;
})(distRoot);
const read = (file) => fs.readFileSync(path.join(distRoot, file), "utf8");
const pages = [
  ...site.pages.map((page) => ({ page, html: read(path.join(page.route, "index.html")) })),
  { page: { kind: "404", route: "/404.html", indexable: false }, html: read("404.html") },
];
const indexable = pages.filter(({ page }) => page.indexable);
const gz = (file) => gzipSync(fs.readFileSync(path.join(distRoot, file))).length;

test("pages match the tracked markdown inventory exactly", () => {
  // Read Git independently so a discovery bug cannot hide itself.
  const tracked = execFileSync("git", ["ls-files", "tools"], { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .filter((file) => /^tools\/[^/]+\/[^/]+\/(?:docs\/[^/]+\/)?README\.md$/.test(file));
  const expected = new Set([
    "/",
    "/docs/",
    "/search/",
    ...tracked.map((file) => `/docs/${file.replace(/^tools\//, "").replace("docs/", "").replace(/README\.md$/, "")}`),
  ]);
  const built = new Set(
    distFiles.filter((file) => file.endsWith("index.html")).map((file) => `/${file.slice(0, -"index.html".length)}`),
  );
  assert.deepEqual([...built].sort(), [...expected].sort());
  assert.ok(distFiles.includes("404.html"));
  assert.ok(!tracked.some((file) => file.includes("/examples/")), "stale examples/ directory still tracked");
});

test("every page has one h1, a unique title, and a unique description", () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const { page, html } of pages) {
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${page.route}: h1 count`);
    assert.match(html, /^<!doctype html>\n<html lang="en">/, `${page.route}: doctype/lang`);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
    assert.ok(title && !titles.has(title), `${page.route}: missing or duplicate title "${title}"`);
    assert.ok(description && !descriptions.has(description), `${page.route}: missing or duplicate description`);
    assert.ok(description.length <= 170, `${page.route}: description too long (${description.length})`);
    assert.doesNotMatch(description, /[-–—]$/, `${page.route}: description ends on a dash`);
    titles.add(title);
    descriptions.add(description);
  }
});

test("tool and recipe pages use their frontmatter", () => {
  for (const { page, html } of pages.filter(({ page }) => page.tool)) {
    const meta = page.platform?.meta ?? page.tool.meta;
    assert.ok(html.includes(`<meta name="description" content="${escape(meta.description)}">`), `${page.route}: description`);
    if (page.platform) assert.ok(html.includes(escape(meta.usecase)), `${page.route}: use case not shown`);
    else if (meta.image) assert.ok(html.includes(`docker pull ${meta.image}`), `${page.route}: pull command`);
    assert.doesNotMatch(html, /<article[^>]*>\s*<p>---/, `${page.route}: frontmatter leaked into the body`);
  }
});
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("'", "&#39;").replaceAll("<", "&lt;");

test("SEO: canonical, robots, Open Graph, and JSON-LD", () => {
  for (const { page, html } of pages) {
    const label = page.route;
    if (!page.indexable) {
      assert.match(html, /<meta name="robots" content="noindex, follow">/, `${label}: noindex`);
      continue;
    }
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    assert.equal(canonical, `${siteUrl}${page.route}`, `${label}: canonical`);
    assert.match(html, /<meta name="robots" content="index, follow/, `${label}: robots`);
    assert.equal(html.match(/<meta property="og:url" content="([^"]+)">/)?.[1], canonical, `${label}: og:url`);
    for (const tag of ["og:title", "og:description", "og:image"]) assert.match(html, new RegExp(`property="${tag}" content="[^"]+"`), `${label}: ${tag}`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, `${label}: twitter:card`);

    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = new Set(ld["@graph"].map((node) => node["@type"]));
    const website = ld["@graph"].find((node) => node["@type"] === "WebSite");
    assert.equal(website.potentialAction.target.urlTemplate, `${siteUrl}/search/?q={search_term_string}`);
    if (page.kind === "home") assert.ok(types.has("CollectionPage"), `${label}: CollectionPage`);
    else {
      assert.ok(types.has("TechArticle") && types.has("BreadcrumbList"), `${label}: TechArticle + BreadcrumbList`);
    }
    for (const invented of ["totalTime", "aggregateRating", "offers", "publisher"]) {
      assert.ok(!JSON.stringify(ld).includes(`"${invented}"`), `${label}: invented ${invented}`);
    }
  }
});

test("internal links and fragments resolve, honouring BASE_PATH", () => {
  const byRoute = new Map(pages.map((entry) => [entry.page.route, entry.html]));
  for (const { page, html } of pages) {
    for (const [, url] of html.matchAll(/(?:href|src|data-search-index)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|data:|\/\/)/.test(url)) continue;
      const [target, fragment] = url.split("#");
      if (target) {
        assert.ok(target.startsWith(`${basePath}/`), `${page.route}: "${url}" is relative or lacks BASE_PATH`);
        const clean = target.slice(basePath.length).split("?")[0];
        const file = path.join(distRoot, clean, clean.endsWith("/") ? "index.html" : "");
        assert.ok(fs.existsSync(file), `${page.route}: broken link ${url}`);
      }
      if (!fragment) continue;
      const route = target ? target.slice(basePath.length) : page.route;
      const targetHtml = byRoute.get(route);
      if (targetHtml && !fragment.startsWith("i-")) {
        assert.ok(targetHtml.includes(`id="${decodeURIComponent(fragment)}"`), `${page.route}: broken fragment ${url}`);
      }
    }
  }
});

test("recipe pages render every sibling text file inline", () => {
  for (const { page, html } of pages.filter(({ page }) => page.kind === "platform")) {
    const textFiles = page.platform.files.filter((name) => !/\.(png|jpe?g|gif|ico|tgz|gz)$/.test(name));
    for (const name of textFiles) {
      assert.ok(html.includes(`<code>${name}</code></a></h3>`), `${page.route}: ${name} not inline`);
    }
  }
});

test("sitemap, robots.txt, and llms.txt cover the indexable pages", () => {
  const sitemap = read("sitemap.xml");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locs.sort(), indexable.map(({ page }) => `${siteUrl}${page.route}`).sort());
  // Uncommitted documents have no Git date, so lastmod is optional but must be well-formed.
  for (const [, date] of sitemap.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) assert.match(date, /^\d{4}-\d{2}-\d{2}/);
  assert.ok(read("robots.txt").includes(`Sitemap: ${siteUrl}/sitemap.xml`));
  const llms = read("llms.txt");
  for (const tool of site.tools) assert.ok(llms.includes(`[${tool.meta.name}](${siteUrl}/docs/${tool.category}/${tool.slug}/)`), `llms.txt: ${tool.slug}`);
  assert.ok(distFiles.includes(".nojekyll"));
});

test("search index covers tools, recipes, headings, and frontmatter", () => {
  const file = distFiles.find((name) => /^assets\/search\.[0-9a-f]{8}\.json$/.test(name));
  assert.ok(file, "missing search index");
  const { pages: entries } = JSON.parse(read(file));
  const docPages = site.pages.filter((page) => ["docs", "tool", "platform"].includes(page.kind));
  assert.equal(entries.length, docPages.length);
  for (const page of docPages.filter((page) => page.tool)) {
    const entry = entries.find((item) => item.u === `${basePath}${page.route}`);
    assert.ok(entry, `index lacks ${page.route}`);
    const meta = page.platform?.meta ?? page.tool.meta;
    for (const word of meta.keywords) assert.ok(entry.k.includes(word), `${page.route}: keyword ${word}`);
    if (page.platform) assert.ok(entry.k.includes(meta.usecase), `${page.route}: use case`);
    assert.ok(entry.s.length > 0, `${page.route}: no sections`);
  }
  console.log(`search index: ${entries.length} pages, ${gz(file)} B gzip`);
});

test("assets stay within budget and are shared by every page", () => {
  const css = distFiles.filter((file) => /^assets\/site\.[0-9a-f]{8}\.css$/.test(file));
  const js = distFiles.filter((file) => /^assets\/site\.[0-9a-f]{8}\.js$/.test(file));
  const index = distFiles.find((file) => /^assets\/search\./.test(file));
  assert.equal(css.length, 1);
  assert.equal(js.length, 1);
  for (const { page, html } of pages) {
    assert.ok(html.includes(`href="${basePath}/${css[0]}"`) && html.includes(`src="${basePath}/${js[0]}"`), `${page.route}: shared assets`);
    assert.ok(gzipSync(html).length < BUDGET.page, `${page.route}: HTML over budget`);
  }
  const sizes = { css: gz(css[0]), js: gz(js[0]), searchIndex: gz(index) };
  for (const [name, size] of Object.entries(sizes)) assert.ok(size <= BUDGET[name], `${name}: ${size} B gzip exceeds ${BUDGET[name]}`);
  assert.ok(!distFiles.some((file) => /\.(woff2?|ttf|otf)$/.test(file)), "unexpected web font");
  console.log(`assets (gzip): css ${sizes.css} B, js ${sizes.js} B, search index ${sizes.searchIndex} B`);
});
