import { categoryLabel } from "./site.mjs";

/**
 * The client search index: one entry per docs page with its display text.
 * Normalization happens once in the browser, so nothing is stored twice.
 * The home page is left out because /docs/ carries the same document.
 * @param {ReturnType<import("./site.mjs").buildSite>} site
 * @param {Map<object, import("./markdown.mjs").Rendered>} rendered
 * @param {Map<object, { description: string }>} meta
 * @returns {{ pages: import("../shared/search.mjs").IndexPage[] }}
 */
export function searchIndex(site, rendered, meta) {
  const pages = site.pages
    .filter((page) => page.reading)
    .map((page) => {
      const { tool, platform } = page;
      const words = tool
        ? [...(platform ?? tool).meta.keywords, platform?.meta.usecase, platform?.meta.name, categoryLabel(tool.category), tool.meta.image]
        : [];
      return {
        t: page.name,
        u: site.config.href(page.route),
        k: page.kind,
        d: meta.get(page).description,
        w: words.filter(Boolean).join(" "),
        s: rendered.get(page).sections.map(({ heading, id, text }) => [heading, id, text]),
      };
    });
  return { pages };
}
