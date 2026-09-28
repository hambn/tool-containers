# Web UI

A static catalog and documentation site generated from the root [README](../README.md)
and the category, tool, and platform READMEs under `tools/`. Browsers get pre-rendered HTML, one
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
| `tools/<category>/README.md`                        | `/docs/<category>/`                   |
| `tools/<category>/<tool>/README.md`                 | `/docs/<category>/<tool>/`            |
| `tools/<category>/<tool>/docs/<platform>/README.md` | `/docs/<category>/<tool>/<platform>/` |

The frontmatter contract is defined in
[`$documentation`](../.agents/skills/documentation/SKILL.md) and enforced strictly. The
build fails on any of these:

- unknown, missing, duplicate, or wrongly typed keys (YAML 1.1, as PyYAML reads it),
  or invalid values;
- frontmatter in the root README;
- an unknown platform directory;
- a tool without a category README, or a platform doc without a tool README;
- a category README whose `## Tools` section does not link each tool once, in `order`;
- a raw HTML block, or a link that fails to resolve (see below).

The build validates and renders every document before it writes anything, then reports
every problem at once and names each file:

```text
build failed: Invalid documents:
  - tools/ai/codex/docs/helm/README.md: missing required key "usecase"
  - tools/ai/codex/README.md: keywords: expected list, got string
```

A failed build leaves the previous `dist/` untouched. A successful build writes into a
sibling `.dist-*` staging directory and swaps it in by rename, so a server on `dist/`
never sees a half-written site.

[`check-repo.py`](../.github/scripts/check-repo.py) enforces the same document rules.
The cases in [`tests/fixtures/documents.yaml`](tests/fixtures/documents.yaml) pin them:
`tests/fixtures.test.mjs` and
[`test_check_repo.py`](../.github/scripts/test_check_repo.py) each apply every case to
the same base tree and must flag the same files. Add a case there when a rule changes.

To add, rename, or remove a document or recipe file, change it and rebuild. There is no
content list to update.

### Rendering rules

- The document's `# Title` and first paragraph become the page heading and lead. The
  frontmatter `description` is used only for meta tags and search, so the lead is
  never shown twice.
- A `## Contents` section that holds only same-page links is dropped, because the
  page's table of contents replaces it.
- A list item whose only link points at the page itself (such as a "Docs:" link to the
  site) is dropped. On tool and platform pages, so is one that links the page's own
  source directory, because the facts panel shows it. A list left empty by this rule
  disappears.
- On a category page, the `## Tools` section is replaced by cards generated from the
  tool READMEs: each tool's title, description, images, and platform links.
- Categories and tools appear in frontmatter `order` everywhere; platforms follow the
  fixed platform order.
- Links are resolved against the Git inventory:
  - Links to documents become site routes.
  - Links to a platform's sibling files become in-page anchors. A link with a fragment
    into one of those files goes to GitHub instead.
  - Other repository paths go to GitHub `blob` or `tree` URLs.
  - Absolute links into `SITE_URL` follow `BASE_PATH`.
- These fail the build: a link that climbs out of the repository, a link with any
  scheme other than `http:`, `https:`, or `mailto:`, and raw HTML.
- Links that leave the site open in a new tab, with an arrow icon and hidden
  "(opens in new tab)" text. Links to site pages and in-page anchors stay in the tab.
- Code blocks get a header with the language and a copy button, and scroll as a
  keyboard-focusable region. Token colours are adjusted at build time to at least
  4.5:1 against the code background in both themes.
- On platform pages, every sibling file (scripts, manifests, charts) appears under
  "File contents". Files over 40 lines start collapsed. Binary files and files over
  128 KiB keep their GitHub links.

## Features

- **Catalog:** a hero from the root README (title, first sentence, search, and counts),
  then the images grouped by category. Each row shows the title and description and
  every `images` entry with its registry and a copy button. Platforms are left to the
  docs.

  You can filter by text and category; the state is kept in the URL (`?q=&category=`).
  The filter uses the search matcher: exact and prefix matches first, and one-typo
  matches only when nothing else matches.
- **Search:** press `/` or Ctrl/Cmd+K to open the search dialog. With an empty query, it
  lists the images and your recently viewed pages. Results are grouped by page, with
  matching sections nested under each page. The same engine powers the `/search/?q=`
  page, which shows every result.
- **Docs:**
  - A sidebar tree whose category labels open the category pages, breadcrumbs, and
    platform tabs.
  - A category page per category, with a card per tool: images and platform links.
  - A facts panel on tool and platform pages: images, use case, upstream, and source.
  - The page's keywords as "Topics" tags, each a link to a search for that keyword.
  - A table of contents that highlights the section in view, and becomes a
    collapsible panel below 1280px.
  - A page footer with an "Edit this page on GitHub" link, the last Git change, and
    previous/next links.
  - Below 1024px the sidebar moves into a menu drawer, which also holds the theme
    switch and the GitHub link.
  - A light/dark theme that follows the OS until you choose one. Copy results are
    announced to screen readers.
- **SEO:**
  - Titles and descriptions come from frontmatter or from whole sentences of the root
    README lead.
  - Canonical and `og:url` tags appear only on indexable pages.
  - JSON-LD: WebSite with SearchAction, CollectionPage with an ItemList of tools (home
    and category pages), and TechArticle with Git dates.
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
- Only `/docs/` pages are indexed; a category page indexes its generated tool list.
- Code blocks are never indexed.

## Deployment configuration

| Variable            | Purpose                                                      | Default                           |
| ------------------- | ------------------------------------------------------------ | --------------------------------- |
| `SITE_URL`          | Public URL for canonical links, structured data, and sitemap | `https://tool-containers.hgh.dev` |
| `SITE_ORIGIN`       | Older alias for `SITE_URL`, used only when that is unset     | unset                             |
| `BASE_PATH`         | Optional prefix for internal links and assets                | empty                             |
| `GITHUB_SERVER_URL` | GitHub host for source links (set by Actions)                | `https://github.com`              |
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
src/lib/          build-time modules: content discovery, links, Markdown, SEO, layout;
                  ui.mjs holds shared markup (image lists, chips, external links) and
                  text.mjs the sentence helpers
src/shared/       modules used by both the build and the browser (search, escaping,
                  fragment decoding)
src/pages/        home, doc, search, and not-found templates
src/client/       main.js, the lazy search-ui.js, and the pre-paint theme.js
src/styles/       base, layout, components, and prose CSS
public/           files copied to dist/ as-is
tests/            unit tests and site tests
tests/fixtures/   document cases shared with check-repo.py
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
- the search index covers every `/docs/` page;
- category pages list their tools in `order`, with images and platform links, and the
  sidebar links them;
- off-site links open in a new tab and say so; keyword tags link to search;
- code token colours meet 4.5:1 on the code background in both themes;
- the favicon and manifest are valid;
- raw size budgets hold (about twice the current output).

Fixture repositories cover escaping of hostile frontmatter and headings, and a failed
build that must report every problem and keep the previous output. Unit tests cover:

- frontmatter and cross-document rules, including the shared fixture cases;
- link resolution;
- headings and rendering rules;
- search ranking, typos, highlighting, and the catalog filter's typo fallback;
- fragment decoding for in-page links.
