---
name: documentation
description: Write and review the repository's written documents - the root catalog README, every tools/<category>/README.md and tools/<category>/<tool>/README.md, and every per-platform doc README (and their YAML frontmatter) - including their required sections, cross-links, and quality bar. Use when adding, editing, or reviewing any README or document in this repository; do not use for Dockerfiles, CI workflows, or the web-ui application itself.
---

# Documentation

Own the written-document standards of this repository: what each README must contain,
how documents link to each other, and the quality bar they must meet. Build, publish,
and platform mechanics stay owned by `$container-images`; rendering stays owned by
`$web-ui`. These documents are read in two places — on GitHub and as pages of the
`web-ui` showcase site generated from them — so write each one to stand alone.

## Document tiers

| Document | Path | Role |
|---|---|---|
| Root catalog | `README.md` | Public index of every tool |
| Category README | `tools/<category>/README.md` | What one category is for and which tools it holds |
| Tool README | `tools/<category>/<tool>/README.md` | One tool's full public contract |
| Platform doc | `tools/<category>/<tool>/docs/<platform>/README.md` | Runnable recipes for one platform |

## Root catalog

- Contain the title and repository description, the repository-guidance pointer, and
  one subsection per category with a table of tool links and one-line descriptions.
  Each category heading is a link to its category README at `./tools/<category>/`.
- List every tool exactly once using `tools/<category>/<tool>/` links.
- Keep category order stable and show a catalog category with no implementation as
  `_None yet._`.
- Add or remove the catalog row in the same change as the project.
- Keep operational detail in the tool README; the catalog links, it does not explain.

## Category README

Keep `tools/<category>/README.md` short and factual: the `# <title>` heading, one intro
paragraph on what the category holds, the **Source** and **Docs** links as in a tool
README, then a `## Tools` section. That section holds only bullets and blank lines: one
bullet per tool directory, each exactly once, in the tools' `order`. A bullet is the
tool title linked to `./<tool>/`, then ` — ` and a prose description with no links or
HTML. The site
replaces this section with a generated tool list, so keep anything else out of it.

## Tool README

Keep `tools/<category>/<tool>/README.md` direct and operational. Keep these core
sections in this relative order; add a focused tool-specific section only when it
materially helps operation:

1. **Title and one-line description**: `# <title>`, then a lead sentence that says what
   the image holds and who it is for, identifying and linking the upstream tool,
   followed by a **Source** link to the tool directory on GitHub
   (`https://github.com/hambn/tool-containers/tree/main/tools/<category>/<tool>`) and a
   **Docs** link to its site page (`https://tool-containers.hgh.dev/docs/<category>/<tool>/`).
2. **Contents** linking the remaining sections.
3. **Images** as a list, one item per published variant: the bold variant name and a
   short description, with nested **Base**, **Tags** (the variant tag, plus `latest` and
   any version tag where owned), and **Included software** items; the last
   links this README's Included software section and the parent image's tier or
   section. Use no tables. State the GHCR (`ghcr.io/hambn/<repo>`) and Docker Hub
   (`docker.io/hambn/<repo>`) pull paths and, once, that a digest pins a moving tag.
   Mention tags that are no longer published only when they still exist in a registry,
   in one line.
4. **Included software** as nested lists (grouped by tier or by tool, with commands and
   sources), and what comes from the parent image. Base images without a bundle may
   use a focused section such as Hardening instead.
5. **Use cases** with three to seven concrete scenarios, each a bold scenario name and
   links to the platform docs that serve it. The scenario name is the `usecase` of the
   platform doc it links; when one scenario links two platform docs, each `usecase`
   extends the name to stay unique (for example "… from plain manifests" and
   "… from a Helm chart").
6. **Sources** linking upstream repository, package registry, and authoritative docs
   where available.

Do not list the tool's files; the Source link opens the directory. Do not duplicate
`docker run` instructions in the tool README; runnable commands belong under
`docs/<platform>/`. Do not add a generic build or update section when CI is the sole
supported build/update path.

## Platform doc

Title the document `# Run <tool title> with <platform name>`, the heading the web-ui
shows. Open with one or two sentences that say what the recipe does and link the tool
README, `../../README.md`, by the tool title; that link is the way back
to variants and tags, so do not add a separate "see the tool overview" line.

Then cover, in this order where applicable: prerequisites, exact commands, required
variables or secrets, workspace behavior, a **Files** section listing every file in its
directory, cleanup, and limitations. Write Cleanup and Limitations only when they hold
something specific to this recipe; omit them rather than restate `--rm`, generic
`docker image rm`, or tag drift. Say once, in the image variable's row or the sentence
that introduces the default image, that a digest pins the moving tag. Keep commands
copy-pasteable and consistent with the Dockerfile and tool README; technical
conventions live in `$container-images`.

Link each runnable file with a relative link such as `./run.sh` instead of embedding its
contents: the web-ui renders sibling files inline, so embedded copies duplicate and
drift. Short command lines to type are fine. Example image references use moving
tags from `ghcr.io/hambn/<repo>`.

## Frontmatter contract

Every category README, tool README, and platform doc starts with YAML frontmatter. The
web UI reads it for page titles, meta descriptions, catalog cards, ordering, structured
data, and search. `.github/scripts/check-repo.py` and the web UI enforce identical
rules, pinned by the shared cases in `web-ui/tests/fixtures/documents.yaml` that both
run. Use flat keys only, plain scalars or flow lists, and quote a value only when YAML
would misread it (for example one containing `: ` or ` #`). No other keys are allowed.

```yaml
---
name: codex
title: Codex CLI
description: OpenAI Codex CLI on the devbox development image, with Ubuntu and Alpine variants and optional headless Chromium.
order: 3
images: [ghcr.io/hambn/codex, docker.io/hambn/codex]
upstream: https://github.com/openai/codex
keywords: [openai, coding agent, devbox, ubuntu, alpine, headless chromium]
---
```

Values are parsed as YAML 1.1 and must have the exact type: a bare `yes`, `on`, `123`, or
date where a string is required is an error, as is a boolean `order`; quote such strings.
Duplicate keys are an error. A **plain string** is a single line without Markdown or
HTML (no backticks, `*`, `<`, `>`, link syntax, leading `#`, or `_` emphasis); lengths are
measured and uniqueness is compared after trimming, ignoring case.

Category README (`tools/<category>/README.md`):

| Key | Required | Rule |
|---|---|---|
| `name` | yes | Equals the `<category>` directory name |
| `title` | yes | Plain string display name, for example `AI` |
| `description` | yes | Plain string, 110–160 characters, unique across all documents |
| `order` | yes | Integer ≥ 1, unique among categories; sorts categories everywhere |

Tool README (`tools/<category>/<tool>/README.md`):

| Key | Required | Rule |
|---|---|---|
| `name` | yes | Equals the `<tool>` directory name |
| `title` | yes | Plain string display name of the product, for example `Claude Code` or `core` |
| `description` | yes | Plain string, 110–160 characters, unique across all documents |
| `order` | yes | Integer ≥ 1, unique within the category; sorts tools everywhere |
| `images` | yes | Untagged references in display order, no duplicates: `ghcr.io/hambn/<name>` first, then `docker.io/hambn/<name>` when published there |
| `upstream` | no | `https://` URL of the upstream project; omit for images built only here |
| `keywords` | no | Flow list of 3–8 unique plain strings |

Platform doc (`tools/<category>/<tool>/docs/<platform>/README.md`):

| Key | Required | Rule |
|---|---|---|
| `name` | yes | Fixed by directory, which also sets platform order: `docker` → Docker, `docker-compose` → Docker Compose, `podman` → Podman, `kubernetes` → Kubernetes, `helm` → Helm, `github-actions` → GitHub Actions, `gitlab-ci` → GitLab CI, `devcontainer` → Dev Container; any other directory fails |
| `description` | yes | Plain string, 110–160 characters, unique across all documents |
| `usecase` | yes | Plain string of at most 80 characters, unique within the tool, matching its Use cases scenario name |
| `keywords` | no | Flow list of 2–6 unique plain strings |

The root `README.md` has no frontmatter. Derive every value from the document's own
content; the `# Title` heading and body stay unchanged below the frontmatter:

- Write descriptions as one sentence without Markdown, stating what the image or recipe
  does. Avoid time-bound or unverifiable claims such as "every current agent".
- Pick keywords a reader would search for that the page does not already carry: skip
  the tool name, title, platform name, and generic terms such as `cli` or
  `docker image`.
- Give a new tool the next free `order` in its category and add its bullet to the
  category README's `## Tools` section in the same change.

When a rule changes, change `check-repo.py`, `web-ui/src/lib/frontmatter.mjs` (and
`content.mjs` for cross-document rules), and the shared fixture cases together. A new
platform also needs a group in `PLATFORM_GROUPS` (`web-ui/src/pages/doc.mjs`), or the
site's platform switcher lists it under "More".

## Cross-linking contract

Every document must be reachable from every other document of the same tool, with no
orphan pages:

- Catalog → every category README and tool README; category README → every tool README
  through its Tools section; tool README → every platform doc through its Use cases;
  platform doc → its tool README through the tool-name link in its intro, and → every
  file in its directory through its Files section (`check-repo.py` enforces the latter).
- Update the Files section in the same change that adds, moves, or removes a file in
  the platform directory, and the Use cases in the same change that adds or removes a
  platform doc.
- Use relative GitHub-compatible links between repository documents; verify claimed
  inventories against:

```sh
git ls-files 'tools/<category>/<tool>/**'
```

## Quality bar

Documents are rendered verbatim by the web-ui showcase, so author for both surfaces:

- Correct heading hierarchy (one `<h1>` equivalent per document), well-formed tables,
  fenced code blocks with language hints, and alt text on images.
- No HTML-only tricks, no repository-absolute paths in links, no content that depends
  on being viewed inside a specific UI.
- Each document answers "what is this, how do I use it, where do I go next" without
  requiring another tab open first.

## Writing style

Write the way the Docker, Tailscale, or Fly.io docs read: plain, direct, and specific.

- Use the second person and the imperative for instructions ("Run", "Set", "Mount"),
  not "You can…". Keep paragraphs short and prefer concrete nouns, numbers, and
  pasteable commands. Use tables for variables and settings.
- Write each page for its own tool and platform. Do not copy a paragraph across pages
  with only the tool name swapped; if a sentence would read the same on every page, it
  belongs once in the tool README or nowhere.
- Cut filler and marketing words ("many purposes", "and more", "seamless", "powerful",
  "easily", "simply") and vague catch-alls ("everything else comes from…"). Name the
  thing instead.
- Use plain bullets. Do not chain clauses with em dashes or open every bullet with a
  bold lead; bold is for the Images variant names and Use cases scenario names.
- Frontmatter descriptions and keywords describe the page in a sentence and a few
  search terms, not a keyword list.
- State only facts checked against the Dockerfile, bake file, workflow, or upstream docs,
  and remove a claim when it stops being true.

When editing an image project, load `$container-images` for mechanics and apply this
skill for everything written down. Run `$maintain-agent-workspace` after the change.
