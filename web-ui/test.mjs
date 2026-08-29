import fs from "node:fs";
import path from "node:path";

const uiRoot = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(uiRoot, "..");
const distRoot = path.join(uiRoot, "dist");
const basePath = (process.env.BASE_PATH ?? "/tool-containers").replace(/\/+$/, "");

// Re-derive the expected page set straight from the repository tree so the
// check does not trust the generator's own bookkeeping: the landing page, the
// docs index, and one page per tool README and examples README.
const expected = new Set(["/", "/docs/"]);
for (const category of fs.readdirSync(path.join(repoRoot, "images"))) {
  const categoryDir = path.join(repoRoot, "images", category);
  if (!fs.statSync(categoryDir).isDirectory()) continue;
  for (const tool of fs.readdirSync(categoryDir)) {
    const toolDir = path.join(categoryDir, tool);
    if (!fs.existsSync(path.join(toolDir, "README.md"))) continue;
    expected.add(`/docs/${category}/${tool}/`);
    const examplesDir = path.join(toolDir, "examples");
    if (!fs.existsSync(examplesDir)) continue;
    for (const platform of fs.readdirSync(examplesDir)) {
      if (fs.existsSync(path.join(examplesDir, platform, "README.md"))) {
        expected.add(`/docs/${category}/${tool}/${platform}/`);
      }
    }
  }
}

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

const distFiles = walkDist(distRoot);
const builtRoutes = new Set(
  distFiles.filter((file) => file === "index.html" || file.endsWith("/index.html")).map((file) => `/${file.slice(0, -"index.html".length)}`),
);
for (const route of expected) {
  check(builtRoutes.has(route), `missing built page for route ${route}`);
}
for (const route of builtRoutes) {
  check(expected.has(route), `unexpected built page for route ${route}`);
}
for (const asset of ["404.html", "sitemap.xml", "robots.txt", "fonts/inter-latin.woff2", "fonts/jetbrains-mono-latin.woff2"]) {
  check(distFiles.includes(asset), `missing dist asset ${asset}`);
}
check(!distFiles.includes("style.css"), "styles must be inlined per page, not shipped as style.css");
for (const file of distFiles) {
  const isAsset = /\.(html|css|xml|txt)$/.test(file) && !file.startsWith("fonts/");
  check(isAsset || file.endsWith(".woff2"), `unexpected dist file ${file}`);
}

const sitemap = fs.readFileSync(path.join(distRoot, "sitemap.xml"), "utf8");
const sitemapOrigin = process.env.SITE_ORIGIN ?? "https://hambn.github.io";
const sitemapRoutes = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((loc) => loc.startsWith(sitemapOrigin + basePath))
    .map((loc) => loc.slice((sitemapOrigin + basePath).length) || "/"),
);
for (const route of expected) {
  check(sitemapRoutes.has(route), `sitemap is missing route ${route}`);
}
check(sitemapRoutes.size === expected.size, "sitemap contains routes outside the expected page set");

const titles = new Set();
const descriptions = new Set();
for (const route of [...expected, "/404.html"]) {
  const file =
    route === "/404.html"
      ? path.join(distRoot, "404.html")
      : path.join(distRoot, route, "index.html");
  const html = fs.readFileSync(file, "utf8");
  const label = route;

  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
  check(h1Count === 1, `${label}: expected exactly one <h1>, found ${h1Count}`);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  check(title && title.trim().length > 0, `${label}: missing or empty <title>`);
  check(!titles.has(title), `${label}: duplicate <title> "${title}"`);
  titles.add(title);

  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  check(description && description.trim().length > 0, `${label}: missing or empty meta description`);
  check(!descriptions.has(description), `${label}: duplicate meta description`);
  descriptions.add(description);

  check(/<link rel="canonical" href="[^"]+">/.test(html), `${label}: missing canonical link`);
  check(/<meta property="og:url" content="[^"]+">/.test(html), `${label}: missing og:url`);
  check(/<link rel="icon" href="data:image\/svg\+xml,/.test(html), `${label}: missing self-contained favicon`);
  if (route !== "/404.html") {
    check(
      html.includes(`<link rel="canonical" href="${sitemapOrigin}${basePath}${route}">`),
      `${label}: canonical URL does not match its GitHub Pages route`,
    );
  }
  check(html.includes("<style>") && html.includes("--background:"), `${label}: missing inline design-system styles`);
  check(!/<link rel="preload"[^>]+as="font"/.test(html), `${label}: fonts should load on demand, not compete as preloads`);
  if (route === "/404.html") {
    check(/<meta name="robots" content="noindex">/.test(html), "404: missing noindex");
  } else {
    check(/<script type="application\/ld\+json">/.test(html), `${label}: missing JSON-LD structured data`);
  }

  if (route === "/") {
    for (const dir of fs.readdirSync(path.join(repoRoot, "images"))) {
      if (fs.statSync(path.join(repoRoot, "images", dir)).isDirectory()) {
        check(html.includes(`>${dir}</h2>`), `home: category "${dir}" from images/ not rendered`);
      }
    }
    check(html.includes(`href="${basePath}/docs/"`), "home: missing base-aware Docs link");
    check(!html.includes(".toc-link{"), "home: must not ship docs-only CSS (toc)");
    check(!html.includes(".sidebar{"), "home: must not ship docs-only CSS (sidebar)");
  }

  if (route.startsWith("/docs/") && route !== "/docs/") {
    check(html.includes('"@type":"TechArticle"'), `${label}: missing TechArticle structured data`);
  }

  if (route === "/docs/") {
    check(html.includes("<h1>Docs</h1>"), "docs index: missing h1");
    check(html.includes("docs-tool-name"), "docs index: tool list not rendered");
  }

  if (route !== "/" && route !== "/404.html") {
    check(!html.includes(".hero-dots{"), `${label}: must not ship home-only CSS (hero)`);
    check(html.includes(`href="${basePath}/docs/"`), `${label}: missing base-aware top-nav Docs link`);
  }

  for (const match of html.matchAll(/href="(#[^"]*|[^"#:]+)"/g)) {
    const href = match[1];
    if (href.startsWith("#")) continue;
    if (/^(https?:|mailto:|\/\/)/i.test(href)) continue;
    if (href.startsWith("/") && basePath) {
      check(href === basePath || href.startsWith(`${basePath}/`), `${label}: root-relative link bypasses base path: ${href}`);
    }
    let clean = href.split("#", 2)[0].split("?", 2)[0];
    if (!clean) continue;
    if (basePath && clean.startsWith(`${basePath}/`)) clean = clean.slice(basePath.length);
    const abs = path.join(distRoot, path.posix.normalize(clean.replace(/^\//, "")));
    const target = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? path.join(abs, "index.html") : abs;
    check(fs.existsSync(target), `${label}: broken internal link ${href}`);
  }
}

if (failures.length) {
  console.error(`web-ui build verification failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`web-ui build verification passed: ${expected.size} pages, ${distFiles.length} dist files`);
