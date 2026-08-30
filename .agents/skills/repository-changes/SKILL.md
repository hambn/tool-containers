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
- Read [commits and pull requests](references/commits-and-prs.md) when delivering an
  assigned task (commit, push, pull request) or following its CI and review to merge.

## Workflow

1. Inspect `git status --short --branch`, the target files, neighboring conventions,
   and relevant tests before editing. Preserve unrelated work.
2. Isolate the task using the isolation guide. A newly assigned task defaults to its own
   linked worktree and branch based on freshly fetched `origin/main`, so concurrent
   agents never share a checkout or branch; work in place only in the exceptions the
   guide allows.
3. Make the smallest coherent change. Load `$repository-map` or the matching domain
   skill for repository-specific placement and authoring rules.
4. Review the full diff for correctness, scope, credentials, generated files, and
   documentation drift.
5. Invoke `$maintain-agent-workspace` for its final audit. Update agent guidance only
   when a durable contract changed.
6. Run [the change validator](scripts/validate-change.sh) plus any targeted checks from
   the verification guide. State every skipped check and its reason.
7. Deliver the task: commit on the task branch, push it, and open a pull request to
   `main` as described in the commits and pull requests guide. Skip publication only
   when the user explicitly asks for uncommitted or local-only work.
8. After opening the pull request, watch its checks and resolve in-scope review
   feedback on the branch. Stop and report the pull request's status when it is ready.
   Do not merge it automatically. Merge only after the user explicitly authorizes the
   selected pull request, timing or conditions, merge method, and branch-deletion choice
   as described in the guide.

Answering, explaining, diagnosing, or reviewing does not by itself authorize edits,
commits, pushes, pull requests, workflow dispatches, or repository-setting changes.
Merging is a separate, user-controlled action. A passing check, an open pull request,
or the fact that the agent created it is not merge authorization. Never discard another
person's work to make a checkout clean.
