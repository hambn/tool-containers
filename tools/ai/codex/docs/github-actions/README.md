---
name: GitHub Actions
description: Review each GitHub pull request with codex exec in the Codex image and write the result to the job summary, using a CODEX_API_KEY repository secret.
usecase: Code review in CI on GitHub pull requests
keywords: [pull request review, codex exec, openai api key]
---

# codex · GitHub Actions

[`workflow.yml`](./workflow.yml) reviews each pull request with Codex and writes the
review to the job summary. It pipes the diff into `codex exec`, which treats piped input as context for the prompt.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A repository with GitHub Actions enabled and a Linux runner with Docker, such as
  GitHub-hosted `ubuntu-24.04`.
- A `CODEX_API_KEY` [repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

## Commands

```bash
mkdir -p .github/workflows
cp workflow.yml .github/workflows/codex-review.yml
```

It runs on every pull request opened from a branch of the same repository.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `CODEX_API_KEY` | yes | Repository secret: OpenAI API key, passed to the review step only. `codex exec` reads this variable, not `OPENAI_API_KEY`. |

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
- The review is advisory: the job does not comment on the pull request or fail on findings. Read it in the job summary.
- The diff is untrusted model input. The step has a read-only mount and no GitHub token, which limits what a crafted change can make the agent do.
- Codex runs with `--sandbox danger-full-access` because its own sandbox may not work inside a container, as the [Codex security docs](https://developers.openai.com/codex/agent-approvals-security) describe. The container is the only isolation: it can reach the network, and a crafted change can make Codex read `CODEX_API_KEY`.
- `ubuntu` is a moving tag; pin a digest (`ghcr.io/hambn/codex@sha256:<digest>`) for repeatable reviews.
