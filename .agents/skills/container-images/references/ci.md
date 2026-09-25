# Image CI and automation

Inspect the live workflow before changing it; this guide states the contracts it must
keep.

| File | Role |
|---|---|
| `.github/workflows/images.yml` | Test and build: plan → bounded tool jobs → publish |
| `.github/workflows/pr.yml` | pull-request gate (metadata, dependency review, static validation) and `lint` job |
| `.github/workflows/maintenance.yml` | scheduled scan of published images; opens an `OS_REFRESH` PR on fixable findings |
| `.github/renovate.json5` | pin updates in `tools/versions.hcl` and GitHub Actions |
| `tools/trivyignore.yaml` | reviewed vulnerability exceptions |
| `.github/scripts/bake.sh` | `docker buildx bake` with both Bake files and the commit-derived variables |
| `.github/scripts/plan.py` | affected-target planner and job packing (`test_plan.py` covers it) |
| `.github/scripts/build-tools.sh` | build/test/scan/push the tools of one job on both architectures (`test_build_tools.py` covers it offline) |
| `.github/scripts/publish.sh` | multi-arch indexes, Docker Hub mirror, and signatures for every published target |

There are no per-tool workflows and no Dependabot configuration.

## images.yml

1. **Plan.** `plan.py` reads the rendered bake graph and the diff: changed tool
   directories, `tools/docker-bake.hcl`, and `tools/versions.hcl` pins. It selects
   affected members of group `all`, including descendants. There is no fixed
   dependency-depth limit or list of image names in the workflow. Unaffected targets
   are not rebuilt.
2. **Test and build.** The workflow is named `Test and build`. `plan.py` groups the
   affected variants by their `tools/<category>/<tool>` context and packs the tools into
   at most `MAX_JOBS` (16) jobs: one tool per job while they fit, otherwise contiguous
   runs of similar size in which a tool follows the tool it builds on. Each job is
   named after its tools, e.g. `ai/codex`, and covers both architectures on one
   `ubuntu-24.04` runner: amd64 natively and arm64 under QEMU (`docker/setup-qemu-action`
   with a digest-pinned `tonistiigi/binfmt`). The jobs plus plan and the pull request
   checks stay within the 20 concurrent jobs of a free plan however many tools exist.
   The workflow names no tool, so a new tool needs no workflow edit.
   - `build-tools.sh` handles one tool at a time and runs its architectures
     concurrently, each logging to a file that is printed when it finishes (and
     uploaded as an artifact if the job fails or times out). Per architecture it builds
     all of the tool's variants in one Bake call, so their shared stages build once,
     loads each variant, runs its [tests](testing.md), and, on amd64, scans it with
     Trivy. The gate skips the files that the tool and its bases list in
     `tests/trivy-skip-files.txt`. On main, once every variant passed on both
     architectures, it pushes them by digest. A failing tool stops only itself: the job
     continues with its next tool and fails at the end. Between tools it prunes the
     BuildKit cache only as far as needed to keep 10 GB free, so later tools reuse
     shared stages.
   - The arm64 binfmt registration needs `F` (usable inside containers) and `C`
     (setuid programs such as `sudo` keep their credentials); the workflow checks both.
     binfmt_misc is not namespaced, so a privileged container that runs
     `systemd-binfmt` unregisters the runner's handlers when it stops; the devbox
     systemd profile masks it.
   - Every build reads the registry cache that main writes after its tests pass
     (`CACHE_REF`, one tag per target and architecture). Pull requests write no cache.
   - Jobs share no images. A dependency changed in the same PR is built in every job
     that needs it, in parallel, so there are no dependency waves to wait on.
3. **Publish.** Only main publishes, in one job that runs once every build job has
   finished. `publish.sh` merges the per-arch digests of each target into a
   multi-platform index and applies tags: immutable tags only if absent, moving tags
   always ([tags](registries-and-tags.md)). GHCR is the digest source for Docker Hub.
   It signs each index with cosign, and one provenance attestation covers every
   published index. A target missing a digest for either architecture (its tool
   failed) is not published, and the run fails; the other targets still publish.

Bake variables CI sets: `GIT_SHA`, `BUILD_DATE`, `CREATED`, `SOURCE_DATE_EPOCH` (commit
time, for reproducibility; `bake.sh` derives these four from Git), `PLATFORM`, `ARCH`,
`CACHE_REF`, `CACHE_WRITE`, `TAG_SET`. Adding a tool needs no workflow edit: the planner
discovers group `all` and derives the tool name from its build context. Run
`python3 -B .github/scripts/test_plan.py` and
`python3 -B .github/scripts/test_build_tools.py` when changing this orchestration. The
latter uses fake executables and performs no builds, pulls, or network requests.

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
