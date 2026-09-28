import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assetHref, createOutput, pngToIco } from "./lib/assets.mjs";
import { ConfigError, repoRoot, resolveConfig, uiRoot } from "./lib/config.mjs";
import { ContentError, TOOLS_SECTION, assertValid, discover, readInlineFiles } from "./lib/content.mjs";
import { combinedDates, commitDates, trackedFiles } from "./lib/git.mjs";
import { createCodeHighlighter } from "./lib/highlight.mjs";
import { createIcons, spriteSvg } from "./lib/icons.mjs";
import { TEMPLATE_IDS, renderPage } from "./lib/layout.mjs";
import { createLinkResolver } from "./lib/links.mjs";
import { createMarkdown } from "./lib/markdown.mjs";
import { searchIndex } from "./lib/search-index.mjs";
import { describePages, llmsTxt, manifest, robots, sitemap, structuredData } from "./lib/seo.mjs";
import { buildSite, sourceRoute } from "./lib/site.mjs";
import { docPage } from "./pages/doc.mjs";
import { homePage } from "./pages/home.mjs";
import { notFoundPage } from "./pages/not-found.mjs";
import { searchPage } from "./pages/search.mjs";

const TEMPLATES = { home: homePage, docs: docPage, category: docPage, tool: docPage, platform: docPage, search: searchPage, notFound: notFoundPage };

/**
 * Build the site from the Git-tracked documents under `root` into `outDir`.
 * Every document is validated and rendered first; any problem fails the build
 * with all of them listed and leaves `outDir` untouched. The site is written
 * to a sibling directory and swapped in, so a server never sees it half-built.
 * @param {{ env?: NodeJS.ProcessEnv, root?: string, outDir?: string }} [options]
 * @returns {Promise<{ pages: number, outDir: string }>}
 */
export async function build({ env = process.env, root = repoRoot, outDir = path.join(uiRoot, "dist") } = {}) {
  const config = resolveConfig(env);
  const inventory = trackedFiles(root);
  const read = (file) => readFileSync(path.join(root, file), "utf8");
  const { catalog, problems } = discover({ files: inventory, read });

  const highlighter = await createCodeHighlighter();
  // Icon hrefs only need the sprite's final URL, which depends on its content alone.
  const sprite = spriteSvg();
  const icon = createIcons(assetHref(config, "icons", "svg", sprite));
  const routeBySource = new Map(inventory.map((file) => [file, sourceRoute(file)]).filter(([, route]) => route));
  const render = createMarkdown({
    highlighter,
    icon,
    reservedIds: TEMPLATE_IDS,
    resolveLink: createLinkResolver({ config, routeBySource, files: inventory }),
  });

  // Render every document before anything is written, so link and markup
  // problems are reported together with frontmatter problems.
  const bySource = new Map();
  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A tool page's facts panel links its source directory, so a README bullet linking it again is dropped.
  const isSelfLink = (doc, { facts }) => {
    const self = config.href(sourceRoute(doc.source));
    const tree = facts ? new RegExp(`/tree/[^/]+/${escapeRegExp(path.posix.dirname(doc.source))}/?$`) : null;
    return (href) => href === self || Boolean(tree?.test(href));
  };
  const renderDoc = (doc, { facts = false, ...options } = {}) => {
    const rendered = render(doc.body, { source: doc.source, isSelfLink: isSelfLink(doc, { facts }), ...options });
    problems.push(...rendered.problems);
    bySource.set(doc.source, rendered);
  };
  renderDoc(catalog.readme);
  for (const category of catalog.categories) {
    if (category.source) renderDoc(category, { slot: TOOLS_SECTION });
    for (const tool of category.tools) {
      renderDoc(tool, { facts: true });
      for (const platform of tool.platforms) {
        renderDoc(platform, { facts: true, files: readInlineFiles(root, path.posix.dirname(platform.source), platform.files) });
      }
    }
  }
  assertValid(problems);

  const site = buildSite(config, catalog);
  const readme = bySource.get("README.md");
  // The home page and /docs/ share one rendering of the root README.
  const rendered = new Map(site.pages.filter((page) => page.source).map((page) => [page, bySource.get(page.source)]));
  const meta = describePages(site, readme);
  const dates = commitDates(root);

  mkdirSync(path.dirname(outDir), { recursive: true });
  const staging = mkdtempSync(path.join(path.dirname(outDir), `.${path.basename(outDir)}-`));
  try {
    const output = createOutput(staging, config);
    output.asset("icons", "svg", sprite);
    const assets = {
      css: await output.css(highlighter.css()),
      js: await output.js(),
      theme: await output.inlineScript("theme.js"),
      index: output.asset("search", "json", JSON.stringify(searchIndex(site, rendered, meta))),
    };

    const entries = [];
    for (const page of site.pages) {
      const pageDates = combinedDates(dates, page.sources);
      const heading = page.kind === "home" ? readme.title : page.heading;
      const seo = { ...meta.get(page), dates: pageDates };
      seo.structuredData = structuredData(page, site, { ...seo, heading });
      const main = TEMPLATES[page.kind]({ page, site, readme, rendered: rendered.get(page), dates: pageDates, icon });
      output.write(page.file, renderPage({ page, site, seo, main, assets, icon }));
      entries.push({ page, dates: pageDates });
    }

    output.copyPublic();
    output.write("favicon.ico", pngToIco(readFileSync(path.join(uiRoot, "public/apple-touch-icon.png"))));
    output.write("site.webmanifest", manifest(site, meta));
    output.write("sitemap.xml", sitemap(entries, config));
    output.write("robots.txt", robots(config));
    output.write("llms.txt", llmsTxt(site, meta, readme));
    // Serve files as-is: no Jekyll processing on GitHub Pages.
    output.write(".nojekyll", "");
    swapIn(staging, outDir);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  return { pages: site.pages.length, outDir };
}

/**
 * Replace `outDir` with the finished `staging` directory. Two renames on the
 * same filesystem: the old site is served until the instant the new one lands.
 */
function swapIn(staging, outDir) {
  const retired = `${staging}-old`;
  const hadPrevious = existsSync(outDir);
  if (hadPrevious) renameSync(outDir, retired);
  renameSync(staging, outDir);
  if (hadPrevious) rmSync(retired, { recursive: true, force: true });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const { pages, outDir } = await build();
    console.log(`built ${pages} pages into ${path.relative(process.cwd(), outDir) || "."}`);
  } catch (error) {
    if (!(error instanceof ContentError || error instanceof ConfigError)) throw error;
    console.error(`build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
