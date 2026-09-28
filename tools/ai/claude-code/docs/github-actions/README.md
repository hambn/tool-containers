---
name: GitHub Actions
description: Review each GitHub pull request with claude -p in the Claude Code image and write the result to the job summary, using an ANTHROPIC_API_KEY secret.
usecase: Code review in CI on GitHub pull requests
keywords: [pull request review, claude -p, anthropic api key]
---

# Run Claude Code with GitHub Actions

[`workflow.yml`](./workflow.yml) reviews each pull request with [Claude Code](../../README.md) and writes the
review to the job summary. It pipes the diff into `claude -p` (print mode) with `--max-turns 10`.

## Prerequisites

- A repository with GitHub Actions enabled and a Linux runner with Docker, such as
  GitHub-hosted `ubuntu-24.04`.
- An `ANTHROPIC_API_KEY` [repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Set up

```bash
mkdir -p .github/workflows
cp workflow.yml .github/workflows/claude-code-review.yml
```

It runs on every pull request opened from a branch of the same repository.

The workflow runs `ghcr.io/hambn/claude-code:ubuntu`. Replace the tag with `@sha256:<digest>` to pin one build.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Repository secret: Anthropic API key, passed to the review step only. |

## Workspace

The runner checks out the pull request merge commit and its first parent. The review
container mounts the checkout read-only at `/workspace` and runs as `sysadmin`
(UID 1000); it does not receive the job's GitHub token.

## Files

- [`workflow.yml`](./workflow.yml): pull request review workflow.

## Limitations

- Pull requests from forks are skipped, because GitHub does not pass secrets to workflows they trigger.
- The review is advisory: the job does not comment on the pull request or fail on findings. Read it in the job summary.
- The diff is untrusted model input. The step has a read-only mount and no GitHub token, which limits what a crafted change can make the agent do.
