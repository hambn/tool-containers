# Contributing

Create a focused branch from the latest `main` and use a Conventional Commit title for
the pull request, such as `fix(agentimg): preserve runtime ownership`.

Before opening a pull request:

1. Read [`AGENTS.md`](../AGENTS.md) and follow the routed repository guidance.
2. Keep credentials and generated runtime state out of the repository.
3. Update affected documentation and run the agent-maintenance audit described by
   `$maintain-agent-workspace`.
4. Run `bash .agents/skills/repository-changes/scripts/validate-change.sh`.

Describe the change and list exact validation in the pull request body. Resolve review
threads before merge, and use squash merge so `main` retains a concise history.
