# File placement

Choose a location by ownership first, then copy the shape of the nearest valid neighbor.

| Content | Canonical location |
|---|---|
| Always-on agent triggers | `AGENTS.md` |
| One reusable agent capability | `.agents/skills/<skill>/SKILL.md` |
| Conditional skill detail or deterministic helper | Inside that owning skill's `references/` or `scripts/` |
| Public repository catalog | `README.md` |
| Human GitHub policy/template | `.github/` |
| Shared repository validation/helper | `.github/scripts/` |
| GitHub automation | `.github/workflows/` |
| One containerized tool | `images/<category>/<tool>/` |
| One derived image variant | `images/<category>/<tool>/images/<variant>/Dockerfile` |
| One platform example | `images/<category>/<tool>/examples/<platform>/` |
| Web application source, config, assets, and tests | `web-ui/` |

## Coupled changes

- Adding an image tool normally changes its directory, one matching publish workflow,
  and one root catalog row.
- Adding or renaming a public variant changes Dockerfiles, tool documentation, workflow
  planning and tags, and every affected platform example.
- Adding a platform example changes only the owning tool and its file map unless shared
  repository policy also changes.
- Adding a repository skill changes its own directory. Update root `AGENTS.md` only for
  a mandatory or deliberately always-on route; update `CLAUDE.md`, human docs, or CI
  only when discovery or validation paths change.
- Scaffolding the web UI removes `web-ui/.gitkeep`, adds its actual source and
  documentation, and adds path-filtered UI CI. Add a package/lockfile, ignored generated
  outputs, environment contract, and dependency automation only when the selected stack
  uses them.

## Placement rules

- Keep a tool self-contained; its build context and platform examples must not depend
  on an unrelated tool directory unless the shared contract is an explicit published
  base image.
- Put repository-wide mechanics in `.github/scripts/`, not copied into each workflow.
- Keep generated output, dependency directories, runtime state, credentials, and local
  environment files untracked.
- Do not create a new top-level directory, image category, or shared abstraction for one
  speculative use. Establish it when a concrete implementation needs it.
- When a move changes a repeatable path, update callers, local links, documentation,
  validation, and this map atomically.
