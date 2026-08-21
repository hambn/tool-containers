# Branch and worktree isolation

Read this guide before choosing where repository changes will be made.

## Inspect first

Run:

```sh
git status --short --branch
git worktree list --porcelain
git branch --show-current
```

Treat uncommitted files and an occupied branch as owned work. Do not stash, reset,
overwrite, clean, or move it merely to start another task.

## Choose the workspace

- Work in place when the branch is intended for this task, no other agent is using it,
  and any uncommitted changes are either absent or explicitly the task-owned changes the
  user asked to continue or commit.
- Use a linked worktree when uncommitted changes are unrelated or owned by someone else,
  the branch belongs to another task, or agents are working concurrently.
- Before creating a publishable branch, fetch `origin main` and branch from
  `origin/main`, not a potentially stale local `main`.
- Name feature branches `<type>/<kebab-case-slug>`, for example
  `chore/agent-skills-overhaul`.

A safe linked-worktree shape is:

```sh
task_branch="chore/example-change"
task_worktree="/tmp/tool-containers-example-change"
git fetch origin main && \
  git worktree add -b "$task_branch" "$task_worktree" origin/main
```

Use an explicit, narrow temporary or sibling path. Do not create a recursive worktree
inside the repository.

## Multiple agents

Prefer one writable integration worktree and read-only specialist audits. If independent
parallel implementation is useful, give each writer a unique branch, worktree, and
non-overlapping file ownership; integrate exact reviewed commits and stop on conflicts.

Never let two agents edit one worktree, share one branch across worktrees, remove a
worktree another agent owns, or force cleanup. Keep a recovery worktree until its branch
is safely integrated or pushed.

## Failure boundaries

- If fetch fails, continue only if a stale base is acceptable to the user; never claim it
  is the latest `main`.
- If a target branch already exists, inspect its worktree and history instead of deleting
  or replacing it.
- If integration conflicts, preserve both sides and resolve only within the requested
  scope; ask when the intended result is ambiguous.
