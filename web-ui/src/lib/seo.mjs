import { SITE_NAME } from "./config.mjs";
import { DESCRIPTION_LENGTH } from "./frontmatter.mjs";
import { escapeHtml, fitClauses, fitSentences, html, sentences } from "./html.mjs";
import { toolRoute } from "./site.mjs";

const TITLE_MAX = 60;
const SEPARATOR = " — ";
export const THEME_COLORS = { light: "#ffffff", dark: "#09090b" };
export const OG_IMAGE = { path: "/og.png", width: 1200, height: 630 };

const withSiteName = (text) => (`${text}${SEPARATOR}${SITE_NAME}`.length <= TITLE_MAX ? `${text}${SEPARATOR}${SITE_NAME}` : text);

/**
 * Titles and descriptions for every page, derived from frontmatter and the
 * root README so no marketing copy lives in code. Home and /docs/ share the
 * README lead: home takes its opening sentences, /docs/ the ones after.
 * @param {ReturnType<import("./site.mjs").buildSite>} site
 * @param {import("./markdown.mjs").Rendered} readme
 * @returns {Map<import("./site.mjs").Page, { title: string, description: string }>}
 */
export function describePages(site, readme) {
  const lead = sentences(readme.lead);
  const home = fitSentences(lead, DESCRIPTION_LENGTH.max);
  const docs = fitSentences(lead, DESCRIPTION_LENGTH.max, home.end);
  const summary = fitClauses(lead[0] ?? "", TITLE_MAX - SEPARATOR.length - SITE_NAME.length);
  const imageCount = `${site.catalog.tools.length} images`;

  const meta = new Map();
  for (const page of site.pages) {
    const { tool, platform } = page;
    switch (page.kind) {
      case "home":
        meta.set(page, { title: summary ? `${SITE_NAME}${SEPARATOR}${summary}` : SITE_NAME, description: home.text });
        break;
      case "docs":
        meta.set(page, { title: withSiteName(page.heading), description: docs.text || home.text });
        break;
      case "category":
        meta.set(page, { title: withSiteName(`${page.category.meta.title} Docker images`), description: page.category.meta.description });
        break;
      case "tool":
        meta.set(page, { title: withSiteName(`${tool.meta.title} Docker image`), description: tool.meta.description });
        break;
      case "platform":
        meta.set(page, { title: withSiteName(page.heading), description: platform.meta.description });
        break;
      case "search":
        meta.set(page, { title: withSiteName("Search"), description: `Search the documentation for ${imageCount} and ${site.recipeCount} deployment recipes.` });
        break;
      default:
        meta.set(page, { title: withSiteName(page.heading), description: `This page does not exist. Browse the catalog of ${imageCount} or search the documentation.` });
    }
  }
  return meta;
}

/** `<head>` tags for search engines and link previews. */
export function headTags(page, { config }, { title, description, dates }) {
  const image = config.canonical(OG_IMAGE.path);
  const article = page.kind === "tool" || page.kind === "platform";
  const canonical = page.indexable ? config.canonical(page.route) : "";
  const meta = (attribute, name, content) => (content ? html`<meta ${attribute}="${name}" content="${content}">` : "");
  return [
    html`<title>${title}</title>`,
    meta("name", "description", description),
    meta("name", "robots", page.indexable ? "index, follow, max-image-preview:large" : "noindex, follow"),
    canonical ? html`<link rel="canonical" href="${canonical}">` : "",
    meta("property", "og:type", article ? "article" : "website"),
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:title", title),
    meta("property", "og:description", description),
    meta("property", "og:url", canonical),
    meta("property", "og:image", image),
    meta("property", "og:image:width", String(OG_IMAGE.width)),
    meta("property", "og:image:height", String(OG_IMAGE.height)),
    meta("property", "og:image:alt", SITE_NAME),
    article ? meta("property", "article:published_time", dates.published) : "",
    article ? meta("property", "article:modified_time", dates.modified) : "",
    meta("name", "twitter:card", "summary_large_image"),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * JSON-LD describing only what the page visibly states: no ratings, prices,
 * durations, or publisher identity are inferred.
 * @returns {object | null}
 */
export function structuredData(page, site, { title, description, heading, dates }) {
  if (!page.indexable) return null;
  const { config } = site;
  const url = config.canonical(page.route);
  const website = { "@type": "WebSite", "@id": `${config.canonical("/")}#website`, name: SITE_NAME, url: config.canonical("/") };
  const dated = {
    ...(dates.published ? { datePublished: dates.published } : {}),
    ...(dates.modified ? { dateModified: dates.modified } : {}),
  };

  if (page.kind === "home") {
    return graph([
      {
        ...website,
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${config.canonical("/search/")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: title,
        headline: heading,
        description,
        isPartOf: { "@id": website["@id"] },
        ...dated,
        mainEntity: toolList(site.catalog.tools, config),
      },
    ]);
  }

  if (page.kind === "category") {
    // The page visibly lists the category's tools, so it is a collection of them.
    return graph([
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: title,
        headline: heading,
        description,
        inLanguage: "en",
        isPartOf: website,
        ...dated,
        mainEntity: toolList(page.category.tools, config),
      },
      breadcrumbList(page, config),
    ]);
  }

  const keywords = page.platform?.meta.keywords ?? page.tool?.meta.keywords ?? [];
  const upstream = page.kind === "tool" ? page.tool.meta.upstream : "";
  const nodes = [
    {
      "@type": "TechArticle",
      "@id": `${url}#article`,
      url,
      mainEntityOfPage: url,
      headline: heading,
      description,
      image: config.canonical(OG_IMAGE.path),
      inLanguage: "en",
      isPartOf: website,
      ...dated,
      ...(keywords.length ? { keywords: keywords.join(", ") } : {}),
      ...(upstream ? { about: { "@type": "Thing", name: page.tool.meta.title, sameAs: upstream } } : {}),
    },
  ];
  if (page.crumbs.length >= 2) nodes.push(breadcrumbList(page, config));
  return graph(nodes);
}

const toolList = (tools, config) => ({
  "@type": "ItemList",
  numberOfItems: tools.length,
  itemListElement: tools.map((tool, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: tool.meta.title,
    url: config.canonical(toolRoute(tool)),
  })),
});

const breadcrumbList = (page, config) => ({
  "@type": "BreadcrumbList",
  itemListElement: page.crumbs.map(({ label, route }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: label,
    item: config.canonical(route),
  })),
});

const graph = (nodes) => ({ "@context": "https://schema.org", "@graph": nodes });

/** Serialize JSON-LD for a `<script>` element; `<` is escaped so content can never close the tag. */
export const jsonLdScript = (data) =>
  data ? `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>` : "";

/** sitemap.xml: indexable pages only, dated from their sources' Git history. */
export function sitemap(entries, config) {
  const urls = entries
    .filter(({ page }) => page.indexable)
    .map(({ page, dates }) => {
      const lastmod = dates.modified ? `<lastmod>${escapeHtml(dates.modified)}</lastmod>` : "";
      return `<url><loc>${escapeHtml(config.canonical(page.route))}</loc>${lastmod}</url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function robots(config) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${config.canonical("/sitemap.xml")}\n`;
}

/** llms.txt (llmstxt.org): a markdown map of the site built from the same metadata as the pages. */
export function llmsTxt(site, meta, readme) {
  const { config } = site;
  const docs = meta.get(site.docs);
  const lines = [`# ${SITE_NAME}`, "", `> ${meta.get(site.home).description}`, ""];
  lines.push(`- [${site.docs.heading}](${config.canonical(site.docs.route)}): ${readme.headings.join(", ") || docs.description}`, "");
  for (const page of site.pages) {
    if (page.kind === "category") {
      lines.push(`## ${page.category.meta.title}`, "", `- [${page.category.meta.title}](${config.canonical(page.route)}): ${page.category.meta.description}`, "");
    } else if (page.kind === "tool") {
      lines.push(`### ${page.tool.meta.title}`, "", `- [${page.tool.meta.title}](${config.canonical(page.route)}): ${page.tool.meta.description}`);
    } else if (page.kind === "platform") {
      lines.push(`- [${page.heading}](${config.canonical(page.route)}): ${page.platform.meta.usecase}`);
    }
    if (page.tool && page === site.toolFamily(page.tool).at(-1)) lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

/** Web app manifest, sharing the theme colours with the `theme-color` meta tags. */
export function manifest(site, meta) {
  return JSON.stringify(
    {
      name: SITE_NAME,
      short_name: SITE_NAME,
      description: meta.get(site.home).description,
      start_url: site.config.href("/"),
      display: "standalone",
      background_color: THEME_COLORS.dark,
      theme_color: THEME_COLORS.dark,
      icons: [
        { src: site.config.href("/favicon.svg"), sizes: "any", type: "image/svg+xml" },
        { src: site.config.href("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
      ],
    },
    null,
    2,
  );
}
