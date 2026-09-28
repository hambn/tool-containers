---
name: GitLab CI
description: Run a GitLab CI job in the devbox full-tier image so its scripts can call Go, Node.js, Python, and Git with no install steps in the pipeline.
usecase: CI job with the full toolchain on GitLab
keywords: [pipeline, docker executor, toolchain]
---

# devbox · GitLab CI

[`gitlab-ci.yml`](./gitlab-ci.yml) defines a job that runs in [devbox](../../README.md)
on a GitLab Runner with the
[Docker executor](https://docs.gitlab.com/ci/docker/using_docker_images/).

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A GitLab project with a runner that uses the Docker executor, such as GitLab.com
  hosted Linux runners.

## Commands

Add the `devbox-check` job to your project's `.gitlab-ci.yml` and replace the check
commands with your own. It runs in every pipeline.

## Variables

None. Store secrets as masked
[CI/CD variables](https://docs.gitlab.com/ci/variables/) instead of in the file.

## Workspace

The runner clones the project into `$CI_PROJECT_DIR` and runs the script as the image
user, `sysadmin` (UID 1000). The clone belongs to a different user, so the first script
line marks it as a Git safe directory.

## Files

- [`gitlab-ci.yml`](./gitlab-ci.yml) — a job that runs in the devbox full tier

## Cleanup

The runner removes the job container when the job ends.

## Limitations

- The runner pulls the image for each job unless its pull policy reuses a cached copy.
- `ubuntu-full` is a moving tag; pin a digest (`ghcr.io/hambn/devbox@sha256:<digest>`)
  for repeatable jobs.
