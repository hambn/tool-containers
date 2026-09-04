import fs from "node:fs";
import path from "node:path";
import { repoRoot } from "./config.mjs";

/**
 * A platform is whatever directory someone put under `examples/`, so its label
 * is derived from the directory name rather than looked up in a list: a new
 * example needs no change here to be named correctly.
 */
export const platformLabel = (platform) =>
  platform
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const byName = (a, b) => a.localeCompare(b);

function readDirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(byName);
}

function hasReadme(...segments) {
  return fs.existsSync(path.join(repoRoot, ...segments, "README.md"));
}

/**
 * Read the repository shape into a catalog: every directory under `tools/` is
 * a category (kept even while empty), every tool directory with a README is a
 * tool, and every `examples/<platform>/` with a README is a runnable recipe.
 * The repository tree is the only source of truth; nothing here is hand-listed.
 */
export function readCatalog() {
  return readDirectories(path.join(repoRoot, "tools")).map((category) => {
    const tools = readDirectories(path.join(repoRoot, "tools", category))
      .filter((tool) => hasReadme("tools", category, tool))
      .map((tool) => ({
        category,
        tool,
        readme: `tools/${category}/${tool}/README.md`,
        platforms: readDirectories(path.join(repoRoot, "tools", category, tool, "examples"))
          .filter((platform) => hasReadme("tools", category, tool, "examples", platform)),
      }));
    return { category, tools };
  });
}

/**
 * Every page the site publishes, in reading order. Each page carries the
 * document it is generated from (`source`), so routing, the sitemap, lastmod
 * and the "edit on GitHub" link all read from one record.
 */
export function buildPages(catalog) {
  const pages = [
    { id: "home", kind: "home", route: "/", source: "README.md" },
    { id: "docs", kind: "docs-index", route: "/docs/", source: "README.md" },
  ];

  for (const { category, tools } of catalog) {
    for (const { tool, platforms, readme } of tools) {
      pages.push({
        id: `${category}/${tool}`,
        kind: "tool",
        route: `/docs/${category}/${tool}/`,
        source: readme,
        category,
        tool,
        platforms,
      });
      for (const platform of platforms) {
        pages.push({
          id: `${category}/${tool}/${platform}`,
          kind: "example",
          route: `/docs/${category}/${tool}/${platform}/`,
          source: `tools/${category}/${tool}/examples/${platform}/README.md`,
          category,
          tool,
          platform,
        });
      }
    }
  }
  return pages;
}

/**
 * Site index: the page list plus the lookups rendering needs — by source
 * document (to rewrite repository-relative markdown links into site routes)
 * and by route (for prev/next pagination).
 */
export function buildSite(config) {
  const catalog = readCatalog();
  const pages = buildPages(catalog);
  const bySource = new Map();
  for (const page of pages) {
    // The home page owns README.md; the docs index only borrows it for lastmod.
    if (page.kind !== "docs-index") bySource.set(page.source, page);
  }

  const docsPages = pages.filter((page) => page.kind !== "home");
  const navLabel = (page) =>
    page.kind === "docs-index" ? "Docs" : page.kind === "tool" ? page.tool : `${page.tool} · ${platformLabel(page.platform)}`;

  return {
    config,
    catalog,
    pages,
    bySource,
    toolCount: catalog.reduce((sum, { tools }) => sum + tools.length, 0),
    exampleCount: pages.filter((page) => page.kind === "example").length,
    /** Prev/next neighbours in docs reading order; the landing page is outside it. */
    neighbours(page) {
      const index = docsPages.indexOf(page);
      if (index === -1) return { previous: null, next: null };
      const link = (item) => (item ? { route: item.route, label: navLabel(item) } : null);
      return { previous: link(docsPages[index - 1]), next: link(docsPages[index + 1]) };
    },
  };
}
