---
name: documentation
description: Write and review the repository's written documents - the root catalog README, every tools/<category>/<tool>/README.md, and every per-platform doc README (and their YAML frontmatter) - including their required sections, cross-links, and quality bar. Use when adding, editing, or reviewing any README or document in this repository; do not use for Dockerfiles, CI workflows, or the web-ui application itself.
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
| Tool README | `tools/<category>/<tool>/README.md` | One tool's full public contract |
| Platform doc | `tools/<category>/<tool>/docs/<platform>/README.md` | Runnable recipes for one platform |

## Root catalog

- Contain the title and repository description, the repository-guidance pointer, and
  one subsection per category with a table of tool links and one-line descriptions.
- List every tool exactly once using `tools/<category>/<tool>/` links.
- Keep category order stable and show a catalog category with no implementation as
  `_None yet._`.
- Add or remove the catalog row in the same change as the project.
- Keep operational detail in the tool README; the catalog links, it does not explain.

## Tool README

Keep `tools/<category>/<tool>/README.md` direct and operational. Keep these core
sections in this relative order; add a focused tool-specific section only when it
materially helps operation:

1. **Title and one-line description** identifying and linking the upstream tool,
   followed by a **Source** link to the tool directory on GitHub
   (`https://github.com/hambn/tool-containers/tree/main/tools/<category>/<tool>`) and a
   **Docs** link to its site page (`https://tool-containers.hgh.dev/docs/<category>/<tool>/`).
2. **Contents** linking the remaining sections.
3. **Images** as a list, one item per published variant: the bold variant name and a
   short description, with nested **Base**, **Tags** (the variant tag, plus `latest` and
   any version tag where owned), and **Included software** items; the last
   links this README's Included software section and the parent image's tier or
   section. Use no tables. State the GHCR (`ghcr.io/hambn/<repo>`) and Docker Hub
   (`docker.io/hambn/<repo>`) pull paths. Previous-layout tags get at most a one-line
   deprecation note.
4. **Included software** as nested lists (grouped by tier or by tool, with commands and
   sources), and what comes from the parent image. Base images without a bundle may
   use a focused section such as Hardening instead.
5. **Use cases** with three to five concrete scenarios, each a bold scenario name and
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

Each present platform README explains, in this order where applicable: prerequisites,
exact commands, required variables or secrets, workspace behavior, a **Files** section
listing every file in its directory, cleanup, and limitations. Keep commands
copy-pasteable and consistent with the Dockerfile and tool README; technical
conventions live in `$container-images`.

Link each runnable file with a relative link such as `./run.sh` instead of embedding its
contents: the web-ui renders sibling files inline, so embedded copies duplicate and
drift. Short command lines to type are fine. Example image references use moving
tags from `ghcr.io/hambn/<repo>`.

## Frontmatter contract

Every tool README and every platform doc starts with YAML frontmatter. The web UI reads
it for page titles, meta descriptions, catalog cards, structured data, and search, and
`.github/scripts/check-repo.py` enforces it. Use flat keys only, plain scalars or flow
lists, and quote a value only when YAML would misread it (for example one containing
`: ` or ` #`). No other keys are allowed.

```yaml
---
name: codex
title: Codex CLI
description: OpenAI Codex CLI on the devbox development image, with Ubuntu and Alpine variants and optional headless Chromium.
upstream: https://github.com/openai/codex
image: ghcr.io/hambn/codex
keywords: [openai, coding agent, devbox, ubuntu, alpine, headless chromium]
---
```

Tool README (`tools/<category>/<tool>/README.md`):

| Key | Required | Rule |
|---|---|---|
| `name` | yes | Equals the `<tool>` directory name |
| `title` | yes | Human display name of the product, for example `Claude Code` or `core` |
| `description` | yes | Plain text, 110–160 characters, unique across tool READMEs |
| `image` | yes | Exactly `ghcr.io/hambn/<name>` |
| `upstream` | no | `https://` URL of the upstream project; omit for images built only here |
| `keywords` | no | Flow list of 3–8 unique, non-empty strings |

Platform doc (`tools/<category>/<tool>/docs/<platform>/README.md`):

| Key | Required | Rule |
|---|---|---|
| `name` | yes | Fixed by directory: `docker` → Docker, `docker-compose` → Docker Compose, `podman` → Podman, `kubernetes` → Kubernetes, `helm` → Helm; any other directory fails |
| `description` | yes | Plain text, 110–160 characters, unique across platform docs |
| `usecase` | yes | Short plain phrase, unique within the tool, matching its Use cases scenario name |
| `keywords` | no | Flow list of 2–6 unique, non-empty strings |

The root `README.md` has no frontmatter. Derive every value from the document's own
content; the `# Title` heading and body stay unchanged below the frontmatter:

- Write descriptions as one sentence without Markdown, stating what the image or recipe
  does. Avoid time-bound or unverifiable claims such as "every current agent".
- Pick keywords a reader would search for that the page does not already carry: skip
  the tool name, title, platform name, and generic terms such as `cli` or
  `docker image`.

## Cross-linking contract

Every document must be reachable from every other document of the same tool, with no
orphan pages:

- Catalog → every tool README; tool README → every platform doc through its Use cases;
  platform doc → its tool README through the "tool overview" link, and → every file in
  its directory through its Files section (`check-repo.py` enforces the latter).
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

When editing an image project, load `$container-images` for mechanics and apply this
skill for everything written down. Run `$maintain-agent-workspace` after the change.
