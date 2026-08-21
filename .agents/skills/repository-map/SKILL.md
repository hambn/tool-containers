---
name: repository-map
description: Map the purpose, ownership, and canonical placement of files and directories in tool-containers. Use when locating an area or owner, choosing a path for new content, or changing directory, workflow, tool, or catalog structure. Do not use for ordinary content edits in an already-known file; use its owning domain skill.
---

# Repository map

Use this skill for orientation and placement, not as a substitute for inspecting the
live tree.

- Read [layout](references/layout.md) to understand current areas, ownership, and
  repeatable path patterns.
- Read [file placement](references/file-placement.md) before adding or moving content.

Start exact inventory with `git ls-files` or `rg --files`; narrow it with `rg`, `find`,
and neighboring files. The map is intentionally semantic rather than a duplicated list
of every tracked file.

When implementation follows, use `$repository-changes` and the owning domain skill.
After changing a top-level area or repeatable path contract, update this map through
`$maintain-agent-workspace` in the same change.
