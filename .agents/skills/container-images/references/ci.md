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
| `.github/scripts/build-tool.sh` | build/test/scan/export loop for each tool (`test_build_tool.py` covers it offline) |

There are no per-tool workflows and no Dependabot configuration.

## images.yml

1. **Plan.** `plan.py` reads the rendered bake graph and the diff: changed tool
   directories, `docker-bake.hcl`, and `versions.hcl` pins. It selects affected members
   of group `all`, including descendants. There is no fixed dependency-depth limit
   or list of image names in the workflow. Unaffected targets are not rebuilt.
2. **Test and build.** The workflow is named `Test and build`. A single matrix groups
   affected variants by their `tools/<category>/<tool>` context; each job is named
   `<category>/<tool>`. Every selected variant runs on amd64 and arm64 within that
   job, using an amd64 runner with QEMU/binfmt for arm64. No architecture subjobs or
   per-tool workflow entries are needed. `fail-fast: false` lets other tools finish
   when one fails.
   - `build-tool.sh` builds, loads, and [tests](testing.md) each target/architecture,
     scans amd64 images with Trivy, and exports verified digests only on main. It
     stops that tool's job on failure. Each loaded image is removed after use; the
     shared BuildKit cache stays available for the next variant.
   - All builds read the existing registry cache. PR builds also read and write a
     GitHub Actions cache scoped by target, architecture, and GitHub's ref isolation.
     They export it during the build, so a later test failure still leaves a usable
     cache. Cache export is best-effort with a five-minute limit.
   - PR cache entries never enter the main publishing path. Only main writes registry
     caches and pushes image digests, after tests and the scan pass. Digest artifacts
     are grouped by tool; publication downloads them and reads the selected target's
     amd64 and arm64 digest files.
   - Bake resolves `target:` contexts within the shared builder. Cold builds still
     build dependencies; arm64 emulation can be slower than a native ARM runner.
   - ARM binfmt registration must include `F` for container execution and `C` to
     preserve guest executable credentials. Without `C`, setuid programs such as
     `sudo` fail under emulation even when the same image passes on native ARM.
   - QEMU, test tooling, and Trivy install before building. Each build/load has a
     45-minute limit; structure and smoke tests each have a five-minute limit. The
     whole tool job has a 180-minute limit to cover all selected variants/platforms.
3. **Publish.** Only main publishes, after the entire build matrix succeeds. It merges
   per-arch digests into multi-platform manifests and applies tags: immutable tags
   only if absent, moving tags always ([tags](registries-and-tags.md)). GHCR is the
   digest source for Docker Hub. The second Bake invocation in each build job exports
   the locally cached result with provenance and SBOM after validation; it does not
   start a fresh builder.

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
