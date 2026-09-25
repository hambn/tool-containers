import { platformLabel } from "./catalog.mjs";
import { documentTitle, leadParagraph, truncate } from "./markdown.mjs";

const SITE_NAME = "tool-containers";

export function pageMeta(page, markdown, site) {
  const lead = leadParagraph(markdown);
  const describe = (text) => truncate(text.replace(/\s+/g, " ").trim(), 158);
  const title = documentTitle(markdown, page.tool);
  if (page.kind === "home")
    return {
      title: `${title} | Container image catalog`,
      description: describe(lead),
    };
  if (page.kind === "docs-index")
    return {
      title: `${title} documentation`,
      description: describe(
        `Browse ${site.toolCount} container images and ${site.exampleCount} deployment examples. ${lead}`,
      ),
    };
  if (page.kind === "tool")
    return {
      title: `${title} Docker image`,
      description: describe(lead || `${title} container image documentation.`),
    };
  const platform = platformLabel(page.platform);
  return {
    title: `${page.tool} on ${platform}`,
    description: describe(`Run ${page.tool} on ${platform}. ${lead}`),
  };
}

/** Describe the visible documents without inventing prices, ratings, or setup times. */
export function structuredData(page, { site, meta, modified }) {
  const { config } = site;
  const url = config.canonical(page.route);
  const website = {
    "@type": "WebSite",
    "@id": `${config.siteUrl}/#website`,
    name: SITE_NAME,
    url: config.canonical("/"),
    inLanguage: "en",
  };
  const document = {
    "@type": page.kind === "home" ? "CollectionPage" : "TechArticle",
    "@id": url,
    url,
    name: meta.title,
    headline: meta.title,
    description: meta.description,
    inLanguage: "en",
    isPartOf: { "@id": website["@id"] },
    ...(modified ? { dateModified: modified } : {}),
  };
  const nodes = [website, document];
  if (page.kind === "home") {
    const items = site.catalog.flatMap(({ tools }) => tools);
    document.mainEntity = {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map(({ category, tool }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool,
        url: config.canonical(`/docs/${category}/${tool}/`),
      })),
    };
  } else {
    const trail = [
      { name: "Catalog", route: "/" },
      { name: "Docs", route: "/docs/" },
    ];
    if (page.tool)
      trail.push({
        name: page.tool,
        route: `/docs/${page.category}/${page.tool}/`,
      });
    if (page.platform)
      trail.push({ name: platformLabel(page.platform), route: page.route });
    const breadcrumbId = `${url}#breadcrumb`;
    nodes.push({
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      breadcrumb: { "@id": breadcrumbId },
      mainEntity: { "@id": document["@id"] },
      isPartOf: { "@id": website["@id"] },
    });
    document.mainEntityOfPage = { "@id": `${url}#webpage` };
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: trail.map(({ name, route }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        item: config.canonical(route),
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}
