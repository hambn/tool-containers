---
name: documentation
description: Write and review the repository's written documents - the root catalog README, every tools/<category>/<tool>/README.md, and every per-platform example README - including their required sections, cross-links, and quality bar. Use when adding, editing, or reviewing any README or document in this repository; do not use for Dockerfiles, CI workflows, or the web-ui application itself.
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
| Platform example README | `tools/<category>/<tool>/examples/<platform>/README.md` | Runnable recipes for one platform |

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

1. **Title and one-line description** identifying and linking the upstream tool.
2. **Contents** linking the remaining sections.
3. **Images** with one table of variants, functional contents, bases, and owned moving
   and immutable tags; state GHCR and Docker Hub pull paths.
4. **Use cases** with three to five concrete scenarios linking the relevant platform
   examples.
5. **File map** as a linked nested map of every tracked file in the tool, plus its
   `.github/workflows/<category>-<tool>.yml` workflow.
6. **Sources** linking upstream repository, package registry, and authoritative docs
   where available.

For example, a concise "Included software" section may follow Images for a bundle whose
contents are part of its contract. Do not duplicate `docker run` instructions in the
tool README; runnable commands belong under `examples/`. Do not add a generic build or
update section when CI is the sole supported build/update path.

## Platform example README

Each present platform README explains, in this order where applicable: prerequisites,
exact commands, required variables or secrets, workspace behavior, a file map, cleanup,
and limitations. Keep commands copy-pasteable and consistent with the Dockerfile and
tool README; technical conventions live in `$container-images`.

## Cross-linking contract

Every document must be reachable from every other document of the same tool, with no
orphan pages:

- Catalog → every tool README; tool README → every platform example README and back via
  its file map; platform example README → its tool README.
- Keep every present platform example reachable from the tool's Use cases or file map.
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
