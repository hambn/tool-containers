# Repository skill design

Use these rules when creating, splitting, merging, or repairing repository-local skills.

## Ownership model

Each durable fact has one canonical owner:

| Concern | Owner |
|---|---|
| Agent-system lifecycle and integrity | `maintain-agent-workspace` |
| Repository orientation and file placement | `repository-map` |
| Container projects, deployments, and image delivery | `container-images` |
| The application under `web-ui/` | `web-ui` |
| Change isolation, validation, commits, and pull requests | `repository-changes` |

Link to the owner instead of copying its details into another skill. A short dependency
statement is acceptable when it changes the current workflow.

## Progressive disclosure

Skill information has three layers:

1. `name` and `description` decide whether the skill is selected. Keep the description
   concise, concrete, and discriminating.
2. `SKILL.md` contains the shared workflow, boundaries, and routing decisions needed for
   every invocation.
3. `references/` contains task-specific detail and `scripts/` contains repeated,
   deterministic mechanics. Link each supporting file from `SKILL.md` or another
   reachable reference and say when it is needed.

Do not add placeholder directories, a skill README, a changelog, a copied manual, or a
generic tutorial. Prefer one well-scoped skill over several skills that always need to
be loaded together. Split a skill only when its modes have meaningfully different
triggers or most invocations otherwise load irrelevant material.

## Content test

Keep an instruction only when it is repository-specific, non-obvious, repeated, risky,
or necessary to preserve user intent. Use imperative language, exact paths, and
observable checks where correctness matters. Leave ordinary implementation choices to
the agent unless the repository has an established constraint.

Before finishing a skill change, check:

- The folder and frontmatter names match and use lowercase hyphenated names.
- The description explains both the capability and when it applies.
- Boundaries prevent likely overlap without becoming an exhaustive exclusion list.
- Conditional detail is reachable without being loaded by default.
- Current instructions replace stale guidance instead of accumulating history.
- Skill metadata still discovers every skill; root routing names only mandatory
  cross-cutting triggers and deliberately always-on domain routes.

## Lifecycle

- **Add:** repeated work has a distinct trigger and needs durable repository context.
- **Expand:** new behavior belongs to the same trigger and responsibility.
- **Split:** independent triggers or large unrelated modes are being selected together.
- **Merge:** skills overlap so strongly that callers routinely need both.
- **Remove:** the capability, contract, or repository area no longer exists.
- **Repair:** a real failure identifies incorrect scope, instruction, or enforcement.

After any lifecycle change, update callers, local links, and validation in the same
patch. Update root routing only when a mandatory or deliberately always-on route changes;
do not duplicate every optional skill in the always-loaded prompt. Use Git history for
removed text if it is ever needed.
