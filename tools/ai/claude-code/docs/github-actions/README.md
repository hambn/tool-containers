---
name: GitHub Actions
description: Review each GitHub pull request with claude -p in the Claude Code image and write the result to the job summary, using an ANTHROPIC_API_KEY secret.
usecase: Code review in CI on GitHub pull requests
keywords: [pull request review, claude -p, anthropic api key]
---

# claude-code · GitHub Actions

[`workflow.yml`](./workflow.yml) reviews each pull request with Claude Code and writes the
review to the job summary. It pipes the diff into `claude -p` (print mode) with `--max-turns 10`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A repository with GitHub Actions enabled and a Linux runner with Docker, such as
  GitHub-hosted `ubuntu-24.04`.
- An `ANTHROPIC_API_KEY` [repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Commands

```bash
mkdir -p .github/workflows
cp workflow.yml .github/workflows/claude-code-review.yml
```

It runs on every pull request opened from a branch of the same repository.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Repository secret: Anthropic API key, passed to the review step only. |

## Workspace

The runner checks out the pull request merge commit and its first parent. The review
container mounts the checkout read-only at `/workspace` and runs as `sysadmin`
(UID 1000); it does not receive the job's GitHub token.

## Files

- [`workflow.yml`](./workflow.yml) — pull request review workflow

## Cleanup

The review container is started with `--rm`, and GitHub-hosted runners are discarded
after the job.

## Limitations

- Pull requests from forks are skipped, because GitHub does not pass secrets to workflows they trigger.
- The review is advisory: the job does not comment on the pull request or fail on findings. Read it in the job summary.
- The diff is untrusted model input. The step has a read-only mount and no GitHub token, which limits what a crafted change can make the agent do.
- `ubuntu` is a moving tag; pin a digest (`ghcr.io/hambn/claude-code@sha256:<digest>`) for repeatable reviews.
