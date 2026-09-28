---
name: GitHub Actions
description: Run a GitHub Actions job inside the devbox full tier, so builds and tests use its Go, Node.js, and Python toolchains without setup steps.
usecase: CI job with the full toolchain on GitHub
keywords: [job container, workflow, toolchain]
---

# Run devbox with GitHub Actions

[`workflow.yml`](./workflow.yml) runs a job inside [devbox](../../README.md) as a
[job container](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/run-jobs-in-a-container),
so every `run` step has the full tier's toolchains.

## Prerequisites

- A repository with GitHub Actions enabled and a Linux runner with Docker, such as
  GitHub-hosted `ubuntu-24.04`.

## Set up

Copy the workflow into your repository and replace the `Check` step with your own
commands:

```bash
mkdir -p .github/workflows
cp workflow.yml .github/workflows/devbox.yml
```

It runs on pull requests and on pushes to `main`.

The workflow runs `ghcr.io/hambn/devbox:ubuntu-full`. Replace the tag with `@sha256:<digest>` to pin one build.

## Variables

None. Add secrets to individual steps with `env:` and `${{ secrets.<NAME> }}`, not to the
whole job.

## Workspace

The runner mounts the checkout at `/__w/<repo>/<repo>` and sets `HOME=/github/home`.
The job runs as root (`options: --user root`) because the runner's files belong to its
own user (UID 1001) and
[actions/checkout does not support](https://github.com/actions/checkout/issues/956) a
non-root container user.

## Files

- [`workflow.yml`](./workflow.yml): pull request and `main` push workflow with a devbox
  job container.

## Limitations

- Each job pulls the image on a fresh runner, which adds time before the first step.
- JavaScript actions run inside the job container; on Alpine variants they work only on
  x64 runners.
