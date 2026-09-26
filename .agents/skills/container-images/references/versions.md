# Versions and pins

Each tool's `Dockerfile` holds its pinned inputs as global `ARG` defaults: base image
references (`name:tag@sha256:…`), tool versions, git commits, and `OS_REFRESH`. There is
no shared versions file. Every default except `DISTRO`, `BASE_IMAGE`, and `OS_REFRESH`
has a `# renovate:` comment on the line above; `check-repo.py` enforces it.
`BASE_IMAGE` names the published parent (`ghcr.io/hambn/<parent>:<variant>`); CI pins it
to its current digest, so it carries no version.

## Renovate

Renovate (`.github/renovate.json5`) updates each value through regex managers on
`tools/**/Dockerfile`:

```dockerfile
# renovate: datasource=npm depName=@openai/codex
ARG CODEX_VERSION=0.157.0
```

Supported `datasource` values include `docker`, `npm`, `pypi`, `github-releases`,
`github-tags`, `gitlab-releases`, `git-refs`, `golang-version`, `node-version`, and
custom datasources defined in `.github/renovate.json5`. Use `extractVersion` to strip tag
prefixes such as `v`. Agent CLI minor and patch updates automerge after two days of
release age, and the weekly base/toolchain group after three days, only once every
branch check passes (`platformAutomerge` is off). Majors are merged by hand. A Renovate
PR is an ordinary change: the tool's workflow builds, tests, and scans it before merge.

## Adding a pin

1. Add a global `ARG <NAME>_VERSION=<value>` (or `<NAME>_IMAGE=<ref>@sha256:…`) near the
   top of the tool's `Dockerfile`, preceded by its `# renovate:` comment. Verify the
   datasource and `depName` resolve to the value you pinned.
2. Redeclare `ARG <NAME>_VERSION` in the stage that uses it and, for tool versions, set
   an `io.github.hambn.containers.tool.<name>.version` label.
3. If no built-in datasource fits, add a custom datasource or regex manager to
   `.github/renovate.json5` in the same change.

## Holding a pin

To hold a version back, add a one-line reason above the Renovate comment and a matching
Renovate rule (for example `allowedVersions`) so the hold is enforced, not just
documented. Remove both when the constraint is gone.

## OS_REFRESH

`OS_REFRESH` is a date string declared as a global `ARG` in every Dockerfile that
installs OS packages and redeclared right before each OS-package `RUN`. Changing it
reinstalls OS packages from the current repositories without touching any other pin;
there are no in-image upgrades. The daily scheduled run of each tool workflow rescans
the published variants and rebuilds those with fixable HIGH/CRITICAL OS vulnerabilities
with `OS_REFRESH=<today>` as a build arg, so the committed default changes only when
bumped by hand ([CI](ci.md)).
