import { TOOLS_SECTION } from "./content.mjs";

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
        ? [...(platform ?? tool).meta.keywords, platform?.meta.usecase, platform?.meta.name, tool.category.meta.title, ...tool.meta.images]
        : [];
      const sections = rendered.get(page).sections.map(({ heading, id, text }) =>
        // A category's Tools section is generated at render time, so its text is too.
        page.kind === "category" && heading === TOOLS_SECTION ? [heading, id, toolListText(page.category)] : [heading, id, text],
      );
      return {
        t: page.name,
        u: site.config.href(page.route),
        k: page.kind,
        d: meta.get(page).description,
        w: words.filter(Boolean).join(" "),
        s: sections,
      };
    });
  return { pages };
}

/** The searchable text of a category's generated tool list. */
const toolListText = (category) => category.tools.map((tool) => `${tool.meta.title}. ${tool.meta.description}`).join(" ");
