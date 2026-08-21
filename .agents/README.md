# Agent workspace

This is the canonical, version-controlled home for repository agent guidance. Root
[`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md) are small entry-point
pointers; the actual rules, procedures, and repository structure all live here.

## Always-on rules

1. **Start here and use progressive disclosure.** Open only the resource that matches
   the task; do not load the whole workspace by default.
2. **Inspect before editing.** Read the relevant files, check Git state, and preserve
   unrelated user changes. Separate verified facts from proposed changes.
3. **Keep guidance concrete.** Prefer short imperative rules, exact paths, commands,
   triggers, and observable validation. Keep one canonical home for each fact.
4. **Use the structure index.** For repository or tool documentation work, route from
   [`references/structure.md`](references/structure.md) to the narrowest guide.
5. **Record durable memory.** Every repository-changing task updates
   [`references/memory.md`](references/memory.md) with decisions and validation. Never
   put secrets, raw transcripts, or unsupported guesses there.
6. **Keep this workspace self-describing.** If a path under `.agents/` changes, update
   the exact workspace list below in the same change.
7. **Finish repository changes with:**

   ```sh
   bash .agents/commands/check-agent-workspace.sh
   git diff --check
   ```

## Routing

| Need | Open | Use when |
|------|------|----------|
| Repeatable change procedure | [`workflows/change.md`](workflows/change.md) | Any repository change |
| Repository/tool authoring guide | [`references/structure.md`](references/structure.md) | Adding or editing docs, images, deployments, or CI |
| Durable facts and decisions | [`references/memory.md`](references/memory.md) | Before and after changes or when history matters |
| Workspace integrity check | [`commands/check-agent-workspace.sh`](commands/check-agent-workspace.sh) | After every repository change |
| Memory record shape | [`templates/memory-entry.md`](templates/memory-entry.md) | When adding a memory entry |
| Design principles | [`references/best-practices.md`](references/best-practices.md) | Reorganizing or reviewing this workspace |

Use `agents/`, `prompts/`, `rules/`, and `skills/` only when a concrete reusable
resource is needed. Add one focused resource at a time, give it an explicit “use
when” condition, and update this list whenever it becomes non-empty.

## Workspace list

```text
.agents/ — Canonical, version-controlled agent guidance workspace.
README.md — Always-loaded routing rules and complete workspace path list.
agents/ — Focused subagent definitions; use for bounded specialist work only.
agents/.gitkeep — Preserves the empty agent-definition directory.
commands/ — Deterministic helpers; use from workflows or when a command is requested.
commands/check-agent-workspace.sh — Enforces memory updates and exact workspace-list coverage.
prompts/ — Reusable prompt fragments; add only for a repeated prompt-shaped task.
prompts/.gitkeep — Preserves the empty prompt directory.
references/ — Durable facts and on-demand repository guidance.
references/best-practices.md — Design principles for maintainable agent guidance; use when reviewing this system.
references/memory.md — Curated repository facts, decisions, constraints, and change records; use before and after changes.
references/structure.md — Index for all repository and tool authoring guides; use to route documentation work.
references/repo/ — Repository-wide authoring guides.
references/repo/file-structure.md — Category/tool tree, placeholders, and how to add a tool.
references/repo/registries-and-tags.md — Registry targets, authentication, and deterministic image tags.
references/repo/root-readme.md — Required root catalog structure and maintenance rules.
references/tool/ — Authoring guides for one image project.
references/tool/ci.md — Per-tool workflow triggers, plan/build/push stages, and release rules.
references/tool/deployment/ — Platform-specific deployment authoring guides.
references/tool/deployment/conventions.md — Shared deployment layout, naming, secrets, and mounts.
references/tool/deployment/docker-compose.md — Compose service and air-gapped file rules.
references/tool/deployment/docker-swarm.md — Swarm stack, secrets, network, and resource rules.
references/tool/deployment/docker.md — Docker run scripts and air-gapped image loading.
references/tool/deployment/helm.md — Helm chart layout, values, secrets, and OCI publishing.
references/tool/deployment/kubernetes.md — Apply-ready Kubernetes manifest rules.
references/tool/deployment/podman.md — Rootless Podman run scripts and SELinux mounts.
references/tool/images/ — Image-variant authoring guides.
references/tool/images/base-images.md — Base-image selection and trade-offs.
references/tool/images/dockerfile.md — Dockerfile versioning, layers, security, and runtime rules.
references/tool/images/variants.md — Variant naming, profiles, and tag mapping.
references/tool/readme.md — Required per-tool README sections and file-map rules.
rules/ — Small mandatory policies; add only for a repeated, narrow scope.
rules/.gitkeep — Preserves the empty rules directory.
skills/ — On-demand capabilities; add only when a reusable workflow needs one.
skills/.gitkeep — Preserves the empty skills directory.
templates/ — Copyable artifact skeletons.
templates/memory-entry.md — Minimal schema for a durable memory change record.
workflows/ — Repeatable multi-step procedures.
workflows/change.md — Required inspect, implement, remember, and verify procedure.
```

## Adding resources

- Put mandatory behavior in `rules/`, procedures in `workflows/`, executable checks in
  `commands/`, stable facts in `references/`, reusable task capabilities in `skills/`,
  and copyable shapes in `templates/`.
- Prefer improving an existing resource over adding an overlapping one.
- Keep this entry point concise; move examples and detailed platform material into
  on-demand references.
- After any `.agents/` change, update `references/memory.md`, update this list, then
  run the workspace checker and `git diff --check`.
