# Registries and tags

## Registry targets

| Registry | Image path | Authentication |
|---|---|---|
| GHCR | `ghcr.io/<owner>/<tool>` | repository `GITHUB_TOKEN` |
| Docker Hub | `docker.io/<owner>/<tool>` | `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` |
| Quay.io | `quay.io/<owner>/<tool>` | future `QUAY_USERNAME` and `QUAY_TOKEN` if enabled |

Current workflows build and push to GHCR by digest, then copy the exact digest to Docker
Hub. Quay is a documented candidate, not a current target; enable its authentication,
matrix entry, target mapping, documentation, and validation together.

## Moving and immutable tags

Exactly one primary variant owns `latest`; every variant owns its matching `<variant>`
moving tag. Workflows repoint moving tags only from the digest fan-out stage.

Immutable primary release tags currently are:

| Tool | Release tag |
|---|---|
| `agentbloat` | `<agent>-v<version>` for each changed packaged agent |
| `claude-code` | `claude-code-v<version>` |
| `codex` | `codex-v<version>` |
| `open-code-review` | `ocr-v<version>` |
| `pi-agent` | `pi-v<version>` |
| `omnigent` | `omnigent-v<version>` |
| `t3code` | `t3code-stable-v<version>` or `t3code-nightly-v<version>` |

Release tags are primary-only unless an actual consumer and workflow define another
mapping. Derived tools do not publish a universal
`<variant>-<version>-<base-sha>` family. Never repoint an existing immutable tag or add a
tag family without changing the workflow, validation, and docs together.

## Foundation exception

`base/agentimg` has no independently versioned upstream package:

- A source push affecting a variant Dockerfile or its shared distro assets publishes
  `<variant>-<12-character-commit-sha>` for each affected variant, plus its moving tag
  and primary `latest` where applicable.
- A scheduled base/package refresh rebuilds all variants and publishes moving tags only.
- A manual rebuild publishes moving tags only unless explicitly tied to a source commit.

This keeps source changes traceable without producing an immutable tag for every routine
package refresh.

Helm charts stay local by default. If chart publication is deliberately enabled, use
GHCR OCI at `oci://ghcr.io/<owner>/charts/<tool>` and update chart docs and release
automation together.
