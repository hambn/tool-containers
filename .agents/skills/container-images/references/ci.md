# Image CI and automation

Inspect the live workflow before changing it; this guide states the contracts it must
keep.

| File | Role |
|---|---|
| `.github/workflows/<category>-<tool>.yml` | one per tool (`base-core.yml`, `ai-codex.yml`, …): triggers and inputs only |
| `.github/workflows/tool-image.yml` | reusable pipeline: plan → build per variant and architecture → publish per registry |
| `.github/workflows/pr.yml` | pull-request gate (metadata, dependency review, static validation) and `lint` job |
| `.github/renovate.json5` | `ARG` pins in `tools/**/Dockerfile` and GitHub Actions |
| `tools/trivyignore.yaml` | reviewed vulnerability exceptions |

There is no Dependabot configuration.

## Per-tool workflows

Every tool workflow has the same shape; copy a sibling and change only the name, paths,
upstream workflow, cron minute, concurrency group, and `with:` inputs:

- `tool`: the tool directory; its name is the image repository.
- `tags`: Bash printing one variant's tags from `VARIANT` and `VERSION`; each tool owns
  its rules ([tags](registries-and-tags.md)).
- `version-arg`: the Dockerfile `ARG` holding the upstream version, for tools that have
  one; it becomes `VERSION` and the image version label.

Triggers: `pull_request` and `push` to main on the tool directory,
`tools/trivyignore.yaml`, its own workflow, and `tool-image.yml`; a daily `schedule`; and
`workflow_dispatch` with an `outdated-only` input. A parent's run dispatches its
`dependents` with `outdated-only` after publishing (devbox after core, agents after
devbox, omnigent and t3code after agentbloat). `workflow_run` is not used; zizmor
rejects it.
`check-repo.py` requires a matching workflow that calls `tool-image.yml` for every tool.

## tool-image.yml

1. **Plan.** Reads the tool's `docker-bake.hcl` (`docker buildx bake --print`) and the
   version from the `version-arg`, or the commit date and SHA. A `BASE_IMAGE` under
   `ghcr.io/hambn` is pinned to its current digest. Pull requests, pushes, and manual
   runs build every variant; `schedule` and `outdated-only` dispatches build only variants
   whose published image carries an older `org.opencontainers.image.base.digest` (or is
   not published yet), and rescan the rest, rebuilding any with fixable HIGH/CRITICAL OS-package vulnerabilities, passing
   `OS_REFRESH=<today>` as a build arg so the OS layers reinstall; no refresh pull
   request is opened. When a parent is not yet published for both amd64 and arm64,
   each build job builds the missing chain from source (exported as OCI layouts and
   passed as the named context `parent`); outdated-only runs wait for the parent's
   workflow instead.
2. **Build.** One job per variant and architecture on native runners (`ubuntu-24.04`
   for amd64, `ubuntu-24.04-arm` for arm64); `fail-fast` is off. Each job bakes the
   variant with the pinned parent, repository labels, and the registry cache
   `ghcr.io/hambn/buildcache:<image>-<variant>-<arch>`, then runs the
   [tests](testing.md) and Trivy. The full Trivy report goes to code scanning as SARIF;
   the gate fails only on fixable HIGH/CRITICAL OS-package vulnerabilities and on
   secrets outside vendored directories (`/usr/local/lib/node_modules`,
   `/usr/local/go`, `/opt`). Vulnerabilities in upstream binaries are fixed by upstream
   releases through Renovate. On main it then pushes by digest with SBOM and
   provenance, and writes the cache; pull requests write no cache, and fork pull
   requests cannot log in to GHCR.
3. **Publish.** Main only, a matrix with one job per registry (GHCR, Docker Hub),
   each covering every variant that passed on both architectures even if another
   variant failed. Each job creates the multi-arch indexes from the per-arch GHCR
   digests, applies the tool's tags, and
   signs with cosign. The GHCR job prunes untagged versions
   (`.github/scripts/ghcr-cleanup.py`); the Docker Hub job syncs the README
   (`.github/scripts/hub-readme.py`; the token needs Read, Write, Delete scope). Add
   a registry by adding a matrix entry.

## pr.yml

The single `Pull request gate` covers PR metadata policy, dependency review, and the
static repository validator (`.github/scripts/check-repo.py`). The `lint` job runs tools
that cannot be verified by the static validator locally (for example hadolint,
shellcheck, actionlint) and is the authority for their findings.

## Security and reliability

- Pin every third-party action to a full commit SHA with a version comment; Renovate
  updates them.
- Deny token permissions at workflow scope and grant each job only what it needs.
  Registry-push jobs bind to the registry-named environment; never echo credentials or
  pass them as build args.
- Use non-canceling concurrency for publishing, finite job timeouts, an explicit runner
  image, and `persist-credentials: false` on checkout.
- Fail closed: a planning failure stops publication, and a build, test, scan, or
  tag-safety failure stops publication of the affected targets.
- Add an exception to `tools/trivyignore.yaml` only with a reason and expiry; prefer bumping a
  pin or `OS_REFRESH`.
