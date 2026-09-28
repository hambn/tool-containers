---
name: GitHub Actions
description: Run ocr review on each GitHub pull request in the Open Code Review image with the anthropic provider, printing its findings to the job log.
usecase: Code review in CI on GitHub pull requests
keywords: [pull request review, ocr review, llm provider]
---

# open-code-review · GitHub Actions

[`workflow.yml`](./workflow.yml) reviews each pull request with Open Code Review and writes the
review to the job log. It saves the `anthropic` provider and the `OCR_MODEL` model with `ocr config set`, then runs `ocr review --from <base> --to HEAD`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A repository with GitHub Actions enabled and a Linux runner with Docker, such as
  GitHub-hosted `ubuntu-24.04`.
- An `ANTHROPIC_API_KEY` [repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
- An `OCR_MODEL` [repository variable](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables).

## Commands

```bash
mkdir -p .github/workflows
cp workflow.yml .github/workflows/open-code-review.yml
```

It runs on every pull request opened from a branch of the same repository.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Repository secret: Anthropic API key. With the `anthropic` provider and no saved key, `ocr` reads this variable. |
| `OCR_MODEL` | yes | Repository variable: model name for the `anthropic` provider, for example `claude-opus-4-6`; not a secret. |

## Workspace

The runner checks out the pull request merge commit and its first parent. The review
container mounts the checkout read-only at `/workspace` and runs as `sysadmin`
(UID 1000); it does not receive the job's GitHub token. Because the checkout belongs to the runner user, the step passes `GIT_CONFIG_*` variables that mark `/workspace` as a Git safe directory.

## Files

- [`workflow.yml`](./workflow.yml) — pull request review workflow

## Cleanup

The review container is started with `--rm`, and GitHub-hosted runners are discarded
after the job.

## Limitations

- Pull requests from forks are skipped, because GitHub does not pass secrets to workflows they trigger.
- The review is advisory: the job does not comment on the pull request or fail on findings. Read it in the job log.
- The diff is untrusted model input. The step has a read-only mount and no GitHub token, which limits what a crafted change can make the agent do.
- `ocr review` exits 0 even when it reports findings. The upstream [CI guide](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/integrations/ci.md) shows how to post findings as review comments.
- `ubuntu` is a moving tag; pin a digest (`ghcr.io/hambn/open-code-review@sha256:<digest>`) for repeatable reviews.
