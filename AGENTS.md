# Repository agent guidance

Use the repository skills under `.agents/skills/` through progressive disclosure:

- Use `$repository-changes` for every task that adds, edits, moves, or removes a
  repository file.
- Use `$repository-map` when locating code, deciding where a new file belongs, or
  changing the repository layout.
- Use `$container-images` for anything under `images/`, the image catalog, deployment
  examples, registries and tags, or image publication workflows.
- Use `$web-ui` for product, design, implementation, testing, build, deployment, or CI
  work whose primary target is `web-ui/`.
- Use `$maintain-agent-workspace` after every repository-changing task and whenever
  agent guidance is created, corrected, reorganized, or removed.

Load only the selected `SKILL.md` files and the references they route to. Preserve
unrelated work, keep secrets and generated state out of Git, and treat the repository
and its validation scripts as the source of truth for facts that can be discovered.

## Task isolation and delivery

When the user assigns a new implementation task, do not work in a checkout another task
owns. Create a dedicated linked worktree with its own branch based on freshly fetched
`origin/main`, implement there, then finish the task by committing, pushing the branch,
and opening a pull request to `main`. This lets multiple agents run at the same time
without interrupting each other. `$repository-changes` owns the exact procedure.
