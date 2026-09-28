---
name: GitLab CI
description: Review each GitLab merge request with claude -p in the Claude Code image and print the result to the job log, using a masked ANTHROPIC_API_KEY variable.
usecase: Code review in CI on GitLab merge requests
keywords: [merge request review, claude -p, masked variable]
---

# Run Claude Code with GitLab CI

[`gitlab-ci.yml`](./gitlab-ci.yml) defines a job that reviews each merge request with
[Claude Code](../../README.md) on a GitLab Runner with the [Docker executor](https://docs.gitlab.com/ci/docker/using_docker_images/). It
pipes the diff into `claude -p` (print mode) with `--max-turns 10`.

## Prerequisites

- A GitLab project with a runner that uses the Docker executor, such as GitLab.com
  hosted Linux runners.
- A masked `ANTHROPIC_API_KEY` [CI/CD variable](https://docs.gitlab.com/ci/variables/).

## Set up

Add the `claude-code-review` job to your project's `.gitlab-ci.yml`. It runs only in merge
request pipelines.

The job runs `ghcr.io/hambn/claude-code:ubuntu`. Replace the tag with `@sha256:<digest>` to pin one build.

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

- [`gitlab-ci.yml`](./gitlab-ci.yml): merge request review job.

## Limitations

- Merge request pipelines that run in a fork do not get the parent project's CI/CD variables, so the job stops at the variable check.
- The review is advisory: the job does not comment on the merge request or fail on findings. Read it in the job log.
- The diff is untrusted model input, and the job environment, including `CI_JOB_TOKEN`, is visible to any command the agent runs.
