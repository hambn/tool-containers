import { truncate } from "./html.mjs";

/** Longest section text kept per entry; enough for a snippet, small enough to ship. */
const SECTION_TEXT_MAX = 280;

/**
 * Build the client search index. Field names are single letters because the
 * file ships to every visitor who opens search:
 *   t title · u URL · c breadcrumb context · d description
 *   k keywords (frontmatter keywords, use case, category, platform names)
 *   s sections as [heading, fragment id, text]
 * Code blocks are excluded upstream; section text is capped.
 * @param {{ page: import("./site.mjs").Page, doc: import("./markdown.mjs").Rendered, meta: { description: string } }[]} entries
 */
export function searchIndex(entries, site) {
  const pages = [];
  for (const { page, doc, meta } of entries) {
    if (!["docs", "tool", "platform"].includes(page.kind)) continue;
    const { tool, platform } = page;
    const keywords =
      page.kind === "tool"
        ? [...tool.meta.keywords, tool.category, tool.meta.image, ...tool.platforms.map((item) => item.meta.name)]
        : page.kind === "platform"
          ? [...platform.meta.keywords, platform.meta.usecase, platform.meta.name, tool.meta.name]
          : [];
    pages.push({
      t: page.kind === "platform" ? `${tool.meta.name} · ${platform.meta.name}` : page.kind === "tool" ? tool.meta.name : "Overview",
      u: site.config.href(page.route),
      c: page.kind === "docs" ? "Docs" : `${tool.category} / ${tool.meta.name}${platform ? ` / ${platform.meta.name}` : ""}`,
      d: meta.description,
      k: [...new Set(keywords.filter(Boolean))].join(" "),
      s: doc.sections
        .filter((section) => section.heading)
        .map(({ heading, id, text }) => [heading, id, truncate(text, SECTION_TEXT_MAX)]),
    });
  }
  return { v: 1, pages };
}
