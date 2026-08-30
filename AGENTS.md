# Repository agent guidance

Use the repository skills under `.agents/skills/` through progressive disclosure:

- Use `$repository-changes` for every task that adds, edits, moves, or removes a
  repository file.
- Use `$repository-map` when locating code, deciding where a new file belongs, or
  changing the repository layout.
- Use `$container-images` for anything under `images/`, the image catalog, platform
  examples, registries and tags, or image publication workflows.
- Use `$documentation` when writing, editing, or reviewing any README or document in
  this repository — catalog, tool, or platform example docs — and their cross-links.
- Use `$web-ui` for product, design, implementation, testing, build, deployment, or CI
  work whose primary target is `web-ui/`.
- Use `$maintain-agent-workspace` after every repository-changing task and whenever
  agent guidance is created, corrected, reorganized, or removed.

Load only the selected `SKILL.md` files and the references they route to. Preserve
unrelated work, keep secrets and generated state out of Git, and treat the repository
and its validation scripts as the source of truth for facts that can be discovered.

## Task isolation and delivery

When the user assigns a new implementation task, follow `$repository-changes`. By
default, create a dedicated linked worktree with its own branch based on freshly fetched
`origin/main`, then finish the task by committing, pushing the branch, and opening a pull
request to `main`. Stop after reporting its status. Do not merge automatically; wait for
the user to identify which pull request to merge, when its conditions are met, which
merge method to use, and whether to delete its branch. This default lets multiple
agents run at the same time without interrupting each other; the guide defines the
narrow work-in-place and local-only exceptions.
