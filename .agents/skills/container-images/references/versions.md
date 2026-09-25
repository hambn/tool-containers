# Versions and pins

`tools/versions.hcl` holds every pinned input of every image as a bake `variable`: base image
references (`name:tag@sha256:…`), tool versions, git commits, and `OS_REFRESH`.
Dockerfiles and `tools/docker-bake.hcl` never contain a version literal. Always load both
files, from the repository root: `.github/scripts/bake.sh …` does.

## Renovate

Renovate (`.github/renovate.json5`) updates each value through the comment on the line above it:

```hcl
# renovate: datasource=npm depName=@openai/codex
variable "CODEX_VERSION" {
  default = "0.157.0"
}
```

Supported `datasource` values include `docker`, `npm`, `pypi`, `github-releases`,
`github-tags`, `gitlab-releases`, `git-refs`, `golang-version`, `node-version`, and
custom datasources defined in `.github/renovate.json5`. Use `extractVersion` to strip tag
prefixes such as `v`. A Renovate PR is an ordinary change: CI builds, tests, and scans the
affected images before merge.

## Adding a pin

1. Add a `variable "<NAME>_VERSION"` (or `<NAME>_IMAGE` with a digest) in the matching
   section of `tools/versions.hcl`, preceded by its `# renovate:` comment. Verify the datasource
   and `depName` resolve to the value you pinned.
2. Pass it as an arg in the consuming `tools/docker-bake.hcl` target (and, for tool versions, a
   `io.github.hambn.containers.tool.<name>.version` label).
3. Declare `ARG <NAME>_VERSION` in the Dockerfile stage that uses it.
4. If no built-in datasource fits, add a custom datasource or regex manager to
   `.github/renovate.json5` in the same change.

## Holding a pin

To hold a version back, add a one-line reason above the Renovate comment and a matching
Renovate rule (for example `allowedVersions`) so the hold is enforced, not just
documented. Remove both when the constraint is gone.

## OS_REFRESH

`OS_REFRESH` is a date string declared as `ARG` right before each OS-package `RUN`.
Bumping it reinstalls OS packages from the current repositories without touching any
other pin; there are no in-image upgrades. `maintenance.yml` opens a PR that bumps it
when Trivy finds fixable vulnerabilities in published images; bump it by hand for the
same reason.
