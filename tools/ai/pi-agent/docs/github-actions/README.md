---
name: GitHub Actions
description: Review each GitHub pull request with Pi in print mode and read-only tools, writing the result to the job summary, using an ANTHROPIC_API_KEY secret.
usecase: Code review in CI on GitHub pull requests
keywords: [pull request review, print mode, read-only tools]
---

# pi-agent · GitHub Actions

[`workflow.yml`](./workflow.yml) reviews each pull request with Pi and writes the
review to the job summary. It pipes the diff into `pi --print --no-session`, limited to the `read`, `grep`, `find`, and `ls` tools.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A repository with GitHub Actions enabled and a Linux runner with Docker, such as
  GitHub-hosted `ubuntu-24.04`.
- An `ANTHROPIC_API_KEY` [repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Commands

```bash
mkdir -p .github/workflows
cp workflow.yml .github/workflows/pi-agent-review.yml
```

It runs on every pull request opened from a branch of the same repository.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Repository secret: Anthropic API key, passed to the review step only. Pi also reads other providers' keys, such as `OPENAI_API_KEY`. |

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
- Pi picks a default model for the provider whose key is set; add `--model <provider>/<id>` to choose one.
- `ubuntu` is a moving tag; pin a digest (`ghcr.io/hambn/pi-agent@sha256:<digest>`) for repeatable reviews.
