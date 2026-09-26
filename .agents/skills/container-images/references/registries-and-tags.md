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

Tags are applied by the `publish-ghcr` job of `.github/workflows/tool-image.yml` from the tool
workflow's `primary` and `version-arg` inputs. Tools with a `version-arg` (claude-code,
codex, open-code-review, pi-agent, omnigent, t3code) get version tags; core, devbox, and
agentbloat get dated tags.

| Kind | Without `version-arg` (core, devbox, agentbloat) | With `version-arg` |
|---|---|---|
| Immutable | `<variant>-<YYYYMMDD>-<sha7>` | `<version>-<variant>`, plus bare `<version>` on the primary variant |
| Moving | `<variant>`, plus `latest` on the primary variant | `<variant>`, plus `latest` on the primary variant |

Primary variants: core `wolfi`, devbox `ubuntu-full`, agents `ubuntu-browser`.

`YYYYMMDD` and `sha7` come from the built commit, not the build time.

- **Immutable tags are created only if absent.** Publishing checks the registry first and
  never repoints an existing immutable tag. A rebuild of the same tool version
  (new base digest, `OS_REFRESH`) therefore updates only moving tags for agents.
- **Moving tags always repoint** to the newest successful build.
- Examples and docs reference moving tags; users pin an immutable tag or digest for
  reproducibility.

### Deprecated tags

Tags from the previous layout (`agentimg:*`, `claude-code-v*`, `ocr-v*`, other
`<tool>-v<version>` release tags, and `<variant>-<sha>` commit tags) are frozen: never
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
