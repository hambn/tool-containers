# Image documentation

## Root catalog

The root `README.md` is the public catalog. It contains the title and repository
description, the repository-guidance pointer, and one subsection per category with a
table of tool links and one-line descriptions.

- List every tool exactly once using `images/<category>/<tool>/` links.
- Keep category order stable and show a catalog category with no implementation as
  `_None yet._`.
- Add or remove the catalog row in the same change as the project.
- Keep operational detail in the tool README.

## Tool README

Keep `images/<category>/<tool>/README.md` direct and operational. Keep these core
sections in this relative order; add a focused tool-specific section only when it
materially helps operation:

1. **Title and one-line description** identifying and linking the upstream tool.
2. **Contents** linking the remaining sections.
3. **Images** with one table of variants, functional contents, bases, and owned moving
   and immutable tags; state GHCR and Docker Hub pull paths and link to
   [registry and tag policy](registries-and-tags.md).
4. **Use cases** with three to five concrete scenarios linking the relevant deployment
   recipes.
5. **File map** as a linked nested map of every tracked file in the tool, plus its
   `.github/workflows/<category>-<tool>.yml` workflow.
6. **Sources** linking upstream repository, package registry, and authoritative docs
   where available.

For example, a concise “Included software” section may follow Images for a bundle whose
contents are part of its contract. Do not duplicate `docker run` instructions in the
tool README; runnable commands belong under `deployment/`. Do not add a generic build or
update section when CI is the sole supported build/update path.

Use relative GitHub-compatible links. Keep every present deployment platform reachable
from Use cases or the file map, and update the map whenever a file is added, moved, or
removed. Check the claimed inventory against:

```sh
git ls-files 'images/<category>/<tool>/**'
```
