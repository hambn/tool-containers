---
name: GitLab CI
description: Review each GitLab merge request with claude -p in the Claude Code image and print the result to the job log, using a masked ANTHROPIC_API_KEY variable.
usecase: Code review in CI on GitLab merge requests
keywords: [merge request review, claude -p, masked variable]
---

# claude-code · GitLab CI

[`gitlab-ci.yml`](./gitlab-ci.yml) defines a job that reviews each merge request with
Claude Code on a GitLab Runner with the [Docker executor](https://docs.gitlab.com/ci/docker/using_docker_images/). It
pipes the diff into `claude -p` (print mode) with `--max-turns 10`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A GitLab project with a runner that uses the Docker executor, such as GitLab.com
  hosted Linux runners.
- A masked `ANTHROPIC_API_KEY` [CI/CD variable](https://docs.gitlab.com/ci/variables/).

## Commands

Add the `claude-code-review` job to your project's `.gitlab-ci.yml`. It runs only in merge
request pipelines.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Masked CI/CD variable: Anthropic API key. |

## Workspace

The runner clones the full history (`GIT_DEPTH: "0"`) into `$CI_PROJECT_DIR` and runs
the script as the image user, `sysadmin` (UID 1000). The clone belongs to a different
user, so the first script line marks it as a Git safe directory. The job clears the
image's `claude` entrypoint because the runner passes a shell as the command. The
review covers `$CI_MERGE_REQUEST_DIFF_BASE_SHA` to `HEAD`.

## Files

- [`gitlab-ci.yml`](./gitlab-ci.yml) — merge request review job

## Cleanup

The runner removes the job container when the job ends.

## Limitations

- Merge request pipelines that run in a fork do not get the parent project's CI/CD variables, so the job stops at the variable check.
- The review is advisory: the job does not comment on the merge request or fail on findings. Read it in the job log.
- The diff is untrusted model input, and the job environment, including `CI_JOB_TOKEN`, is visible to any command the agent runs.
- `ubuntu` is a moving tag; pin a digest (`ghcr.io/hambn/claude-code@sha256:<digest>`) for repeatable reviews.
