# Image CI and automation

Inspect the live workflow before changing it; this guide states the contracts it must
keep.

| File | Role |
|---|---|
| `.github/workflows/images.yml` | plan → build waves → publish for every image |
| `.github/workflows/image-build.yml` | reusable build/test/scan of one wave |
| `.github/workflows/pr.yml` | pull-request gate (metadata, dependency review, static validation) and `lint` job |
| `.github/workflows/maintenance.yml` | scheduled scan of published images; opens an `OS_REFRESH` PR on fixable findings |
| `renovate.json5` | pin updates in `versions.hcl` and GitHub Actions |
| `.trivyignore.yaml` | reviewed vulnerability exceptions |
| `.github/scripts/plan.py` | affected-target and wave planner (`test_plan.py` covers it) |

There are no per-tool workflows and no Dependabot configuration.

## images.yml

1. **Plan.** `plan.py` reads the rendered bake graph and the diff (changed tool
   directories, `docker-bake.hcl`, `versions.hcl` pins) and emits the affected published
   targets, expanded to their descendants, ordered into waves (core → devbox →
   agentbloat → agents). Unaffected targets are not rebuilt.
2. **Build waves.** Each wave builds its targets natively per architecture
   (`PLATFORM`/`ARCH`), with registry cache (`CACHE_REF`, written only on `main`), runs
   the [tests](testing.md), blocks on HIGH/CRITICAL Trivy findings not excepted in
   `.trivyignore.yaml`, and pushes by digest. Later waves consume earlier waves through
   bake `target:` contexts, never through registry tags.
3. **Publish.** Merges per-arch digests into multi-platform manifests and applies tags:
   immutable tags only if absent, moving tags always ([tags](registries-and-tags.md)).
   Only `main` publishes. GHCR is the digest source for Docker Hub.

Bake variables CI sets: `GIT_SHA`, `BUILD_DATE`, `CREATED`, `SOURCE_DATE_EPOCH` (commit
time, for reproducibility), `PLATFORM`, `ARCH`, `CACHE_REF`, `CACHE_WRITE`, `TAG_SET`.
Adding a tool normally needs no workflow edit: the planner discovers group `all`.

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
- Fail closed: a planning, build, test, scan, or tag-safety failure stops publication.
- Add an exception to `.trivyignore.yaml` only with a reason and expiry; prefer bumping a
  pin or `OS_REFRESH`.
