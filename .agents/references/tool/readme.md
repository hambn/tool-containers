# Tool README

Each `<category>/<tool>/README.md` should be direct and operational.

## Required sections, in order

1. **Title and one-line description** — identify the tool and link upstream.
2. **Contents** — a Markdown TOC for the sections below.
3. **Images** — one table covering variants, contents, bases, and owned moving/release
   tags; state the GHCR and Docker Hub pull paths and link to the registry/tag guide.
4. **Use cases** — three to five concrete scenarios, each linking a deployment recipe.
5. **File map** — a linked, nested map of the complete tool directory, including its CI
   workflow. Keep it synchronized with the actual tree.
6. **Sources** — upstream repository, package registry, and docs where available.

## Do not include

- A second `docker run` guide; runnable commands belong under `deployment/`.
- A separate build section; CI behavior belongs in the workflow guide.
- A per-tool update section; update behavior is repository/CI policy.

## Rules

- Keep the TOC first and sources last.
- Use relative links that work on GitHub and in a clone.
- Make every deployment platform reachable from Use cases or the File map.
- Update the file map whenever a file is added, moved, or removed.
