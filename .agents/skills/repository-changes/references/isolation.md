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

Default for a newly assigned task: give it its own linked worktree and branch. This is
what lets multiple agents run at the same time without interrupting each other, and it
keeps the primary checkout available for whatever occupies it.

- Before creating the branch, fetch `origin main` and base the worktree on
  `origin/main`, not a potentially stale local `main`.
- Name feature branches `<type>/<kebab-case-slug>`, for example
  `chore/agent-skills-overhaul`.

A safe default shape is:

```sh
task_branch="chore/example-change"
task_worktree="/tmp/tool-containers-example-change"
git fetch origin main && \
  git worktree add -b "$task_branch" "$task_worktree" origin/main
```

Use an explicit, narrow temporary or sibling path. Do not create a recursive worktree
inside the repository.

Work in place only when all of these hold: the user explicitly directs it or the current
branch is already this task's branch, no other agent or task owns that branch, and any
uncommitted changes are absent or explicitly the task-owned changes the user asked to
continue or commit. Otherwise use a linked worktree.

## Multiple agents

One worktree and branch per agent per task is the rule; never share either. If
independent parallel implementation is useful, give each writer a unique branch,
worktree, and non-overlapping file ownership; integrate exact reviewed commits and stop
on conflicts.

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
