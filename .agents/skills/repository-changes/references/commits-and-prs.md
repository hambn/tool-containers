# Commits and pull requests

Read this guide when delivering an assigned repository-changing task or following CI.
Delivering an assigned task means commit, push, and pull request to `main`; only leave
work uncommitted or unpushed when the user explicitly asks for local-only work.

## Commit safely

1. Inspect status, staged and unstaged diffs, untracked files, recent log style, and any
   merge, rebase, or cherry-pick state.
2. Screen for credentials, private keys, tokens, generated artifacts, and unexpected
   files of at least 50 MB.
3. Stage explicit paths with `git add -- <path>...`. Never use `git add .`, `git add -A`,
   or a broad glob that could capture unrelated work.
4. Keep each commit coherent. Split independently useful changes; do not split files that
   must land together for validation to pass.
5. Use a Conventional Commit subject in imperative form, normally at most 72 characters:
   `<type>(<scope>): <summary>`. Supported repository types are `build`, `chore`, `ci`,
   `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, and `test`.
6. Do not add a final period, emoji, AI attribution, or generated co-author trailer.
7. Run validation again, commit without bypassing hooks, then confirm the resulting
   status and commit contents.

## Push

Pushing the task branch is part of standard delivery. Resolve and verify the branch
first; stop if it is detached or `main`:

```sh
branch="$(git branch --show-current)"
if [[ -z "$branch" || "$branch" == main ]]; then
  printf 'refusing to push branch: %s\n' "${branch:-detached HEAD}" >&2
  false
else
  git push -u origin "$branch"
fi
```

On rejection, inspect the remote branch and reconcile safely. Never force-push unless
the user separately authorizes the exact history rewrite.

## Pull request to main

Opening the pull request is the final step of delivering an assigned task.

- Search for an existing open pull request from the same head branch and update it
  instead of opening a duplicate.
- Target `main` and use a Conventional Commit title.
- Start from `.github/pull_request_template.md`. Preserve `## Summary`, `## Validation`,
  and `## Checklist`; record exact results and skipped checks, and mark checklist items
  truthfully rather than deleting them.
- Open a ready-for-review pull request when implementation and required validation are
  complete. Use draft only when the user requests it or the work is explicitly
  incomplete or blocked.
- Inspect the initial `Pull request gate` and labeling results and address in-scope
  failures. Do not repeatedly rerun an unchanged failure.

Repository convention is squash merge. Opening a pull request does not authorize
merging it, deleting its branch, dispatching publication workflows, or changing
repository settings.
