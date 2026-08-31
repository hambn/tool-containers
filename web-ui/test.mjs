import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { resolveConfig, uiRoot } from "./src/lib/config.mjs";
import { buildSite } from "./src/lib/catalog.mjs";
import { leadParagraph, renderDocument } from "./src/lib/markdown.mjs";

const distRoot = path.join(uiRoot, "dist");
const config = resolveConfig();
const site = buildSite(config);
const { siteUrl, basePath } = config;

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

function walkDist(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDist(abs, out);
    else out.push(path.relative(distRoot, abs).split(path.sep).join("/"));
  }
  return out;
}

/* ============================================================ A. dist/ === */

const distFiles = walkDist(distRoot);
const htmlFiles = distFiles.filter((file) => file.endsWith(".html"));
const expectedRoutes = new Set(site.pages.map((page) => page.route));

/* A1. Route parity: exactly one dist page per generated route, plus 404.html. */
for (const page of site.pages) {
  check(fs.existsSync(path.join(distRoot, page.route, "index.html")), `missing built page for route ${page.route}`);
}
const builtRoutes = new Set(
  htmlFiles.filter((file) => file !== "404.html").map((file) => `/${file.slice(0, -"index.html".length)}`),
);
for (const route of builtRoutes) {
  check(expectedRoutes.has(route), `unexpected built page for route ${route}`);
}
check(htmlFiles.includes("404.html"), "missing dist/404.html");
check(htmlFiles.length === expectedRoutes.size + 1, "extra generated HTML files beyond the expected page set + 404.html");

/* Read every page once for the checks below. */
const pages = [
  ...site.pages.map((page) => ({ page, html: fs.readFileSync(path.join(distRoot, page.route, "index.html"), "utf8") })),
  { page: { id: "404", kind: "404", route: "/404.html" }, html: fs.readFileSync(path.join(distRoot, "404.html"), "utf8") },
];

const titles = new Set();
const descriptions = new Set();
let assetPair = null;

for (const { page, html } of pages) {
  const label = page.route;

  /* A2. Exactly one <h1>. */
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  check(h1Count === 1, `${label}: expected exactly one <h1>, found ${h1Count}`);

  /* A3. Title and description: present, unique, not truncated mid-word. */
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  check(title && title.trim().length > 0, `${label}: missing or empty <title>`);
  check(!titles.has(title), `${label}: duplicate <title> "${title}"`);
  titles.add(title);

  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  check(description && description.trim().length > 0, `${label}: missing or empty meta description`);
  check(!descriptions.has(description), `${label}: duplicate meta description`);
  check(!/[-–—]$/.test(description ?? ""), `${label}: description ends on a dangling hyphen/dash: "${description}"`);
  check(!/\betc\.?\.\.\.$/i.test(description ?? ""), `${label}: description looks truncated mid-word: "${description}"`);
  descriptions.add(description);

  if (page.kind === "404") {
    /* A9. 404 is noindex. */
    check(/<meta name="robots" content="noindex, follow">/.test(html), "404: expected noindex, follow robots meta");
    continue; // 404 has no canonical/OG/JSON-LD contract below.
  }

  /* A4. Canonical is absolute, under SITE_URL, and matches the route. */
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  check(canonical === `${siteUrl}${page.route}`, `${label}: canonical "${canonical}" does not match ${siteUrl}${page.route}`);

  /* A9. Every non-404 page is indexable. */
  check(
    /<meta name="robots" content="index, follow[^"]*">/.test(html),
    `${label}: expected index, follow robots meta`,
  );

  /* A10. OG/Twitter tags, og:url equals canonical. */
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)">/)?.[1];
  check(!!html.match(/<meta property="og:title" content="[^"]+">/), `${label}: missing og:title`);
  check(!!html.match(/<meta property="og:description" content="[^"]*">/), `${label}: missing og:description`);
  check(ogUrl === canonical, `${label}: og:url "${ogUrl}" does not equal canonical "${canonical}"`);
  check(!!html.match(/<meta property="og:image" content="[^"]+">/), `${label}: missing og:image`);
  check(!!html.match(/<meta name="twitter:card" content="[^"]+">/), `${label}: missing twitter:card`);

  /* A6. Content-addressed asset pair, referenced consistently. */
  const cssHref = html.match(/<link rel="stylesheet" href="([^"]+)">/)?.[1];
  const jsSrc = html.match(/<script src="([^"]+)" defer><\/script>/)?.[1];
  check(!!cssHref && !!jsSrc, `${label}: missing shared stylesheet or script reference`);
  if (cssHref && jsSrc) {
    if (!assetPair) assetPair = { cssHref, jsSrc };
    check(cssHref === assetPair.cssHref, `${label}: references a different stylesheet asset (${cssHref})`);
    check(jsSrc === assetPair.jsSrc, `${label}: references a different script asset (${jsSrc})`);
  }

  /* A8. JSON-LD graph and @type sets per page kind. */
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(!!ldMatch, `${label}: missing JSON-LD structured data`);
  if (ldMatch) {
    let data;
    try {
      data = JSON.parse(ldMatch[1]);
    } catch (error) {
      failures.push(`${label}: JSON-LD does not parse (${error.message})`);
      data = null;
    }
    if (data) {
      check(Array.isArray(data["@graph"]), `${label}: JSON-LD @graph is not an array`);
      const types = new Set((data["@graph"] ?? []).map((node) => node["@type"]));
      check(types.has("Organization"), `${label}: JSON-LD missing Organization`);
      check(types.has("WebSite"), `${label}: JSON-LD missing WebSite`);
      if (page.kind === "home" || page.kind === "docs-index") {
        check(types.has("CollectionPage"), `${label}: JSON-LD missing CollectionPage`);
      } else {
        check(types.has("BreadcrumbList"), `${label}: JSON-LD missing BreadcrumbList`);
      }
      if (page.kind === "tool") {
        check(types.has("TechArticle"), `${label}: tool page JSON-LD missing TechArticle`);
        check(types.has("SoftwareApplication"), `${label}: tool page JSON-LD missing SoftwareApplication`);
      }
      if (page.kind === "example") {
        check(types.has("TechArticle"), `${label}: example page JSON-LD missing TechArticle`);
        check(types.has("HowTo"), `${label}: example page JSON-LD missing HowTo`);
      }
    }
  }

  /* A5. Every internal href/src resolves inside dist/, honouring BASE_PATH. */
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith("#") || /^(https?:|mailto:|data:|\/\/)/i.test(url)) continue;
    if (!url.startsWith("/")) continue; // relative or protocol-relative — not a site-root link
    check(
      url === basePath || url.startsWith(`${basePath}/`),
      `${label}: internal link "${url}" does not start with BASE_PATH "${basePath}"`,
    );
    let clean = url.split("#", 2)[0].split("?", 2)[0];
    if (basePath && clean.startsWith(basePath)) clean = clean.slice(basePath.length) || "/";
    const abs = path.join(distRoot, path.posix.normalize(clean.replace(/^\//, "")));
    const target = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? path.join(abs, "index.html") : abs;
    check(fs.existsSync(target), `${label}: broken internal link ${url}`);
  }
}

/* A6 (cont). Exactly one css/js pair actually on disk, and no stray duplicates. */
if (assetPair) {
  const assetFiles = distFiles.filter((file) => file.startsWith("assets/"));
  const cssAssets = assetFiles.filter((file) => /^assets\/site\.[0-9a-f]+\.css$/.test(file));
  const jsAssets = assetFiles.filter((file) => /^assets\/site\.[0-9a-f]+\.js$/.test(file));
  check(cssAssets.length === 1, `expected exactly one content-addressed site.*.css, found ${cssAssets.length}`);
  check(jsAssets.length === 1, `expected exactly one content-addressed site.*.js, found ${jsAssets.length}`);
  check(fs.existsSync(path.join(distRoot, assetPair.cssHref.slice(basePath.length))), "referenced stylesheet asset missing on disk");
  check(fs.existsSync(path.join(distRoot, assetPair.jsSrc.slice(basePath.length))), "referenced script asset missing on disk");
}

/* A7. sitemap.xml and robots.txt. */
const sitemap = fs.readFileSync(path.join(distRoot, "sitemap.xml"), "utf8");
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(sitemapLocs.length === expectedRoutes.size, `sitemap has ${sitemapLocs.length} <loc> entries, expected ${expectedRoutes.size}`);
for (const loc of sitemapLocs) {
  check(loc.startsWith(siteUrl), `sitemap loc "${loc}" is not absolute under SITE_URL`);
}
const sitemapRoutes = new Set(sitemapLocs.map((loc) => loc.slice(siteUrl.length) || "/"));
for (const route of expectedRoutes) {
  check(sitemapRoutes.has(route), `sitemap is missing route ${route}`);
}

const robots = fs.readFileSync(path.join(distRoot, "robots.txt"), "utf8");
check(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "robots.txt does not reference the sitemap under SITE_URL");

/* ==================================================== B. unit tests ==== */

/* leadParagraph: hard-wrapped lines join into one sentence. */
{
  const markdown = "# Title\n\nThis is a sentence that\nwraps across several\nhard-wrapped lines in the source.\n\nNext paragraph.";
  const lead = leadParagraph(markdown);
  check(
    lead === "This is a sentence that wraps across several hard-wrapped lines in the source.",
    `leadParagraph did not join hard-wrapped lines: "${lead}"`,
  );
}

/* renderDocument: an unterminated fence must not throw and must not swallow the rest of the file. */
{
  const markdown = [
    "# Title",
    "",
    "Intro paragraph.",
    "",
    "```bash",
    "echo hello",
    "```",
    "",
    "## Trailing section",
    "",
    "Some trailing text.",
    "",
    "```yaml",
    "unterminated: true",
  ].join("\n");
  const site1 = buildSite(resolveConfig({}));
  let html;
  let threw = false;
  try {
    html = await renderDocument(markdown, { sourceDir: ".", site: site1, theme: { render: (code) => `<pre>${code}</pre>` } });
  } catch {
    threw = true;
  }
  check(!threw, "renderDocument threw on an unterminated fence");
  if (!threw) {
    check(html.includes("Trailing section"), "renderDocument swallowed content after an unterminated fence");
    check(html.includes("unterminated: true"), "renderDocument dropped the unterminated fence's own content");
  }
}

/* resolveConfig: SITE_URL and BASE_PATH normalization, independently. */
{
  const c1 = resolveConfig({ SITE_URL: "https://example.com/sub/" });
  check(c1.siteUrl === "https://example.com/sub", `trailing slash not stripped from SITE_URL: "${c1.siteUrl}"`);
  check(c1.basePath === "", `BASE_PATH should default to empty, got "${c1.basePath}"`);

  const c2 = resolveConfig({ BASE_PATH: "sub/" });
  check(c2.basePath === "/sub", `BASE_PATH normalization wrong: "${c2.basePath}"`);
  check(c2.siteUrl.length > 0, "SITE_URL should not be affected by BASE_PATH being set");

  const c3 = resolveConfig({ SITE_URL: "https://example.com", BASE_PATH: "/sub/" });
  check(c3.basePath === "/sub", `leading/trailing slashes not normalized: "${c3.basePath}"`);
  check(c3.canonical("/docs/") === "https://example.com/docs/", `canonical() composed incorrectly: "${c3.canonical("/docs/")}"`);
  check(c3.href("/docs/") === "/sub/docs/", `href() composed incorrectly: "${c3.href("/docs/")}"`);

  const c4 = resolveConfig({});
  check(c4.basePath === "", `BASE_PATH should stay empty when unset, got "${c4.basePath}"`);
}

/* ============================================================= report === */

if (failures.length) {
  console.error(`web-ui test suite failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`web-ui test suite passed: ${expectedRoutes.size} pages, ${distFiles.length} dist files`);
