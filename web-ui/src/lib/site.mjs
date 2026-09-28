import path from "node:path";

/**
 * The page model: every route the site serves, with the labels, headings, and
 * breadcrumbs each surface (navigation, templates, SEO, search) reads from.
 *
 * @typedef {import("./content.mjs").Category} Category
 * @typedef {import("./content.mjs").Tool} Tool
 * @typedef {import("./content.mjs").Platform} Platform
 * @typedef {{ label: string, route: string }} Crumb
 * @typedef {object} Page
 * @property {"home" | "docs" | "category" | "tool" | "platform" | "search" | "notFound"} kind
 * @property {string} route    site-root-relative path
 * @property {string} file     output path inside dist/
 * @property {string | null} source repository document the page renders
 * @property {string[]} sources every tracked file whose history dates the page
 * @property {boolean} indexable whether search engines should index it
 * @property {boolean} reading  part of the docs reading order (sidebar, pager, search)
 * @property {string} label    short name for navigation
 * @property {string} name     full name for search results, recents, and the pager
 * @property {string} heading  visible h1 (home takes the README title instead)
 * @property {Crumb[]} crumbs  visible breadcrumb trail, empty when it would be one item
 * @property {Category} [category] on category, tool, and platform pages
 * @property {Tool} [tool]
 * @property {Platform} [platform]
 */

export const categoryRoute = (category) => `/docs/${category.slug}/`;
export const toolRoute = (tool) => `${categoryRoute(tool.category)}${tool.slug}/`;
export const platformRoute = (tool, platform) => `${toolRoute(tool)}${platform.slug}/`;
export const categoryAnchor = (slug) => `cat-${slug}`;

/**
 * The route of a repository document from its path alone, so documents can be
 * rendered (and their links checked) before their metadata is known to be valid.
 * @returns {string | null} null for a path that is not a published document
 */
export function sourceRoute(source) {
  if (source === "README.md") return "/docs/";
  const match = source.match(/^tools\/([^/]+)\/(?:([^/]+)\/(?:docs\/([^/]+)\/)?)?README\.md$/);
  return match ? `/docs/${match.slice(1).filter(Boolean).join("/")}/` : null;
}

// Tabs and catalog columns are narrow; the full platform name stays in headings.
const PLATFORM_LABELS = { "docker-compose": "Compose" };
export const platformLabel = (platform) => PLATFORM_LABELS[platform.slug] ?? platform.meta.name;

// Image references name their registry host; the frontmatter contract allows only these.
const REGISTRIES = { "ghcr.io": "GHCR", "docker.io": "Docker Hub" };
export const registryLabel = (image) => REGISTRIES[image.split("/")[0]] ?? image.split("/")[0];

const DOCS_CRUMB = { label: "Docs", route: "/docs/" };

/** A tool page followed by its platform pages. */
function toolPages(tool, categoryCrumb) {
  const toolCrumb = { label: tool.meta.title, route: toolRoute(tool) };
  const pages = [
    {
      kind: "tool",
      route: toolCrumb.route,
      source: tool.source,
      sources: [tool.source],
      indexable: true,
      reading: true,
      label: tool.meta.title,
      name: tool.meta.title,
      heading: tool.meta.title,
      crumbs: [DOCS_CRUMB, categoryCrumb, toolCrumb],
      category: tool.category,
      tool,
    },
  ];
  for (const platform of tool.platforms) {
    const route = platformRoute(tool, platform);
    const dir = path.posix.dirname(platform.source);
    pages.push({
      kind: "platform",
      route,
      source: platform.source,
      sources: [platform.source, ...platform.files.map((file) => `${dir}/${file}`)],
      indexable: true,
      reading: true,
      label: platformLabel(platform),
      name: `${tool.meta.title} · ${platform.meta.name}`,
      heading: `Run ${tool.meta.title} with ${platform.meta.name}`,
      crumbs: [DOCS_CRUMB, categoryCrumb, toolCrumb, { label: platform.meta.name, route }],
      category: tool.category,
      tool,
      platform,
    });
  }
  return pages;
}

/**
 * Every page in reading order: overview, then each category page followed by
 * its tools and their platforms, all in frontmatter `order`. The root README
 * feeds both `/` and `/docs/`.
 */
function buildPages(catalog) {
  const index = (route) => `${route.slice(1)}index.html`;
  const pages = [
    {
      kind: "home",
      route: "/",
      source: "README.md",
      sources: ["README.md", ...catalog.categories.map((category) => category.source), ...catalog.tools.map((tool) => tool.source)],
      indexable: true,
      reading: false,
      label: "Catalog",
      name: "Catalog",
      heading: "",
      crumbs: [],
    },
    {
      kind: "docs",
      route: "/docs/",
      source: "README.md",
      sources: ["README.md"],
      indexable: true,
      reading: true,
      label: "Overview",
      name: "Documentation",
      heading: "Documentation",
      crumbs: [],
    },
  ];
  for (const category of catalog.categories) {
    const categoryCrumb = { label: category.meta.title, route: categoryRoute(category) };
    // The category page lists each tool's title, description, and images from its README.
    pages.push({
      kind: "category",
      route: categoryCrumb.route,
      source: category.source,
      sources: [category.source, ...category.tools.map((tool) => tool.source)],
      indexable: true,
      reading: true,
      label: category.meta.title,
      name: category.meta.title,
      heading: category.meta.title,
      crumbs: [DOCS_CRUMB, categoryCrumb],
      category,
    });
    for (const tool of category.tools) pages.push(...toolPages(tool, categoryCrumb));
  }
  // Result pages are thin and query-dependent, so they stay out of the index.
  pages.push({
    kind: "search",
    route: "/search/",
    source: null,
    sources: [],
    indexable: false,
    reading: false,
    label: "Search",
    name: "Search",
    heading: "Search",
    crumbs: [],
  });
  pages.push({
    kind: "notFound",
    route: "/404.html",
    source: null,
    sources: [],
    indexable: false,
    reading: false,
    label: "Page not found",
    name: "Page not found",
    heading: "Page not found",
    crumbs: [],
  });
  for (const page of pages) page.file = page.route.endsWith("/") ? index(page.route) : page.route.slice(1);
  return pages;
}

/**
 * The site model shared by every renderer: configuration, catalog, pages, and
 * the lookups link rewriting and navigation need.
 * @param {import("./content.mjs").Catalog} catalog
 */
export function buildSite(config, catalog) {
  const pages = buildPages(catalog);
  const reading = pages.filter((page) => page.reading);
  const byKind = (kind) => pages.find((page) => page.kind === kind);

  return {
    config,
    catalog,
    pages,
    home: byKind("home"),
    docs: byKind("docs"),
    recipeCount: catalog.tools.reduce((sum, tool) => sum + tool.platforms.length, 0),
    /** The page of a category. */
    categoryPage(category) {
      return pages.find((page) => page.kind === "category" && page.category === category);
    },
    /** The tool page and its platform pages, in tab order. */
    toolFamily(tool) {
      return reading.filter((page) => page.tool === tool);
    },
    /** Previous and next pages in docs reading order. */
    neighbours(page) {
      const index = reading.indexOf(page);
      return { previous: reading[index - 1] ?? null, next: index === -1 ? null : (reading[index + 1] ?? null) };
    },
  };
}
