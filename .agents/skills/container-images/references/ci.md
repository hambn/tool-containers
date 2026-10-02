# Image CI and automation

Inspect the workflow and its Python scripts before editing. Keep the plan → native
build matrix → registry publish matrix → dependent dispatch graph.

| File | Role |
|---|---|
| `.github/workflows/<category>-<tool>.yml` | tool triggers and reusable-workflow inputs |
| `.github/workflows/tool-image.yml` | job graph, actions, permissions, environments and matrices |
| `.github/scripts/plan.py` | parent resolution, variant selection and matrix outputs |
| `.github/scripts/build.py` | parent builds, saved build options, tests, secret scans and digest exports |
| `.github/scripts/publish.py` | architecture-pair validation, tags and cosign signing |
| `.github/scripts/dependents.py` | outdated-only dispatches after publication |
| `.github/scripts/image_common.py` | image references, bake targets and layer/cache policy |
| `.github/scripts/ci.py` | subprocesses, verified downloads and Actions file commands |
| `.github/workflows/pr.yml` | repository gate and lint jobs |
| `.github/scripts/lint.py` | verified lint tools and Python/shell/workflow checks |
| `.github/renovate.json5` | tool pins, builder pins and Actions updates |
| `tools/trivyignore.yaml` | reviewed Trivy exceptions for the daily rescan and secret scan |

## Per-tool workflows

Copy a sibling and change its name, paths, cron minute, concurrency group and inputs:

- `tool`: the tool directory; its name is the image repository.
- `latest-variant`: the variant that owns `latest`.
- `version-prefix`: when present, that variant also gets `<prefix>-<version>`.
- `version-arg`: the Dockerfile `ARG` supplying the version label and version tag.
- `dependents`: workflow filenames dispatched after publication.

The tag rules remain owned by each caller ([tags](registries-and-tags.md)). Do not
pass executable Bash as a reusable-workflow input.

Triggers cover the tool directory, `tools/trivyignore.yaml`, its workflow,
`tool-image.yml` and the image job scripts on pull requests and pushes to main. The
job scripts are those `tool-image.yml` runs plus the local modules they import;
`check-repo.py` requires exactly that list, so repository checks and tests never
rebuild images. Keep the daily schedule and `workflow_dispatch` with `outdated-only`. A parent's run
requests outdated-only builds after publishing. Do not use `workflow_run`.

## Plan

Read bake targets with `docker buildx bake --print`. Pin published repository parents
at one multi-arch digest for the entire matrix. Inspect both amd64 and arm64 configs
when deciding whether a child follows that parent. An authentication, rate-limit or
network error must fail planning rather than become an unpublished-parent fallback.

Pull requests, pushes and ordinary manual runs build all variants. Scheduled and
outdated-only runs select unpublished variants, moved parents, or fixable
HIGH/CRITICAL OS vulnerabilities on either architecture. Retain the latest recorded
`OS_REFRESH` date, and advance it to today for a vulnerability refresh. A later parent
or source update must not restore an older package layer.

If a repository parent is not published for both architectures, ordinary runs build
its source chain oldest first through OCI named contexts. Pin its first published
ancestor. Outdated-only runs wait for the parent's workflow. Reject parent cycles and
ambiguous source/target matches.

## Build and layer reuse

Build one variant and architecture per native runner (`ubuntu-24.04` or
`ubuntu-24.04-arm`), with `fail-fast: false`. The workflow pins Buildx by version and
BuildKit by image digest; Renovate updates them through the CI pin managers.

Keep these settings together in `image_common.py` and `build.py`:

- Retain the fixed `SOURCE_DATE_EPOCH` used by published images. Pass it explicitly to
  every target, including source parents. Changing it rewrites tar headers in otherwise
  unchanged layers and can force users to download them again.
- Export layers with `rewrite-timestamp=true`, gzip and `force-compression=false`.
  Reuse existing compressed blobs instead of recompressing inherited layers.
- Read the primary cache `ghcr.io/hambn/buildcache:<image>-<variant>-<arch>`, plus the
  same tool's same-distro sibling caches for shared download/npm stages. Keep writes
  isolated to the primary variant/architecture tag.
- Save the resolved build options once. The tested Docker export and the attested
  registry export must use those same inputs; changing the revision/created labels
  must not change the timestamp argument.
- Export `mode=max` registry cache only after structure, smoke and secret checks pass,
  and only on main outside pull requests. A failed cache export fails the build rather
  than silently losing the next run's cache. Source-parent fallback builds import
  cache but do not publish untested parents or overwrite their caches.
- Compare the exported runtime layer diff IDs with the tested image before writing a
  digest artifact. A mismatch cannot be published by the next job.

Keep Dockerfile layers independent as described in [Dockerfiles](images/dockerfile.md).
Scripts cannot make an unpinned npm dependency tree or mutable package repository
reproducible after a cold build.

The [structure and smoke tests](testing.md) run against the loaded image, followed by
the [secret scan](testing.md#secret-scan). Builds do not scan for vulnerabilities or
upload code-scanning reports; the scheduled rescan above refreshes OS packages and
Renovate updates upstream binaries. Fork pull requests do not log in to GHCR; no pull
request writes image or cache data.

## Publish and maintenance

One matrix entry per registry, GHCR and Docker Hub, joins the per-arch GHCR digests,
applies the caller's tags, and signs the result. Publish complete architecture pairs
even if another variant failed; report skipped/failed variants and fail that registry
job after processing the rest. Digest artifacts and tag names must be validated.

Publication operations capture their errors and retry HTTP 429 abuse throttling with
bounded exponential backoff and jitter. Keep create, inspect, and sign retries separate;
authentication, validation, and six-hour pull-quota errors do not use short retries.

Run publication on main even when planning selects no builds. The Docker Hub matrix
entry recovers unselected variants from signed GHCR releases, preserving the exact
multi-arch index, attestations, and the release's recorded version tags. Verify the GHCR
signature against this repository's main-branch workflow identity before copying or
signing. Compare all destination tags and verify the destination signature; skip current,
signed releases and repair missing signatures without copying layers again. A selected
variant with missing build artifacts must fail, never fall back to an older release.
Recovery-only runs need no digest artifacts, README API updates, cleanup, or dependent
dispatches. Registry/authentication errors must fail recovery rather than imply a
missing release or signature.

The GHCR job runs `ghcr_cleanup.py`, which preserves tagged and recent indexes and
their children, and OCI subject manifests. It resolves cosign fallback tags against
their subjects. Finish all registry reads before deleting anything, and stop on
errors. Docker Hub uses `hub_readme.py` to strip frontmatter and resolve links, then
syncs the description with a token that has Read, Write and Delete scope.

## Validation and security

`check-repo.py` is the CLI for `repository_check.py`; document rules are in
`document_rules.py`. The repository gate discovers every `test_*.py` in
`.github/scripts/`, including job, cache and cleanup regressions. Python lint and
format checks use `.github/ruff.toml` and the Ruff pin in
`.github/requirements-lint.txt`; PyYAML remains in `.github/requirements.txt`.

Pin third-party actions to full SHAs with version comments. Deny permissions at
workflow scope and grant only each job's needs. Keep publication in its registry
secret environment, non-canceling main concurrency and finite job timeouts. Do not
print credentials or pass them as build args. Static validation does not prove image
runtime behavior; the per-tool workflows build, test and secret-scan every variant on PRs.
