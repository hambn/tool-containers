---
name: repository-changes
description: Implement, isolate, verify, commit, and publish changes in tool-containers. Use for any task that adds, edits, moves, or removes repository files, including concurrent-agent worktrees, Conventional Commits, pushes, pull requests to main, and CI follow-up.
---

# Repository changes

Use this workflow for every repository mutation. Read only the supporting guide needed
for the current phase:

- Read [isolation](references/isolation.md) before creating or selecting a branch or
  worktree, and whenever multiple agents or existing changes are involved.
- Read [verification](references/verification.md) before deciding or reporting which
  checks are required.
- Read [commits and pull requests](references/commits-and-prs.md) only when the user asks
  to commit, push, open or update a pull request, or follow CI.

## Workflow

1. Inspect `git status --short --branch`, the target files, neighboring conventions,
   and relevant tests before editing. Preserve unrelated work.
2. Establish safe ownership of the checkout using the isolation guide. Base new work on
   a freshly fetched `origin/main` when publication is authorized and network access is
   available.
3. Make the smallest coherent change. Load `$repository-map` or the matching domain
   skill for repository-specific placement and authoring rules.
4. Review the full diff for correctness, scope, credentials, generated files, and
   documentation drift.
5. Invoke `$maintain-agent-workspace` for its final audit. Update agent guidance only
   when a durable contract changed.
6. Run [the change validator](scripts/validate-change.sh) plus any targeted checks from
   the verification guide. State every skipped check and its reason.
7. Commit and publish only to the extent explicitly requested.

Answering, explaining, diagnosing, or reviewing does not by itself authorize edits,
commits, pushes, pull requests, merges, workflow dispatches, or repository-setting
changes. Never discard another person's work to make a checkout clean.
