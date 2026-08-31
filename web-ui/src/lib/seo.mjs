import { platformLabel } from "./catalog.mjs";
import { documentTitle, leadParagraph, truncate } from "./markdown.mjs";

const SITE_NAME = "tool-containers";
const DESCRIPTION_LIMIT = 158;

/**
 * Title and meta description for a page, derived from the document it renders.
 * Titles carry the words people actually search for — a tool page is a "Docker
 * image", an example page is a recipe for one platform — while staying unique
 * and readable in a search result list.
 */
export function pageMeta(page, markdown, site) {
  const lead = leadParagraph(markdown);
  const describe = (text) => truncate(text.replace(/\s+/g, " ").trim(), DESCRIPTION_LIMIT);

  if (page.kind === "home") {
    return {
      title: `${SITE_NAME} — Docker images for AI agents, CI and sandboxes`,
      description: describe(lead),
    };
  }
  if (page.kind === "docs-index") {
    return {
      title: "Docs",
      description: describe(
        `Documentation for all ${site.toolCount} container images in ${SITE_NAME}: build variants, registries, moving tags and ${site.exampleCount} runnable deployment examples.`,
      ),
    };
  }
  if (page.kind === "tool") {
    return {
      title: `${page.tool} Docker image`,
      description: describe(lead || `${page.tool} container image with Ubuntu and Alpine variants.`),
    };
  }
  /*
   * Sibling examples share one README opening, so a description taken straight
   * from the lead reads the same on every platform. Naming the platform first
   * keeps each page distinct and puts the differentiator inside the snippet
   * length a search result actually shows.
   */
  const platform = platformLabel(page.platform);
  return {
    title: `${page.tool} on ${platform}`,
    description: describe(`Run the ${page.tool} container image on ${platform}. ${lead}`.trim()),
  };
}

/**
 * JSON-LD for a page. Tool pages describe a real `SoftwareApplication` (a
 * distributable container image) rather than only an article, which is what
 * search engines use to surface software results; example pages are `HowTo`
 * recipes. Every graph is anchored to the shared WebSite/Organization nodes.
 */
export function structuredData(page, { site, meta, markdown, modified }) {
  const { config } = site;
  const url = config.canonical(page.route);
  const organization = {
    "@type": "Organization",
    "@id": `${config.siteUrl}/#organization`,
    name: config.owner,
    url: config.repoUrl,
  };
  const website = {
    "@type": "WebSite",
    "@id": `${config.siteUrl}/#website`,
    name: SITE_NAME,
    url: `${config.siteUrl}/`,
    description: meta.description,
    inLanguage: "en",
    publisher: { "@id": organization["@id"] },
  };

  if (page.kind === "home") {
    return graph([
      organization,
      website,
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: meta.title,
        description: meta.description,
        isPartOf: { "@id": website["@id"] },
        mainEntity: itemList(
          site.catalog.flatMap(({ tools }) => tools).map(({ category, tool }) => ({
            name: tool,
            url: config.canonical(`/docs/${category}/${tool}/`),
          })),
        ),
      },
    ]);
  }

  if (page.kind === "docs-index") {
    return graph([
      organization,
      website,
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `${meta.title} · ${SITE_NAME}`,
        description: meta.description,
        isPartOf: { "@id": website["@id"] },
        breadcrumb: breadcrumbs([{ name: "Docs", url }]),
        mainEntity: itemList(
          site.catalog.flatMap(({ tools }) => tools).map(({ category, tool }) => ({
            name: tool,
            url: config.canonical(`/docs/${category}/${tool}/`),
          })),
        ),
      },
    ]);
  }

  const toolUrl = config.canonical(`/docs/${page.category}/${page.tool}/`);
  const trail = [
    { name: "Docs", url: config.canonical("/docs/") },
    { name: page.tool, url: toolUrl },
  ];
  if (page.kind === "example") trail.push({ name: platformLabel(page.platform), url });

  const article = {
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: meta.title,
    description: meta.description,
    url,
    mainEntityOfPage: { "@id": url },
    isPartOf: { "@id": website["@id"] },
    author: { "@id": organization["@id"] },
    publisher: { "@id": organization["@id"] },
    articleSection: page.category,
    ...(modified ? { dateModified: modified } : {}),
  };

  if (page.kind === "tool") {
    return graph([
      organization,
      website,
      breadcrumbs(trail),
      article,
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        name: page.tool,
        description: meta.description,
        url,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Linux",
        softwareRequirements: "Docker, Podman or any OCI-compatible container runtime",
        codeRepository: config.repoUrl,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        ...registryOffers(markdown),
      },
    ]);
  }

  return graph([
    organization,
    website,
    breadcrumbs(trail),
    article,
    {
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: `Run ${page.tool} on ${platformLabel(page.platform)}`,
      description: meta.description,
      url,
      totalTime: "PT5M",
      tool: [{ "@type": "HowToTool", name: platformLabel(page.platform) }],
      step: howToSteps(markdown, url),
    },
  ]);
}

const graph = (nodes) => ({ "@context": "https://schema.org", "@graph": nodes });

const itemList = (items) => ({
  "@type": "ItemList",
  numberOfItems: items.length,
  itemListElement: items.map(({ name, url }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    url,
  })),
});

const breadcrumbs = (trail) => ({
  "@type": "BreadcrumbList",
  itemListElement: trail.map(({ name, url }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: url,
  })),
});

/** Registry image names from the document, exposed as download identifiers. */
function registryOffers(markdown) {
  const images = [...markdown.matchAll(/\b((?:ghcr\.io|docker\.io|quay\.io)\/[a-z0-9._/-]+)/gi)].map((match) =>
    match[1].replace(/[.:]$/, ""),
  );
  const unique = [...new Set(images)];
  return unique.length ? { identifier: unique.slice(0, 4) } : {};
}

/** `## ` sections of an example document as HowTo steps. */
function howToSteps(markdown, url) {
  const steps = [];
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^##\s+(.+)$/);
    if (!heading) continue;
    const name = heading[1].replace(/[*_`]/g, "").trim();
    const anchor = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    steps.push({ "@type": "HowToStep", position: steps.length + 1, name, url: `${url}#${anchor}` });
  }
  return steps;
}
