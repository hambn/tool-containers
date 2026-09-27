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
5. **Use cases** with three to five concrete scenarios linking the relevant platform
   examples.
6. **Sources** linking upstream repository, package registry, and authoritative docs
   where available.

Do not add a file map; the Source link opens the directory. Do not duplicate `docker run` instructions in the
tool README; runnable commands belong under `docs/<platform>/`. Do not add a generic build or
update section when CI is the sole supported build/update path.

## Platform doc

Each present platform README explains, in this order where applicable: prerequisites,
exact commands, required variables or secrets, workspace behavior, files, cleanup, and
limitations. Keep commands copy-pasteable and consistent with the Dockerfile and tool
README; technical conventions live in `$container-images`.

Link each example file with a relative link such as `./run.sh` instead of embedding its
contents: the web-ui renders sibling example files inline, so embedded copies duplicate
and drift. Short command lines to type are fine. Example image references use moving
tags from `ghcr.io/hambn/<repo>`.

## Frontmatter contract

Every tool README and every platform doc starts with YAML frontmatter. The web UI reads
it for page titles, meta descriptions, catalog cards, and search, and
`.github/scripts/check-repo.py` enforces it. Use flat keys only, plain scalars or flow
lists, and quote any value that contains `:` or `#`.

```yaml
---
name: codex
description: OpenAI Codex CLI on the devbox development image, with Ubuntu and Alpine variants.
upstream: https://github.com/openai/codex
image: ghcr.io/hambn/codex
keywords: [codex, openai, coding agent, cli]
---
```

| Key | Tool README | Platform doc | Rule |
|---|---|---|---|
| `name` | required | required | Tool directory name; platform display name (Docker, Docker Compose, Podman, Kubernetes, Helm) |
| `description` | required | required | One plain-text sentence, 70–160 characters, no markdown, unique per file |
| `upstream` | required when an upstream exists | not used | `https://` URL of the upstream project; omit for images built only here |
| `image` | required | not used | Primary pull path without tag, e.g. `ghcr.io/hambn/<repo>` |
| `usecase` | not used | required | Short phrase naming what the recipe is for |
| `keywords` | recommended | recommended | Flow list of 3–8 real search terms |

No other keys are allowed. Derive every value from the document's own content; the
existing `# Title` heading and body stay unchanged below the frontmatter.

## Cross-linking contract

Every document must be reachable from every other document of the same tool, with no
orphan pages:

- Catalog → every tool README; tool README → every platform doc and back via
  its file map; platform doc → its tool README.
- Keep every present platform doc reachable from the tool's Use cases or file map.
- Update the file map in the same change that adds, moves, or removes any tracked file.
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
