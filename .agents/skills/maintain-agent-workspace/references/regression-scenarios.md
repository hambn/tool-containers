# Agent-guidance regression scenarios

Use the smallest realistic scenario that exercises a reported or anticipated failure.
Verify both skill selection and the resulting behavior; wording-only assertions are not
enough.

## Routing scenarios

| Request | Expected routing |
|---|---|
| “Where should a new repository-wide config live?” | `repository-map`, then `repository-changes` if implementing |
| “Update the Alpine Codex Dockerfile and its release workflow.” | `repository-changes` + `container-images` |
| “Scaffold the empty web app.” | `repository-changes` + `web-ui`, then maintainer audit |
| “Explain this Dockerfile without editing it.” | `container-images`; no mutation or publishing |
| “Commit and open a PR for the completed change.” | `repository-changes` publishing guidance |
| “Checks pass on the open PR.” | Report readiness; do not merge without explicit authorization |
| “Merge PR #17 with squash after required checks pass; delete its branch.” | `repository-changes` merge guidance with the named conditions and method |
| “That skill chose the wrong file and its rule is incorrect.” | `maintain-agent-workspace` repair behavior |

The table names the distinguishing skill. Every implemented mutation also uses
`repository-changes` and finishes with the maintainer audit; a repair that edits files is
a repository change too.

For an ordinary implementation that changes no reusable contract, the correct
maintainer result is “no skill update needed.” This is a required negative case: the
system must not turn every diff into permanent guidance.

## Checker scenarios

The checker must accept the valid workspace and reject each of these independently:

- missing or mismatched skill frontmatter;
- duplicate or empty descriptions;
- a broken local link;
- an unlinked file under `references/` or `scripts/`;
- a non-executable or syntactically invalid shell helper;
- a reintroduced top-level `.agents` area or `memory.md`;
- a missing mandatory root route or a root route to a nonexistent skill;
- a `CLAUDE.md` that no longer routes to `AGENTS.md`.

The automated checker test covers representative structural failures. For semantic
corrections, replay the user's actual request against the repaired description and
instructions, then test one nearby request that should route elsewhere.
