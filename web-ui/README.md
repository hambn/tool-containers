# Web UI

A static catalog and documentation site generated from the root [README](../README.md)
and the tool and platform READMEs under `tools/`. Browsers get pre-rendered HTML, one
CSS file, a small module script, an external icon sprite, and a lazily loaded search
index. The site needs no framework, API, web fonts, or application server.

## Build and preview

Use Node.js 22 or newer. The preview server also needs Python 3.

```bash
npm ci
npm run build
npm test
npm run preview   # http://localhost:4173, serves dist/
```

`marked`, `shiki`, `esbuild`, and `yaml` run only at build time; `node-html-parser` runs
only in tests.

## Content

`git ls-files` discovers these documents:

| Document                                            | Page                                  |
| --------------------------------------------------- | ------------------------------------- |
| `README.md`                                         | `/` (catalog) and `/docs/`            |
| `tools/<category>/<tool>/README.md`                 | `/docs/<category>/<tool>/`            |
| `tools/<category>/<tool>/docs/<platform>/README.md` | `/docs/<category>/<tool>/<platform>/` |

The frontmatter contract is defined in
[`$documentation`](../.agents/skills/documentation/SKILL.md) and enforced strictly. The
build fails on any of these:

- unknown, missing, or wrongly typed keys, or invalid values;
- frontmatter in the root README;
- an unknown platform directory;
- a platform doc without a tool README.

The build reports every problem at once and names each file:

```text
build failed: Invalid documents:
  - tools/ai/codex/docs/helm/README.md: missing required key "usecase"
  - tools/ai/codex/README.md: keywords: expected list, got string
```

To add, rename, or remove a document or recipe file, change it and rebuild. There is no
content list to update.

### Rendering rules

- The document's `# Title` and first paragraph become the page heading and lead. The
  frontmatter `description` is used only for meta tags and search, so the lead is
  never shown twice.
- A `## Contents` section that holds only same-page links is dropped, because the
  page's table of contents replaces it.
- A list item whose only link points at the page itself (such as a "Docs:" link to the
  site) is dropped. A list left empty by this rule disappears.
- Links are resolved against the Git inventory:
  - Links to documents become site routes.
  - Links to a platform's sibling files become in-page anchors. A link with a fragment
    into one of those files goes to GitHub instead.
  - Other repository paths go to GitHub `blob` or `tree` URLs.
  - Absolute links into `SITE_URL` follow `BASE_PATH`.
- These fail the build: a link that climbs out of the repository, a `javascript:` or
  `data:` link, and raw HTML.
- On platform pages, every sibling file (scripts, manifests, charts) appears under
  "File contents". Files over 40 lines start collapsed. Binary files and files over
  128 KiB keep their GitHub links.

## Features

- **Catalog:** a table of images grouped by category. Each row shows:
  - the title and description;
  - the image reference, with a copy button;
  - platform links, in a fixed column order.

  You can filter by text, category, or platform. The filter state is kept in the URL
  (`?platform=helm`), and the filter uses the same matcher as search.
- **Search:** press `/` or Ctrl/Cmd+K to open the search dialog. With an empty query, it
  lists the images and your recently viewed pages. Results are grouped by page, with
  matching sections nested under each page. The same engine powers the `/search/?q=`
  page, which shows every result.
- **Docs:**
  - A sidebar tree, breadcrumbs, and platform tabs.
  - A facts panel on each page: image, use case, upstream, source, and keywords.
  - A table of contents, which becomes a collapsible panel below 1280px.
  - Previous/next links and copy buttons.
  - A light/dark theme that follows the OS until you choose one.
- **SEO:**
  - Titles and descriptions come from frontmatter or from whole sentences of the root
    README lead.
  - Canonical and `og:url` tags appear only on indexable pages.
  - JSON-LD: WebSite with SearchAction, CollectionPage, and TechArticle with Git dates.
    BreadcrumbList appears only where a visible breadcrumb exists.
  - The build writes these files:
    - `sitemap.xml`, with Git `lastmod`;
    - `robots.txt` and `llms.txt`;
    - `favicon.ico` and `site.webmanifest`;
    - a noindex `404.html`.

### Search ranking

`src/shared/search.mjs` is a pure module shared by the client bundle and the tests.

- Every query word must match (AND).
- A word matches exactly or as a prefix. Words of five or more characters also match
  within one typo.
- Pages rank by field: title, then headings, then keywords and use case, then
  description, then prose.
- Matches are highlighted on raw text, which is escaped afterwards.
- Code blocks are never indexed.

## Deployment configuration

| Variable            | Purpose                                                      | Default                           |
| ------------------- | ------------------------------------------------------------ | --------------------------------- |
| `SITE_URL`          | Public URL for canonical links, structured data, and sitemap | `https://tool-containers.hgh.dev` |
| `BASE_PATH`         | Optional prefix for internal links and assets                | empty                             |
| `GITHUB_REPOSITORY` | `owner/repo` for GitHub source links                         | `hambn/tool-containers`           |

`SITE_URL` must be an absolute http(s) URL. `SITE_URL` and `BASE_PATH` are independent.
For a project subpath, set both:

```bash
SITE_URL=https://example.com/tool-containers BASE_PATH=/tool-containers npm run build
```

The [Pages workflow](../.github/workflows/web-ui.yml) runs the tests, builds with the
default configuration, and publishes `dist/`.

## Layout

```text
src/build.mjs     build orchestration; exports build({ env, root, outDir })
src/lib/          build-time modules: content discovery, links, Markdown, SEO, layout
src/shared/       modules used by both the build and the browser (search, escaping)
src/pages/        home, doc, search, and not-found templates
src/client/       main.js, the lazy search-ui.js, and the pre-paint theme.js
src/styles/       base, layout, components, and prose CSS
public/           files copied to dist/ as-is
tests/            unit tests and site tests
```

## Tests

`npm test` needs no prior build. The site tests build the real repository into
temporary directories twice. The first build uses the default configuration. The second
sets `SITE_URL` and `BASE_PATH` for a subpath. The tests parse every page and check:

- the page set matches the tracked Markdown inventory;
- each page has exactly one h1;
- titles are unique and at most 60 characters;
- descriptions are unique and at most 160 characters;
- internal links, assets, and fragments resolve inside `BASE_PATH`;
- canonical tags and the sitemap cover exactly the indexable pages;
- JSON-LD parses and its breadcrumb matches the visible one;
- the search index covers every page;
- the favicon and manifest are valid;
- raw size budgets hold (about twice the current output).

Fixture repositories cover escaping of hostile frontmatter and headings, and invalid
content. Unit tests cover:

- frontmatter rules;
- link resolution;
- headings and rendering rules;
- search ranking, typos, and highlighting.
