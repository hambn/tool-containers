# Repository change workflow

Use this workflow for any task that adds, edits, moves, or removes a repository file.

## 1. Inspect

1. Read [`.agents/README.md`](../README.md), this workflow, and the relevant section of
   [the structure index](../references/structure.md).
2. Read [project memory](../references/memory.md) before editing.
3. Run `git status --short` and inspect the target files, neighboring conventions, tests,
   and any related workflow. Preserve unrelated user changes.
4. State the smallest change that satisfies the request and identify validation before
   making edits.

## 2. Implement

1. Make the smallest coherent change in the canonical location.
2. Keep image build contexts self-contained, deployment examples copy-pasteable, and
   secrets external to the repository.
3. Keep documentation synchronized with the actual tree, catalog, variants, tags, and
   deployment files.
4. If `.agents/` changes, update its exact workspace list in the same patch.

## 3. Remember

Update `.agents/references/memory.md` in the same change. Add only durable facts,
decisions, constraints, and exact validation. Do not copy chat transcripts, secrets, or
speculation.

## 4. Verify

Run the narrowest relevant project checks, then always run:

```sh
bash .agents/commands/check-agent-workspace.sh
git diff --check
```

For documentation-only changes, additionally check links and compare documented file maps
with `find`. For Dockerfiles, run a syntax/build check when the required tooling and
network are available. For workflows, inspect YAML and verify triggers, permissions,
variant selection, tag ownership, and secrets. If a check cannot run, report the exact
blocker rather than implying success.

## Safety

- Do not reset or overwrite unrelated work.
- Do not print or commit credentials, tokens, or secret configuration.
- Avoid destructive operations; if a migration requires removing a legacy file, confirm
  its exact target and preserve the content in the new canonical location first.
