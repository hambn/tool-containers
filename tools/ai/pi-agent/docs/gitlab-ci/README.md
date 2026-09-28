---
name: GitLab CI
description: Review each GitLab merge request with Pi in print mode, limited to read-only tools, and print the result to the job log with a masked API key.
usecase: Code review in CI on GitLab merge requests
keywords: [merge request review, print mode, masked variable]
---

# pi-agent · GitLab CI

[`gitlab-ci.yml`](./gitlab-ci.yml) defines a job that reviews each merge request with
Pi on a GitLab Runner with the [Docker executor](https://docs.gitlab.com/ci/docker/using_docker_images/). It
pipes the diff into `pi --print --no-session`, limited to the `read`, `grep`, `find`, and `ls` tools.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A GitLab project with a runner that uses the Docker executor, such as GitLab.com
  hosted Linux runners.
- A masked `ANTHROPIC_API_KEY` [CI/CD variable](https://docs.gitlab.com/ci/variables/).

## Commands

Add the `pi-agent-review` job to your project's `.gitlab-ci.yml`. It runs only in merge
request pipelines.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Masked CI/CD variable: Anthropic API key. Pi also reads other providers' keys, such as `OPENAI_API_KEY`. |

## Workspace

The runner clones the full history (`GIT_DEPTH: "0"`) into `$CI_PROJECT_DIR` and runs
the script as the image user, `sysadmin` (UID 1000). The clone belongs to a different
user, so the first script line marks it as a Git safe directory. The job clears the
image's `pi` entrypoint because the runner passes a shell as the command. The
review covers `$CI_MERGE_REQUEST_DIFF_BASE_SHA` to `HEAD`.

## Files

- [`gitlab-ci.yml`](./gitlab-ci.yml) — merge request review job

## Cleanup

The runner removes the job container when the job ends.

## Limitations

- Merge request pipelines that run in a fork do not get the parent project's CI/CD variables, so the job stops at the variable check.
- The review is advisory: the job does not comment on the merge request or fail on findings. Read it in the job log.
- The diff is untrusted model input, and the job environment, including `CI_JOB_TOKEN`, is visible to any command the agent runs.
- Pi picks a default model for the provider whose key is set; add `--model <provider>/<id>` to choose one.
- `ubuntu` is a moving tag; pin a digest (`ghcr.io/hambn/pi-agent@sha256:<digest>`) for repeatable reviews.
