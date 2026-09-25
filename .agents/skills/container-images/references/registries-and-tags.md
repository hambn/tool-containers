# Registries, tags, and labels

## Registries

Every image is published to both registries with identical tags:

| Registry | Path | Authentication |
|---|---|---|
| GHCR | `ghcr.io/hambn/<repo>` | job-scoped `GITHUB_TOKEN` |
| Docker Hub | `docker.io/hambn/<repo>` | `DOCKERHUB_USERNAME`/`DOCKERHUB_TOKEN` in the `dockerhub` environment |

`<repo>` is the tool name (`core`, `devbox`, `codex`, …). Build cache lives at
`ghcr.io/hambn/buildcache` and is never a published image. Add a registry only by
changing `docker-bake.hcl` namespaces, CI authentication, documentation, and validation
together.

## Tags

Tags are computed in `docker-bake.hcl` (`base_tags`, `agent_tags`); CI selects which set
to push with `TAG_SET` (`all`, `moving`, `immutable`).

| Kind | Base images (core, devbox, agentbloat) | Agent images |
|---|---|---|
| Immutable | `<variant>-<YYYYMMDD>-<sha7>` | `<toolversion>-<variant>`, plus bare `<toolversion>` on `ubuntu-browser` |
| Moving | `<variant>`, plus `latest` on the primary variant | `<variant>`, plus `latest` on `ubuntu-browser` |

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

`docker-bake.hcl` sets labels through `oci_labels`:

- OCI keys: `org.opencontainers.image.{title,description,source,url,documentation,
  licenses,vendor,version,revision,created,base.name}` (core adds `base.digest`).
- Repository keys: `io.github.hambn.containers.{tier,variant,distro}` and
  `io.github.hambn.containers.tool.<name>.version` for each pinned tool.

Labels are informational only. CI planning, tagging, and tests must not read them to
make decisions; the source of truth is `docker-bake.hcl` plus `versions.hcl`.

Helm charts stay local. If chart publication is ever enabled, use
`oci://ghcr.io/hambn/charts/<tool>` and update chart docs and automation together.
