---
name: GitLab CI
description: Run ocr review on each GitLab merge request against its diff base, using the anthropic provider and a masked API key, with findings in the job log.
usecase: Code review in CI on GitLab merge requests
keywords: [merge request review, ocr review, masked variable]
---

# Run Open Code Review with GitLab CI

[`gitlab-ci.yml`](./gitlab-ci.yml) defines a job that reviews each merge request with
[Open Code Review](../../README.md) on a GitLab Runner with the [Docker executor](https://docs.gitlab.com/ci/docker/using_docker_images/). It
saves the `anthropic` provider and the `OCR_MODEL` model with `ocr config set`, then runs `ocr review --from <base> --to HEAD`.

## Prerequisites

- A GitLab project with a runner that uses the Docker executor, such as GitLab.com
  hosted Linux runners.
- A masked `ANTHROPIC_API_KEY` [CI/CD variable](https://docs.gitlab.com/ci/variables/) and an unmasked `OCR_MODEL` variable.

## Set up

Add the `open-code-review` job to your project's `.gitlab-ci.yml`. It runs only in merge
request pipelines.

The job runs `ghcr.io/hambn/open-code-review:ubuntu`. Replace the tag with `@sha256:<digest>` to pin one build.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Masked CI/CD variable: Anthropic API key. With the `anthropic` provider and no saved key, `ocr` reads this variable. |
| `OCR_MODEL` | yes | CI/CD variable: model name for the `anthropic` provider, for example `claude-opus-4-6`; not a secret. |

## Workspace

The runner clones the full history (`GIT_DEPTH: "0"`) into `$CI_PROJECT_DIR` and runs
the script as the image user, `sysadmin` (UID 1000). The clone belongs to a different
user, so the first script line marks it as a Git safe directory. The job clears the
image's `ocr` entrypoint because the runner passes a shell as the command. The
review covers `$CI_MERGE_REQUEST_DIFF_BASE_SHA` to `HEAD`.

## Files

- [`gitlab-ci.yml`](./gitlab-ci.yml): merge request review job.

## Limitations

- Merge request pipelines that run in a fork do not get the parent project's CI/CD variables, so the job stops at the variable check.
- The review is advisory: the job does not comment on the merge request or fail on findings. Read it in the job log.
- The diff is untrusted model input, and the job environment, including `CI_JOB_TOKEN`, is visible to any command the agent runs.
- `ocr review` exits 0 even when it reports findings. The upstream [CI guide](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/integrations/ci.md) shows how to post findings as review comments.
