---
name: web-ui
description: Build, change, review, or troubleshoot the repository's static documentation-showcase website under web-ui/ hosted on GitHub Pages - the build-time markdown pipeline over the root catalog and images/ READMEs, shadcn-style pre-rendered HTML/CSS interface, SEO, tests, and UI-specific CI. Use when the primary target is web-ui/; do not use for container deployment recipes under images/.
---

# Web UI

Own all application work under `web-ui/`: a static documentation-showcase website for
this repository, hosted on GitHub Pages. These decisions are settled; do not relitigate
them without an explicit user request.

## Product contract

The site automatically showcases the repository's markdown as pages — nothing else:

- Content source of truth is the tracked documents themselves: root `README.md`, every
  `images/<category>/<tool>/README.md`, and every
  `images/<category>/<tool>/examples/<platform>/README.md`. Document standards live
  in `$documentation`.
- Generate pages at build time from those files. Never copy catalog rows, commands, or
  README text into UI code or data files by hand. Adding, editing, or removing anything
  under `images/` or its READMEs — or the root catalog — updates the site through a
  normal rebuild; that is the only supported way to change site content.
- Navigation mirrors the repository shape: catalog categories → tools → tool page → its
  platform-example pages. Every discovered document gets a page. Optional display
  metadata (ordering, descriptions) lives inside `web-ui/` and must not duplicate
  document content.

## Technical contract

- Target GitHub Pages: the built artifact is fully static files with no runtime server,
  no server-side rendering at request time, and no client-side fetching of external
  APIs. The same `dist/` artifact may be served by a container or any static file host.
- Pre-render to plain HTML/CSS for speed and SEO. A Next.js static export is acceptable
  if it serves these goals; otherwise prefer the lightest static generator. Ship
  minimal or no client JavaScript.
- SEO requirements per page: semantic HTML, exactly one `<h1>`, unique title and meta
  description from document content, clean slugs, generated sitemap and robots where
  the pipeline supports them.
- Design language: basic modern shadcn style — neutral surfaces, restrained color,
  rounded borders, subtle borders/shadows, clean typography, dark-mode-friendly tokens;
  the markdown renderer plus a sidebar/nav are the core components. Weight performance
  above decoration: small payload, no heavy frameworks in the shipped bundle.
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

After each mode, run the generated-site tests with the same environment used for its
build. Restore the default build before local browser inspection or handoff unless the
user asked to keep a prefixed artifact.

Use `$repository-changes` for Git isolation and handoff. Load `$container-images` only
when UI packaging is implemented as a cataloged project under `images/` or changes
shared image-publication behavior; UI application rules remain owned here.
