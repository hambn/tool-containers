# Image CI and automation

Inspect the live workflow before changing it; this guide states the contracts it must
keep.

| File | Role |
|---|---|
| `.github/workflows/images.yml` | Test and build: plan → per-tool jobs → publish |
| `.github/workflows/pr.yml` | pull-request gate (metadata, dependency review, static validation) and `lint` job |
| `.github/workflows/maintenance.yml` | scheduled scan of published images; opens an `OS_REFRESH` PR on fixable findings |
| `renovate.json5` | pin updates in `versions.hcl` and GitHub Actions |
| `.trivyignore.yaml` | reviewed vulnerability exceptions |
| `.github/scripts/plan.py` | affected-target planner and tool grouping (`test_plan.py` covers it) |
| `.github/scripts/build-tool.sh` | build/test/scan/push for one tool and architecture (`test_build_tool.py` covers it offline) |

There are no per-tool workflows and no Dependabot configuration.

## images.yml

1. **Plan.** `plan.py` reads the rendered bake graph and the diff: changed tool
   directories, `docker-bake.hcl`, and `versions.hcl` pins. It selects affected members
   of group `all`, including descendants. There is no fixed dependency-depth limit
   or list of image names in the workflow. Unaffected targets are not rebuilt.
2. **Test and build.** The workflow is named `Test and build`. `plan.py` groups the
   affected variants by their `tools/<category>/<tool>` context, and the matrix crosses
   those tools with the architectures: each job is named `<category>/<tool> (<arch>)`
   and runs on a native runner (`ubuntu-24.04` or `ubuntu-24.04-arm`). There is no
   emulation, and the workflow names no tool, so a new tool needs no workflow edit.
   `fail-fast: false` lets other jobs finish when one fails.
   - `build-tool.sh` builds all of the job's variants in one Bake call, so shared stages
     (core, devbox payloads) build once and in parallel. It then loads each variant,
     runs its [tests](testing.md), and, on amd64, scans it with Trivy. The gate skips the
     files that the tool and its bases list in `tests/trivy-skip-files.txt`. On main it
     then pushes every variant by digest. Any failure stops the job before the push.
   - All builds read the registry cache. PR builds also read and write a GitHub Actions
     cache scoped by target, architecture, and GitHub's ref isolation. They export it
     during the build, so a later test failure still leaves a usable cache. Only main
     writes registry caches and pushes digests.
   - Jobs share no images. A dependency changed in the same PR is built in every job
     that needs it, in parallel, so there are no dependency waves to wait on.
3. **Publish.** Only main publishes, after the entire build matrix succeeds. It merges
   per-arch digests into multi-platform manifests and applies tags: immutable tags
   only if absent, moving tags always ([tags](registries-and-tags.md)). GHCR is the
   digest source for Docker Hub.

Bake variables CI sets: `GIT_SHA`, `BUILD_DATE`, `CREATED`, `SOURCE_DATE_EPOCH` (commit
time, for reproducibility), `PLATFORM`, `ARCH`, `CACHE_REF`, `CACHE_WRITE`, `TAG_SET`.
Adding a tool needs no workflow edit: the planner discovers group `all` and derives
the tool name from its build context. Run `python3 -B .github/scripts/test_plan.py`
and `python3 -B .github/scripts/test_build_tool.py` when changing this orchestration.
The latter uses fake executables and performs no builds, pulls, or network requests.

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
