---
name: maintain-agent-workspace
description: Maintain, review, repair, or reorganize repository agent guidance, including AGENTS.md, CLAUDE.md, and project skills. Use after repository changes to keep durable agent contracts synchronized, and when guidance is reported wrong, stale, inefficient, duplicated, or missing.
---

# Maintain the agent workspace

Keep the repository's agent guidance accurate, small at discovery time, and detailed
only after a relevant skill is selected. Scope includes every tracked project-level
agent entry point, skill, compatibility file, helper, and validation integration, not
only the paths that exist today.

## Required audit

Run this audit after every repository-changing task, even when the requested change is
outside `.agents/`. An audit may correctly conclude that no agent file needs to change.

1. Inspect the final diff and identify any changed durable contract: repository layout,
   ownership, naming, workflow, validation, public interface, security boundary, or
   recurring failure mode.
2. Find the skill that owns that contract. Update the canonical instruction only when
   the change would affect how a future agent should work.
3. Create, merge, rename, or remove a skill when its trigger or responsibility has
   materially changed. Do not preserve obsolete guidance as historical memory.
4. Synchronize `AGENTS.md`, `CLAUDE.md`, documentation links, and CI validation whenever
   discovery paths or required checks change.
5. During focused iteration, run [the workspace checker](scripts/check-agent-workspace.sh).
   Finish with the validation routed by `$repository-changes`, which includes this
   checker. Do not run it twice solely for handoff.

Read [skill design](references/skill-design.md) before changing skill boundaries,
frontmatter, supporting resources, or the workspace checker. Use the
[regression scenarios](references/regression-scenarios.md) when correcting behavior, and
run [the checker tests](scripts/test-check-agent-workspace.sh) after changing the checker.

## Sources of truth

- Put current, durable, non-obvious instructions in the narrowest owning skill.
- Discover volatile facts from tracked files, Git, or an authoritative external source
  at task time; do not copy them into a memory log.
- Keep historical rationale in Git history, pull requests, or a purpose-built ADR when
  the repository actually needs one.
- Never store secrets, raw conversations, speculative plans, or a chronological work log
  in agent guidance.

## Repair behavior

When the user says the guidance or a skill behaved incorrectly, treat that as an
observed failure:

1. Reproduce or precisely locate the bad instruction, trigger, omission, or validation.
2. Correct the smallest canonical resource and remove conflicting or stale wording.
3. Update deterministic validation when the corrected invariant can be checked safely.
4. Test the realistic triggering case and a nearby case that should not trigger the
   skill. Do not turn one example into a universal rule without evidence.

If this skill itself caused the failure, repair this skill. Update the checker only when
the corrected invariant is mechanically checkable.
