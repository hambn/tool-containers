# File placement

Choose by ownership, then follow the closest valid neighbor.

| Content | Canonical location |
|---|---|
| Agent triggers | `AGENTS.md` |
| Agent capability and references | `.agents/skills/<skill>/` |
| Public catalog | `README.md` |
| Image targets, tags, labels | `src/tools/docker-bake.hcl` |
| Version and base pins | `src/tools/versions.hcl` |
| One image project | `src/tools/<category>/<tool>/` |
| Image tests | `src/tools/<category>/<tool>/tests/` |
| Platform examples | `src/tools/<category>/<tool>/examples/<platform>/` |
| Go CI, validation, maintenance and tests | `src/ci/` |
| Web application | `src/web-ui/` |
| GitHub workflow YAML | `.github/workflows/` |
| Renovate rules | `.github/renovate.json5` |

Adding an image changes its directory, a Bake target and membership in published `all`, any pins, tests and documentation. It requires no Go or workflow YAML edit. Keep a tool's context self-contained; use Bake named contexts for cross-tool inputs. Put repository-wide decision-making in the Go CLI and keep workflow steps small. Keep generated output and credentials out of Git.

When a move changes a repeatable path, update callers, links, documentation, validation and this map in one change.
