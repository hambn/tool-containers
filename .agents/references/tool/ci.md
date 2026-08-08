# CI workflows

Each tool has one workflow at `.github/workflows/<category>-<tool>.yml`. Keep it
self-contained and follow the reference shape used by the current `ai/claude-code` and
`ai/t3code` workflows.

## Triggers

```yaml
on:
  push:
    branches: [main]
    paths:
      - "<category>/<tool>/**"
      - ".github/scripts/**"
      - ".github/workflows/<category>-<tool>.yml"
  schedule:
    - cron: "0 * * * *"     # current derived-tool cadence; detection only when unchanged
  workflow_dispatch:
```

Pushes should select changed variants; main-only manual dispatch builds all variants. A
scheduled derived-image run resolves the upstream version and base-image digests, then
builds only what changed. The foundation-image workflow uses a separate weekly refresh
cadence and rebuilds all variants so package-repository updates are not missed. Derived
tools also use `workflow_run` when they follow a foundation or agent image.

## Stages

1. **`plan`** resolves the upstream version, discovers image variants, resolves each
   final base image to a digest, and emits selected variants and metadata through
   `GITHUB_OUTPUT`.
2. **`build`** runs a matrix over selected variants, builds from that variant directory,
   passes digest-pinned base-image build arguments, pushes to GHCR by digest, adds
   version/base labels, and blocks on HIGH/CRITICAL Trivy findings. Current workflows
   target `linux/amd64`.
3. **`push`** downloads the digests and fans out tags to each registry without rebuilding.
   Each job logs in only to its target registry.

This plan → build-by-digest → push shape makes reruns deterministic and avoids one build
per registry.

## Rules

- Declare exactly one `PRIMARY` variant; only it owns `latest`.
- Never hardcode the upstream version in the workflow; resolve it in `plan` and pass it as
  a Docker build argument. Keep the tag names and release-tag conditions in the workflow
  synchronized with the registry/tag guide; CI hardening may further tighten these checks.
- Never push images from pull requests. Push only from the documented branch, schedule,
  or manual dispatch, and only when `plan` selects variants.
- Serialize publication per image with non-canceling concurrency, reject manual
  publication outside `main`, and fail closed when change or registry inspection cannot
  establish a safe result.
- Pin third-party actions to full commit SHAs with a readable release comment. Keep the
  GitHub Actions Dependabot configuration enabled so updates arrive as reviewable pull
  requests.
- Keep the PR-only repository-validation workflow static: validate YAML, embedded shell,
  Dockerfile contracts, executable bits, Markdown links, Compose rendering, and Helm
  lint/template without building, pulling, or running an image.
- Keep GHCR as the source digest for registry fan-out. See [registry and tag rules](../repo/registries-and-tags.md).
- Do not add arm64 through QEMU without proving the toolchain works; prefer a native arm
  runner and a manifest merge.
- Keep secrets in GitHub Actions secrets and use the narrowest permissions possible.

For a foundation image with no versioned upstream tool, omit upstream-version resolution
and apply the [foundation-image tag exception](../repo/registries-and-tags.md). Its weekly
schedule rebuilds every variant to incorporate both base-image and package-repository
updates.
