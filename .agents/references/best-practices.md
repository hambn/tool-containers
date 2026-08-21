# Agent workspace best practices

Use this reference when reviewing or reorganizing `.agents/`. It keeps the workspace
small enough to use reliably while still making repository-specific behavior explicit.

## Applied design

1. **One predictable entry point.** `.agents/README.md` is the always-loaded router;
   root pointer files contain no competing rules.
2. **Progressive disclosure.** Stable routing stays in the entry point. Detailed Docker,
   deployment, registry, and CI material loads only for the task that needs it.
3. **One canonical home per fact.** Do not repeat tag schemes or file-layout rules in
   tool READMEs when a reference already owns them; link to the canonical guide.
4. **Guidance and enforcement are separate.** Markdown explains intent and workflow;
   `check-agent-workspace.sh`, `git diff --check`, CI, and project commands verify what
   can be checked mechanically.
5. **Small, scoped resources.** A rule is mandatory and narrow, a workflow is a repeatable
   procedure, a reference is durable context, and a skill or prompt is on-demand behavior.
6. **Evidence before claims.** Inspect the repository and Git state before editing, and
   record only verified facts, decisions, constraints, and validation in memory.
7. **Least privilege and safe scope.** Preserve unrelated changes, never commit secrets,
   and avoid destructive operations unless the requested migration requires them.

## Maintenance test

Before adding a resource, ask:

- Is the need repository-specific, repeated, or materially risky?
- Is this the narrowest correct directory and canonical location?
- Does it say exactly when an agent should load it?
- Are the instructions concrete, non-conflicting, and verifiable?
- Can large examples stay in an on-demand reference instead of the entry point?
- Are memory, the workspace list, and the checker still correct?
