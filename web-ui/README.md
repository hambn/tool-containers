# Web UI

A static catalog and documentation site generated from the root [README](../README.md)
and the tool and platform READMEs under `tools/`. Browsers get pre-rendered HTML, one
shared CSS file, one small deferred script, and a lazily loaded search index. The site
needs no framework, API, web fonts, or application server.

## Build and preview

Use Node.js 22 or newer. The preview server also needs Python 3.

```bash
npm ci
npm run build
npm test
npm run preview   # http://localhost:4173, serves dist/
```

`marked`, `shiki`, `esbuild`, and `yaml` run only at build time.

## Content

`git ls-files` discovers these documents:

| Document                                         | Page                               | Frontmatter                                                                   |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------- |
| `README.md`                                      | `/` (catalog) and `/docs/`         | none                                                                          |
| `tools/<category>/<tool>/README.md`              | `/docs/<category>/<tool>/`         | `name`, `description`, and optionally `upstream`, `image`, `keywords`         |
| `tools/<category>/<tool>/docs/<platform>/README.md` | `/docs/<category>/<tool>/<platform>/` | `name`, `description`, `usecase`, and optionally `keywords`                |

If a required key is missing or has the wrong type, the build fails and names the file:

```text
build failed: Invalid document frontmatter:
  - tools/ai/codex/docs/helm/README.md: frontmatter is missing required key "usecase"
```

To add, rename, or remove a document or recipe file, change it and rebuild. There is no
content list to update. On platform pages, every sibling file (such as scripts,
manifests, or charts) appears inline under "File contents", and README links to those
files become in-page anchors. Binary files and files over 128 KiB keep their links to
GitHub instead.

## Features

- **Catalog:** a card grid by category. You can filter it by text, category, or
  platform, and the filter state is kept in the URL (`?platform=helm`). The filters
  appear only when JavaScript runs.
- **Search:** press `/` or Ctrl/Cmd+K to open a dialog that searches titles, keywords,
  use cases, headings, and prose, and highlights matches. `/search/?q=` works
  as a standalone page.
- **Docs:** a sidebar tree, breadcrumbs, platform tabs, a pull command, a table of
  contents with scrollspy, previous/next links, copy buttons, and a light/dark theme.
- **SEO:**
  - Unique titles and descriptions taken from frontmatter.
  - Canonical and Open Graph tags.
  - JSON-LD: WebSite with SearchAction, CollectionPage, TechArticle, and BreadcrumbList.
  - `sitemap.xml` (with git `lastmod`), `robots.txt`, `llms.txt`, and a noindex `404.html`.

## Deployment configuration

| Variable    | Purpose                                                        | Default                             |
| ----------- | -------------------------------------------------------------- | ----------------------------------- |
| `SITE_URL`  | Public URL for canonical links, structured data, and sitemap   | `https://tool-containers.hgh.dev`   |
| `BASE_PATH` | Optional prefix for internal links and assets                  | empty                               |

`SITE_URL` and `BASE_PATH` are independent. For a project subpath, set both, and test
with the same environment you built with:

```bash
SITE_URL=https://example.com/tool-containers BASE_PATH=/tool-containers npm run build
SITE_URL=https://example.com/tool-containers BASE_PATH=/tool-containers npm test
```

The [Pages workflow](../.github/workflows/web-ui.yml) publishes `dist/`.

## Layout

```text
src/build.mjs        build orchestration (two passes: render, then emit assets and pages)
src/lib/             content, site, markdown, highlight, seo, search, layout, assets
src/pages/           home, doc, search, and not-found templates
src/client/          deferred site.js and pre-paint theme.js
src/styles/          base, layout, components, and prose CSS
tests/               content.test.mjs (fixtures) and site.test.mjs (built dist/)
```

`npm test` compares the generated routes with the Git inventory. It also checks:

- one h1 per page, with unique titles and descriptions;
- canonical, robots, and JSON-LD tags;
- that links and fragments resolve under `BASE_PATH`;
- that every recipe file is rendered inline;
- sitemap, `llms.txt`, and search-index coverage;
- gzip budgets: CSS ≤ 12 kB, JS ≤ 6 kB, and each page ≤ 40 kB.
