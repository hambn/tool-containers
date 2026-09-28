import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createOutput, pngToIco } from "./lib/assets.mjs";
import { ConfigError, repoRoot, resolveConfig, uiRoot } from "./lib/config.mjs";
import { ContentError, discover, readInlineFiles } from "./lib/content.mjs";
import { combinedDates, commitDates, trackedFiles } from "./lib/git.mjs";
import { createCodeHighlighter } from "./lib/highlight.mjs";
import { createIcons, spriteSvg } from "./lib/icons.mjs";
import { TEMPLATE_IDS, renderPage } from "./lib/layout.mjs";
import { createLinkResolver } from "./lib/links.mjs";
import { createMarkdown } from "./lib/markdown.mjs";
import { searchIndex } from "./lib/search-index.mjs";
import { describePages, llmsTxt, manifest, robots, sitemap, structuredData } from "./lib/seo.mjs";
import { buildSite } from "./lib/site.mjs";
import { docPage } from "./pages/doc.mjs";
import { homePage } from "./pages/home.mjs";
import { notFoundPage } from "./pages/not-found.mjs";
import { searchPage } from "./pages/search.mjs";

const TEMPLATES = { home: homePage, docs: docPage, tool: docPage, platform: docPage, search: searchPage, notFound: notFoundPage };

/**
 * Build the site from the Git-tracked documents under `root` into `outDir`,
 * replacing whatever was there.
 * @param {{ env?: NodeJS.ProcessEnv, root?: string, outDir?: string }} [options]
 * @returns {Promise<{ pages: number, outDir: string }>}
 */
export async function build({ env = process.env, root = repoRoot, outDir = path.join(uiRoot, "dist") } = {}) {
  const config = resolveConfig(env);
  const files = trackedFiles(root);
  const catalog = discover({ files, read: (file) => readFileSync(path.join(root, file), "utf8") });
  const site = buildSite(config, catalog);
  const dates = commitDates(root);

  rmSync(outDir, { recursive: true, force: true });
  const output = createOutput(outDir, config);
  const icon = createIcons(output.asset("icons", "svg", spriteSvg()));
  const highlighter = await createCodeHighlighter();
  const render = createMarkdown({
    highlighter,
    icon,
    reservedIds: TEMPLATE_IDS,
    resolveLink: createLinkResolver({ config, routeBySource: site.routeBySource, files }),
  });

  // The home page and /docs/ share one rendering of the root README.
  const readme = render(catalog.readme.body, { source: "README.md", selfHref: config.href(site.docs.route) });
  const rendered = new Map();
  for (const page of site.pages) {
    if (page.source === "README.md") rendered.set(page, readme);
    else if (page.tool) {
      const doc = page.platform ?? page.tool;
      const files = page.platform ? readInlineFiles(root, path.posix.dirname(doc.source), page.platform.files) : [];
      rendered.set(page, render(doc.body, { source: doc.source, selfHref: config.href(page.route), files }));
    }
  }

  const meta = describePages(site, readme);
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
  return { pages: site.pages.length, outDir };
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
