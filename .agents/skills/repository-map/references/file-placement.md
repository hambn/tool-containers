# File placement

Choose a location by ownership first, then copy the shape of the nearest valid neighbor.

| Content | Canonical location |
|---|---|
| Always-on agent triggers | `AGENTS.md` |
| One reusable agent capability | `.agents/skills/<skill>/SKILL.md` |
| Conditional skill detail or deterministic helper | That skill's `references/` or `scripts/` |
| Public repository catalog | `README.md` |
| Image build target, tags, labels | `docker-bake.hcl` |
| Any pinned version, base digest, or `OS_REFRESH` | `versions.hcl` |
| Update-bot rules and custom datasources | `renovate.json5` |
| Vulnerability exceptions | `.trivyignore.yaml` |
| Human GitHub policy/template | `.github/` |
| Repository validation or CI helper (+ its tests) | `.github/scripts/` |
| GitHub automation | `.github/workflows/` |
| One image project | `tools/<category>/<tool>/` |
| Its build definition | `tools/<category>/<tool>/Dockerfile` (one per tool) |
| Its tests | `tools/<category>/<tool>/tests/` |
| One platform example | `tools/<category>/<tool>/examples/<platform>/` |
| Web application source, config, assets, tests | `web-ui/` |

## Coupled changes

- Adding an image tool changes its directory, a `docker-bake.hcl` target plus group
  membership, its `versions.hcl` pin, and one root catalog row. It does not add a
  workflow.
- Adding or renaming a variant changes the bake matrix, Dockerfile stages, tests, tool
  README, and every affected example.
- Bumping a version changes only `versions.hcl` (plus README text that states it).
- Adding a platform example changes only the owning tool and its file map.
- Adding a repository skill changes its own directory; update `AGENTS.md` only for a
  mandatory or deliberately always-on route, and `CLAUDE.md`, docs, or CI only when
  discovery or validation paths change.

## Placement rules

- Keep a tool's build context self-contained; cross-tool inputs come only through bake
  `contexts`.
- Put repository-wide mechanics in `.github/scripts/`, not inline in workflows.
- Keep generated output, dependency directories, runtime state, credentials, and local
  environment files untracked.
- Do not create a top-level directory, category, tier, or shared abstraction for one
  speculative use.
- When a move changes a repeatable path, update callers, links, documentation,
  validation, and this map atomically.
