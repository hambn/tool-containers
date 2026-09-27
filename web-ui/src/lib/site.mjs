import { discover } from "./content.mjs";

/**
 * @typedef {import("./content.mjs").Tool} Tool
 * @typedef {import("./content.mjs").Platform} Platform
 * @typedef {object} Page
 * @property {"home" | "docs" | "tool" | "platform" | "search" | "404"} kind
 * @property {string} route  site-root-relative, always ending in "/" (or ".html")
 * @property {string | null} source repository document the page renders
 * @property {boolean} indexable whether search engines should index it
 * @property {Tool} [tool]
 * @property {Platform} [platform]
 */

export const toolRoute = (tool) => `/docs/${tool.category}/${tool.slug}/`;
export const platformRoute = (tool, platform) => `${toolRoute(tool)}${platform.slug}/`;

/**
 * Every page in reading order, derived from the catalog. The home page and
 * `/docs/` both come from the root README: the first is its catalog view, the
 * second the complete document.
 * @returns {Page[]}
 */
export function buildPages(catalog) {
  const pages = [
    { kind: "home", route: "/", source: "README.md", indexable: true },
    { kind: "docs", route: "/docs/", source: "README.md", indexable: true },
  ];
  for (const { tools } of catalog.categories) {
    for (const tool of tools) {
      pages.push({ kind: "tool", route: toolRoute(tool), source: tool.source, indexable: true, tool });
      for (const platform of tool.platforms) {
        pages.push({
          kind: "platform",
          route: platformRoute(tool, platform),
          source: platform.source,
          indexable: true,
          tool,
          platform,
        });
      }
    }
  }
  // Result pages are thin and query-dependent, so they stay out of the index.
  pages.push({ kind: "search", route: "/search/", source: null, indexable: false });
  return pages;
}

/** Short label for navigation, pagination, and breadcrumbs. */
export function pageLabel(page) {
  if (page.kind === "platform") return `${page.tool.meta.name} · ${page.platform.meta.name}`;
  if (page.kind === "tool") return page.tool.meta.name;
  if (page.kind === "docs") return "Overview";
  if (page.kind === "search") return "Search";
  return "Catalog";
}

/**
 * The site model shared by every renderer: the catalog, the page list, and
 * lookups for rewriting repository links into routes and for pagination.
 */
export function buildSite(config, catalog = discover()) {
  const pages = buildPages(catalog);
  const bySource = new Map();
  // Links to the root README land on /docs/, where every section anchor exists.
  for (const page of pages) if (page.source && page.kind !== "home") bySource.set(page.source, page);

  const tools = catalog.categories.flatMap(({ tools: list }) => list);
  /** Platform slug → display name, for the catalog's platform filter. */
  const platforms = new Map();
  for (const tool of tools) {
    for (const platform of tool.platforms) {
      if (!platforms.has(platform.slug)) platforms.set(platform.slug, platform.meta.name);
    }
  }
  const reading = pages.filter((page) => ["docs", "tool", "platform"].includes(page.kind));

  return {
    config,
    catalog,
    pages,
    bySource,
    tools,
    platforms,
    platformCount: tools.reduce((sum, tool) => sum + tool.platforms.length, 0),
    /** Previous and next pages in docs reading order. */
    neighbours(page) {
      const index = reading.indexOf(page);
      if (index === -1) return { previous: null, next: null };
      return { previous: reading[index - 1] ?? null, next: reading[index + 1] ?? null };
    },
  };
}
