import { toolRoute, pageLabel } from "./site.mjs";
import { escapeHtml, firstSentence, truncate } from "./html.mjs";

export const SITE_NAME = "tool-containers";
const DESCRIPTION_MAX = 160;

/**
 * Title and description for a page. Frontmatter descriptions are written to be
 * meta descriptions, so they are used verbatim; only the derived ones (from the
 * root README) are trimmed.
 * @returns {{ title: string, description: string }}
 */
export function pageMeta(page, site, doc) {
  const suffix = ` | ${SITE_NAME}`;
  switch (page.kind) {
    case "home":
      return { title: `${doc.title} | Container image catalog`, description: truncate(doc.lead, DESCRIPTION_MAX) };
    case "docs":
      return {
        title: `Documentation${suffix}`,
        description: truncate(
          `${site.tools.length} container images and ${site.platformCount} deployment recipes. ${firstSentence(doc.lead)}`,
          DESCRIPTION_MAX,
        ),
      };
    case "tool":
      return { title: `${page.tool.meta.name} container image${suffix}`, description: page.tool.meta.description };
    case "platform":
      return {
        title: `Run ${page.tool.meta.name} with ${page.platform.meta.name}${suffix}`,
        description: page.platform.meta.description,
      };
    case "search":
      return {
        title: `Search${suffix}`,
        description: `Search ${site.tools.length} container images and their Docker, Compose, Podman, Kubernetes, and Helm recipes.`,
      };
    default:
      return { title: `Page not found${suffix}`, description: "This page is not part of the tool-containers site." };
  }
}

/** Breadcrumb trail for a page, shared by the visible nav and JSON-LD. */
export function breadcrumbTrail(page) {
  const trail = [{ label: "Docs", route: "/docs/" }];
  if (page.tool) trail.push({ label: page.tool.meta.name, route: toolRoute(page.tool) });
  if (page.platform) trail.push({ label: page.platform.meta.name, route: page.route });
  return trail;
}

/**
 * JSON-LD describing only what the page visibly states. No ratings, prices,
 * durations, or publisher identity are inferred; the `SearchAction` points at
 * the real `/search/?q=` page.
 */
export function structuredData(page, site, meta, modified) {
  const { config } = site;
  const url = config.canonical(page.route);
  const websiteId = `${config.siteUrl}/#website`;
  const nodes = [
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: config.canonical("/"),
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${config.canonical("/search/")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];

  const document = {
    "@id": `${url}#main`,
    url,
    name: meta.title,
    headline: meta.title.replace(/ \| .*$/, ""),
    description: meta.description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    ...(modified ? { dateModified: modified } : {}),
  };

  if (page.kind === "home") {
    nodes.push({
      ...document,
      "@type": "CollectionPage",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: site.tools.length,
        itemListElement: site.tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.meta.name,
          url: config.canonical(toolRoute(tool)),
        })),
      },
    });
    return graph(nodes);
  }

  const keywords = page.platform?.meta.keywords ?? page.tool?.meta.keywords ?? [];
  const trail = breadcrumbTrail(page);
  nodes.push(
    {
      ...document,
      "@type": "TechArticle",
      ...(keywords.length ? { keywords: keywords.join(", ") } : {}),
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: trail.map(({ label, route }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: label,
        item: config.canonical(route),
      })),
    },
  );
  return graph(nodes);
}

const graph = (nodes) => ({ "@context": "https://schema.org", "@graph": nodes });

/** `<head>` tags for search engines and link previews. */
export function headTags(page, site, meta, modified) {
  const { config } = site;
  const canonical = config.canonical(page.route);
  const ogImage = config.canonical("/og.png");
  const tag = (attribute, name, content) => `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`;
  const article = page.kind === "tool" || page.kind === "platform";
  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    tag("name", "description", meta.description),
    page.indexable
      ? tag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1")
      : tag("name", "robots", "noindex, follow"),
    page.kind === "404" ? "" : `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    tag("property", "og:type", article ? "article" : "website"),
    tag("property", "og:site_name", SITE_NAME),
    tag("property", "og:locale", "en_US"),
    tag("property", "og:title", meta.title),
    tag("property", "og:description", meta.description),
    page.kind === "404" ? "" : tag("property", "og:url", canonical),
    tag("property", "og:image", ogImage),
    tag("property", "og:image:width", "1200"),
    tag("property", "og:image:height", "630"),
    tag("property", "og:image:alt", `${SITE_NAME}: container images for AI coding agents and dev boxes`),
    article && modified ? tag("property", "article:modified_time", modified) : "",
    tag("name", "twitter:card", "summary_large_image"),
    tag("name", "twitter:title", meta.title),
    tag("name", "twitter:description", meta.description),
    tag("name", "twitter:image", ogImage),
  ].filter(Boolean);
}

/** sitemap.xml: indexable pages only, dated from their source's Git history. */
export function sitemap(entries, config) {
  const urls = entries
    .filter(({ page }) => page.indexable)
    .map(({ page, modified }) => `<url><loc>${config.canonical(page.route)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ""}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function robots(config) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${config.canonical("/sitemap.xml")}\n`;
}

/**
 * llms.txt (llmstxt.org): a plain markdown map of the site for language-model
 * crawlers, built from the same frontmatter as the pages.
 */
export function llmsTxt(site, summary) {
  const { config } = site;
  const lines = [`# ${SITE_NAME}`, "", `> ${summary}`, "", `- [Documentation](${config.canonical("/docs/")}): the full catalog README, image naming, and tag policy`, ""];
  for (const { name, tools } of site.catalog.categories) {
    lines.push(`## ${name}`, "");
    for (const tool of tools) {
      lines.push(`- [${tool.meta.name}](${config.canonical(toolRoute(tool))}): ${tool.meta.description}`);
      for (const platform of tool.platforms) {
        lines.push(`  - [${pageLabel({ kind: "platform", tool, platform })}](${config.canonical(`${toolRoute(tool)}${platform.slug}/`)}): ${platform.meta.usecase}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
