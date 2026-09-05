# Web UI

A static catalog and documentation site generated from the root [README](../README.md)
and tool and platform READMEs under `tools/`. The browser receives HTML, one shared CSS
file, and a small script for filtering, theme selection, navigation, and copying code.
System fonts avoid font downloads. No client framework, API, or application server is
needed in production.

## Build and preview

Use Node.js 22 or newer and Python 3 for the local static server:

```bash
npm ci
npm run build
npm test
npm run preview
```

Open [localhost:4173](http://localhost:4173). The preview listens on all interfaces so
other devices can reach it using the machine's address. It serves `dist/`; rebuild after
changing source files or Markdown. Stop the preview with Ctrl+C.

`marked`, `shiki`, and `esbuild` are build dependencies only. Markdown parsing, syntax
highlighting, and minification all happen before the site is served.

## Content flow

1. `src/lib/catalog.mjs` discovers `tools/<category>/<tool>/README.md` and
   `tools/<category>/<tool>/examples/<platform>/README.md`.
2. `src/build.mjs` reads each document once. The home catalog gets its title, description,
   cards, category filters, and platform links from those documents and directories.
3. `src/lib/markdown.mjs` parses Markdown tokens. Document links become site links;
   other repository files link to GitHub. Reference links and nested code fences work,
   and code examples retain their original text.
4. `/docs/` renders the complete root README. Tool and example pages render their own
   README with section links, navigation, and a table of contents. README links point
   to the complete document so fragments such as `README.md#catalog` resolve.
5. `src/lib/seo.mjs` derives page metadata and structured data from the content.
   The build emits canonical URLs, social tags, `sitemap.xml`, `robots.txt`, a noindex
   `404.html`, and `.nojekyll` for GitHub Pages.

Add, rename, edit, or remove a tool or platform README, then rebuild. No application
content list needs updating. Search filters the generated HTML locally, including
platform names and catalog descriptions. All documents and links remain usable with
JavaScript disabled.

## Deployment configuration

| Variable    | Purpose                                                                   | Default                                   |
| ----------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| `SITE_URL`  | Full public URL for canonical links, structured data, sitemap, and robots | `https://hambn.github.io/tool-containers` |
| `BASE_PATH` | Optional internal link and asset prefix                                   | Empty                                     |

The values are independent. The existing [Pages workflow](../.github/workflows/web-ui.yml)
sets `SITE_URL` for its custom domain. For another custom domain:

```bash
SITE_URL=https://docs.example.com npm run build
SITE_URL=https://docs.example.com npm test
```

For a GitHub Pages project site, set both values explicitly:

```bash
SITE_URL=https://example.com/tool-containers BASE_PATH=/tool-containers npm run build
SITE_URL=https://example.com/tool-containers BASE_PATH=/tool-containers npm test
```

`SITE_ORIGIN` is a compatibility alias for `SITE_URL`. `BASE_PATH` is normalized to one
leading slash with no trailing slash. A default build uses root-relative navigation;
it never infers a path prefix from the public URL. Always test using the same environment
as the build. Run `npm run build` again to restore the default artifact for local preview.

Publish the contents of `dist/` to GitHub Pages or any static host. Environment changes
after building do not change generated HTML. The Pages workflow rebuilds when site code,
the root README, or tool READMEs change. Hashed CSS and JavaScript filenames allow cache
reuse across pages.

## File structure

```text
web-ui/
├── src/
│   ├── build.mjs          # Build orchestration and artifact generation
│   ├── lib/               # Catalog, Markdown, metadata, assets, and shared page shell
│   ├── pages/             # Catalog, document, and not-found templates
│   ├── client/            # Pre-paint theme script and deferred enhancements
│   └── styles/            # Shared tokens and styles for home and documentation
├── public/                # Branding assets copied into the build
├── tests/
│   ├── markdown.test.mjs  # Parsing, discovery changes, URLs, and minification
│   └── site.test.mjs      # Generated pages, links, SEO, and asset budgets
└── dist/                  # Generated static files, excluded from Git
```

Keep content in repository Markdown and application behavior under `src/`. The neutral
CSS tokens follow the [shadcn theming convention](https://ui.shadcn.com/docs/theming),
with light and dark palettes. No React component library is shipped.

## Verification

`npm test` independently compares generated routes with the tracked Markdown inventory
from Git. It checks titles and descriptions, heading counts, internal links and fragments,
canonical URLs, structured data, sitemap coverage, the 404 page, and the Pages marker.
Each shared CSS and JavaScript asset has an 8 kB gzip budget. Parser tests cover reference
links, preserved code text, nested and unfinished fences, and document discovery changes.

After changing routing or deployment URLs, build and test both default and explicit
subpath configurations. After changing the interface, inspect desktop and mobile widths,
light and dark themes, keyboard focus, filtering, clipboard behavior, horizontal overflow,
and navigation with JavaScript disabled in a browser.

SEO metadata follows [Google's developer guidance](https://developers.google.com/search/docs/fundamentals/get-started-developers).
Structured data describes the visible catalog and technical articles, without inferred
ratings, prices, or setup durations. Indexing and ranking are controlled by search engines;
the generated files provide the technical foundation.
