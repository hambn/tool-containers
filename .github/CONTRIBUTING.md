# Contributing

Create a branch from the latest `main` and give the pull request a Conventional Commit
title, such as `fix(codex): forward CODEX_API_KEY in the Docker recipe`.

Before you open the pull request:

1. Read [`AGENTS.md`](../AGENTS.md) and follow the repository guidance it routes to.
2. Keep credentials and generated runtime state out of the repository.
3. Update the affected documentation and agent guidance when a shared repository
   convention changes. Every category README (`tools/<category>/README.md`), tool
   README, and platform doc needs the YAML frontmatter defined in the
   [documentation skill](../.agents/skills/documentation/SKILL.md). A new tool also
   needs an `order` and a bullet in its category README's `## Tools` section.
4. Run `bash .agents/skills/repository-changes/scripts/validate-change.sh`.

In the pull request body, describe the change and list the validation you ran. The
`Pull request gate` check validates the metadata, dependency changes, and repository
contracts. The `Lint` check must also pass, and for image changes, so must the
affected `<category>-<tool>` image workflows. Resolve review threads before squash
merging, so `main` keeps a concise history.
