---
name: web-ui
description: Build, change, review, or troubleshoot the repository's static documentation-showcase website under web-ui/ hosted on GitHub Pages - the build-time markdown pipeline over the root catalog and tools/ READMEs, shadcn-style pre-rendered HTML/CSS interface, SEO, tests, and UI-specific CI. Use when the primary target is web-ui/; do not use for container deployment recipes under tools/.
---

# Web UI

Own all application work under `web-ui/`: a static documentation-showcase website for
this repository, hosted on GitHub Pages. These decisions are settled; do not relitigate
them without an explicit user request.

## Product contract

The site automatically showcases the repository's markdown as pages — nothing else:

- Content source of truth is the tracked documents themselves: root `README.md`, every
  `tools/<category>/README.md`, every `tools/<category>/<tool>/README.md`, and every
  `tools/<category>/<tool>/docs/<platform>/README.md`, discovered with `git ls-files`
  (untracked files never publish). Document standards live in `$documentation`.
- Generate pages at build time from those files. Never copy catalog rows, commands, or
  README text into UI code or data files by hand. Adding, editing, or removing anything
  under `tools/` or its READMEs — or the root catalog — updates the site through a
  normal rebuild; that is the only supported way to change site content.
- Render the complete root README at `/docs/`; the home page is its derived catalog.
- Each category README renders at `/docs/<category>/` with the breadcrumb Docs /
  category. Its `## Tools` section is replaced by a tool list generated from the tool
  READMEs (title, description, and every `images` entry), so the README's bullets never
  drift from the site.
- Categories and tools sort by frontmatter `order` everywhere: catalog, sidebar, docs
  overview, search empty state, `llms.txt`, and the sitemap. Platforms follow the fixed
  platform order in `$documentation`.
- A tool's `images` list (GHCR first) is the only source of image references; show the
  list, never a hand-built registry path.
- Platform pages render their sibling recipe files (scripts, manifests, charts) inline
  from the tracked files, which is why platform READMEs link rather than embed them.
- Site-only rendering rules, so a README reads well on both GitHub and the site:
  - Drop a `## Contents` section whose content is only a list of same-page links; the
    page's table of contents replaces it.
  - Drop a list item whose only link targets the current page's own site URL (the
    "Docs:" self-link), and drop a list this empties.
  - The first `# Title` and paragraph become the page heading and lead; the frontmatter
    `description` feeds meta tags and search only, so the lead is never duplicated.
- Resolve links against the Git inventory, never the working tree:
  - Repository README links go to the full document, so section fragments stay valid.
  - Sibling recipe files become in-page anchors, unless the link has a fragment.
  - Any other repository path becomes a GitHub blob or tree URL.
  - A link that leaves the repository fails the build, as does a non-http(s)/mailto
    scheme and raw HTML.
- Navigation mirrors the repository shape: catalog → category page → tool page → its
  platform pages. Sidebar category labels link their category page. Every discovered
  document gets a page.
- Page metadata comes from YAML frontmatter (parsed with `yaml`), validated strictly
  against the contract in `$documentation`:
  - Unknown, missing, or mistyped keys fail the build, as do invalid values.
  - So do frontmatter in the root README, unknown platform directories, a tool without
    its category README, a platform doc without its tool README, and a category
    `## Tools` section that does not link each tool once in `order`.
  - The build validates and renders every document first and reports every problem —
    frontmatter, Markdown, and links — at once, each naming its file. Only then does it
    write, into a sibling staging directory that replaces `dist/` by rename, so a
    failed build leaves the previous `dist/` intact.
  - `check-repo.py` holds the same rules; the shared cases in
    `tests/fixtures/documents.yaml` run against both.
  - Never default around a failure or keep metadata tables in UI code.
- Search is fully static. A content-addressed JSON index is loaded lazily by the dialog
  (`/`, Ctrl/Cmd+K) and by the noindex `/search/?q=` page, which is also the WebSite
  SearchAction target.
  - The index covers the `/docs/` pages and holds titles, frontmatter, headings, and
    full section prose, never code. A category page indexes its generated tool list.
  - Ranking and matching live in the pure `src/shared/search.mjs`, shared by the
    browser and the tests; the home filter uses the same matcher.
  - Every term must match. Matches are exact, prefix, or within one typo for terms of
    five or more characters. Fields rank title > headings > keywords/use case >
    description > prose.
  - Highlight raw text, then escape it.

## Technical contract

- Target GitHub Pages: the built artifact is fully static files with no runtime server,
  no server-side rendering at request time, and no client-side fetching of external
  APIs. The same `dist/` artifact may be served by a container or any static file host.
- Pre-render to plain HTML/CSS for speed and SEO. A Next.js static export is acceptable
  if it serves these goals; otherwise prefer the lightest static generator. Ship
  minimal or no client JavaScript.
- Keep structured data limited to facts in the visible documents. Do not infer setup
  durations, prices, ratings, or publisher identity. Use TechArticle for tool, platform,
  and root README pages, and CollectionPage with an ItemList of its tools for the home
  and category pages (never SoftwareApplication), and emit BreadcrumbList only where a visible breadcrumb with at
  least two items exists. Canonical and `og:url` tags appear on indexable pages only.
- Escape every value interpolated into HTML or XML through the `html` tagged template
  or `escapeHtml`; JSON-LD escapes `<`.
- SEO requirements per page: semantic HTML, exactly one `<h1>`, unique title and meta
  description from document content, clean slugs, generated sitemap and robots where
  the pipeline supports them.
- Design language: minimal modern shadcn zinc style.
  - Tokens are CSS `light-dark()` values that follow the OS until the user picks a
    theme.
  - One radius scale (8/6/4/12px), the system font stack, and one shared container.
  - The Markdown renderer plus the sidebar and nav are the core components.
  - Weight performance above decoration: small payload, no web fonts, and no heavy
    frameworks in the shipped bundle.
- Accessibility floor on every surface: semantic landmarks, keyboard operation, visible
  focus, sufficient contrast, reduced-motion support.
- A static showcase has no secrets; never introduce tokens, analytics keys, or private
  endpoints into the build.
- Keep every application file inside `web-ui/` (source, config, styles, tests, static
  assets, UI docs). One deliberate exception: `.github/workflows/web-ui*.yml` lives in
  `.github/workflows/` because GitHub requires it there; keep it filtered to
  `web-ui/**`.

## Public URL contract

Keep the public SEO URL independent from the path used by browser navigation:

- `SITE_URL` is the full deployed site URL. Use it for canonical links, structured
  data, the sitemap, and `robots.txt`. It may include a path when the deployment lives
  below the host root. `SITE_ORIGIN` is a compatibility alias, not the preferred name.
- `BASE_PATH` is the optional path prefix for internal links and local assets. Normalize
  it to either an empty string or one leading slash with no trailing slash.
- Default `BASE_PATH` to empty. Local servers and custom domains must produce `/docs/`
  routes, never a repository-name prefix inferred from `SITE_URL`, the Git remote, or
  the GitHub Pages repository name.
- For a subpath deployment, set both values explicitly. For example,
  `SITE_URL=https://example.com/tool-containers` and `BASE_PATH=/tool-containers`.

Do not bake a deployment host or path into catalog discovery, page routes, or document
content. Build with the intended environment before serving `dist/`; changing these
variables at runtime cannot alter already generated HTML.

## Code layout

- `src/build.mjs` orchestrates and exports `build({ env, root, outDir })`.
- `src/lib/` holds the build-time modules. `site.mjs` is the single owner of pages,
  routes, labels, and order.
- `src/shared/` holds modules the browser bundle and Node share.
- `src/pages/` holds the templates.
- `src/client/` holds the module script, the lazy search UI, and the pre-paint theme.
- `tests/` holds unit tests and site tests; `tests/fixtures/` holds the document cases
  shared with `check-repo.py`.

## Verification

Run the applicable commands declared by the implemented project, never guessed commands.
For affected user-visible behavior, inspect the UI in a real browser at representative
desktop and mobile widths and cover the relevant console/network errors, keyboard and
focus behavior, overflow, and asynchronous states. For content-pipeline changes, verify
the generated page set matches the tracked markdown inventory (spot-check new, renamed,
and removed documents) rather than only eyeballing one page.

When routing, SEO URLs, or asset paths change, verify both hosting modes:

- A default build has root-relative internal routes such as
  `/docs/ai/codex/docker/`, with no implicit `/tool-containers/` prefix.
- A build with explicit `SITE_URL` and `BASE_PATH` prefixes internal routes exactly
  once while keeping canonical and sitemap URLs under `SITE_URL`.

`npm test` builds both modes into temporary directories itself, so it never depends on
a stale `dist/`. Keep its assertions structural (parse the HTML) rather than
exact-HTML regexes. When output grows on purpose, raise the size budgets to about
twice the new actuals. Restore the default build before local browser inspection or
handoff unless the user asked to keep a prefixed artifact.

Use `$repository-changes` for Git isolation and handoff. Load `$container-images` only
when UI packaging is implemented as a cataloged project under `tools/` or changes
shared image-publication behavior; UI application rules remain owned here.
