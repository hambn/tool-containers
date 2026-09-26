# Registries, tags, and labels

## Registries

Every image is published to both registries with identical tags:

| Registry | Path | Authentication |
|---|---|---|
| GHCR | `ghcr.io/hambn/<repo>` | job-scoped `GITHUB_TOKEN` |
| Docker Hub | `docker.io/hambn/<repo>` | `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` in the `dockerhub` environment |

`<repo>` is the tool name (`core`, `devbox`, `codex`, …). Build cache lives at
`ghcr.io/hambn/buildcache` and is never a published image. Add a registry only by
changing `.github/workflows/tool-image.yml`, CI authentication, documentation, and validation
together.

## Tags

Tags are chosen per tool: each tool workflow passes a `tags` script (Bash that prints
one variant's tags, one per line, from `VARIANT` and `VERSION`) to
`.github/workflows/tool-image.yml`, whose publish job applies them to every registry.
Tools may differ; the current rules are:

- **Base images (core, devbox):** the variant names, plus `latest` on the largest
  variant (core `ubuntu`, devbox `ubuntu-browser`).
- **Interactive images (agents, sandboxes, and other tools):** the variant names, plus
  `latest` on the lightest Ubuntu variant (`ubuntu`). Tools with a `version-arg` also
  tag that variant `<tool>-<version>` (for example `t3code-0.0.43`); agentbloat has no
  single upstream version and gets no version tag.

Every tag moves to the newest successful build, including version tags when the same
version is rebuilt on a new base or `OS_REFRESH`. Users pin a digest for
reproducibility. Examples and docs reference variant tags or `latest`.

### Deprecated tags

Tags from previous layouts (`agentimg:*`, `claude-code-v*`, `ocr-v*`, other
`<tool>-v<version>` release tags, `<variant>-<sha>` commit tags,
`<variant>-<YYYYMMDD>-<sha7>` dated tags, and `<version>-<variant>` / bare `<version>`
tags) are frozen: never
push, delete, or repoint them. Mention them only in a short deprecation note.

## Labels

- Each tool's `docker-bake.hcl` sets `org.opencontainers.image.{title,description,
  documentation}` and `io.github.hambn.containers.{tier,variant,distro}`.
- CI adds `org.opencontainers.image.{version,revision,created,source,url,licenses,
  vendor}` and, for a `ghcr.io/hambn` parent, `org.opencontainers.image.base.digest`.
- Dockerfiles set `io.github.hambn.containers.tool.<name>.version` for each pinned tool.

Labels are informational, with two exceptions in CI planning: the variant, distro, and
tier labels from the bake file, and `org.opencontainers.image.base.digest` on the
published image, which decides whether a scheduled or upstream-triggered run rebuilds a
variant. The source of truth is each tool's `Dockerfile` and `docker-bake.hcl`.

Helm charts stay local. If chart publication is ever enabled, use
`oci://ghcr.io/hambn/charts/<tool>` and update chart docs and automation together.
